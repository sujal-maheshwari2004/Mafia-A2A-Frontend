import { useCallback, useRef, useState } from 'react'
import type {
  ConnectionStatus,
  GameConfig,
  GameEvent,
  PhaseName,
  TimelineItem,
} from './types'

export interface GameState {
  status: ConnectionStatus
  error: string | null
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

export function useGameSocket() {
  const [state, setState] = useState<GameState>(initialState)
  const socketRef = useRef<WebSocket | null>(null)

  const connect = useCallback((url: string, config: GameConfig) => {
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

    socket.onopen = () => {
      setState((s) => ({ ...s, status: 'open' }))
      socket.send(JSON.stringify(config))
    }

    socket.onerror = () => {
      setState((s) => ({ ...s, status: 'error', error: 'WebSocket connection error' }))
    }

    socket.onclose = () => {
      setState((s) => (s.status === 'error' ? s : { ...s, status: 'closed' }))
    }

    socket.onmessage = (ev) => {
      let event: GameEvent
      try {
        event = JSON.parse(ev.data)
      } catch {
        return
      }
      setState((s) => applyEvent(s, event))
    }
  }, [])

  const disconnect = useCallback(() => {
    socketRef.current?.close()
    socketRef.current = null
    setState(initialState)
  }, [])

  return { state, connect, disconnect }
}

function applyEvent(s: GameState, event: GameEvent): GameState {
  switch (event.type) {
    case 'game_started':
      return {
        ...s,
        players: event.players,
        alive: new Set(event.players),
        timeline: s.timeline,
      }

    case 'phase_started':
      return {
        ...s,
        phase: event.phase,
        dayNumber: event.day_number,
        present: new Set(event.present),
        lastSpeaker: null,
        timeline: [...s.timeline, { kind: 'phase', data: event }],
      }

    case 'table_talk':
      return {
        ...s,
        lastSpeaker: event.sender,
        timeline: [...s.timeline, { kind: 'talk', data: event }],
      }

    case 'night_resolved': {
      const alive = new Set(s.alive)
      if (event.killed) alive.delete(event.killed)
      return {
        ...s,
        alive,
        lastSpeaker: null,
        timeline: [...s.timeline, { kind: 'night', data: event }],
      }
    }

    case 'day_resolved': {
      const alive = new Set(s.alive)
      if (event.lynched) alive.delete(event.lynched)
      return {
        ...s,
        alive,
        lastSpeaker: null,
        timeline: [...s.timeline, { kind: 'day', data: event }],
      }
    }

    case 'game_ended':
      return {
        ...s,
        winner: event.winner,
        roles: event.roles,
        finished: true,
        lastSpeaker: null,
        timeline: [...s.timeline, { kind: 'end', data: event }],
      }

    case 'error':
      return { ...s, status: 'error', error: event.message }

    default:
      return s
  }
}
