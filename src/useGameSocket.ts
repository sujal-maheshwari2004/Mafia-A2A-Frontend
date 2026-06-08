import { useCallback, useRef, useState } from 'react'
import type {
  ConnectionStatus,
  Mode,
  PhaseName,
  ServerFrame,
  TimelineItem,
} from './types'

export interface GameState {
  status: ConnectionStatus
  error: string | null
  /** What the table looks like right now -- null until the server's first status frame arrives. */
  mode: Mode | null
  /** When the next scheduled game starts -- null while one is already live. */
  nextGameAt: Date | null
  players: string[]
  alive: Set<string>
  roles: Record<string, string>
  phase: PhaseName | null
  dayNumber: number
  present: Set<string>
  winner: 'Town' | 'Mafia' | null
  timeline: TimelineItem[]
  lastSpeaker: string | null
  finished: boolean
}

const initialState: GameState = {
  status: 'idle',
  error: null,
  mode: null,
  nextGameAt: null,
  players: [],
  alive: new Set(),
  roles: {},
  phase: null,
  dayNumber: 0,
  present: new Set(),
  winner: null,
  timeline: [],
  lastSpeaker: null,
  finished: false,
}

/** Fresh per-game fields, reset whenever a `game_started` frame lands -- whether
 *  it's the very first game of the session or the next one in the same broadcast. */
const freshGame = {
  roles: {},
  phase: null,
  dayNumber: 0,
  present: new Set<string>(),
  winner: null,
  timeline: [] as TimelineItem[],
  lastSpeaker: null,
  finished: false,
}

export function useGameSocket() {
  const [state, setState] = useState<GameState>(initialState)
  const socketRef = useRef<WebSocket | null>(null)

  const connect = useCallback((url: string) => {
    socketRef.current?.close()
    setState({ ...initialState, status: 'connecting' })

    let socket: WebSocket
    try {
      socket = new WebSocket(url)
    } catch {
      setState((s) => ({ ...s, status: 'error', error: `Could not open ${url}` }))
      return
    }
    socketRef.current = socket

    // `connect` can be called again before this socket finishes closing (a
    // dropped connection retrying, or React's dev-mode double-effect) -- a
    // superseded socket's late `onclose`/`onerror` must not clobber the
    // *new* one's state, so every handler checks it's still the current one.
    const isCurrent = () => socketRef.current === socket

    // No handshake needed -- the shared game has nothing to configure. The
    // server starts streaming the moment the connection is accepted.
    socket.onopen = () => {
      if (!isCurrent()) return
      setState((s) => ({ ...s, status: 'open' }))
    }

    socket.onerror = () => {
      if (!isCurrent()) return
      setState((s) => ({ ...s, status: 'error', error: 'WebSocket connection error' }))
    }

    socket.onclose = () => {
      if (!isCurrent()) return
      setState((s) => (s.status === 'error' ? s : { ...s, status: 'closed' }))
    }

    socket.onmessage = (ev) => {
      if (!isCurrent()) return
      let frame: ServerFrame
      try {
        frame = JSON.parse(ev.data)
      } catch {
        return
      }
      setState((s) => applyFrame(s, frame))
    }
  }, [])

  return { state, connect }
}

function applyFrame(s: GameState, frame: ServerFrame): GameState {
  switch (frame.type) {
    case 'status':
      return {
        ...s,
        mode: frame.mode,
        nextGameAt: frame.next_game_at ? new Date(frame.next_game_at) : null,
      }

    case 'game_started':
      // A fresh table -- whether this is the first game of the session or the
      // next one picking up where the last left off, start its timeline clean.
      return {
        ...s,
        ...freshGame,
        players: frame.players,
        alive: new Set(frame.players),
      }

    case 'phase_started':
      return {
        ...s,
        phase: frame.phase,
        dayNumber: frame.day_number,
        present: new Set(frame.present),
        lastSpeaker: null,
        timeline: [...s.timeline, { kind: 'phase', data: frame }],
      }

    case 'table_talk':
      return {
        ...s,
        lastSpeaker: frame.sender,
        timeline: [...s.timeline, { kind: 'talk', data: frame }],
      }

    case 'night_resolved': {
      const alive = new Set(s.alive)
      if (frame.killed) alive.delete(frame.killed)
      return {
        ...s,
        alive,
        lastSpeaker: null,
        timeline: [...s.timeline, { kind: 'night', data: frame }],
      }
    }

    case 'day_resolved': {
      const alive = new Set(s.alive)
      if (frame.lynched) alive.delete(frame.lynched)
      return {
        ...s,
        alive,
        lastSpeaker: null,
        timeline: [...s.timeline, { kind: 'day', data: frame }],
      }
    }

    case 'game_ended':
      return {
        ...s,
        winner: frame.winner,
        roles: frame.roles,
        finished: true,
        lastSpeaker: null,
        timeline: [...s.timeline, { kind: 'end', data: frame }],
      }

    case 'error':
      return { ...s, status: 'error', error: frame.message }

    default:
      return s
  }
}
