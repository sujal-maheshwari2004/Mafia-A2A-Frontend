import { useEffect, useState } from 'react'
import { PlayerTable } from './components/PlayerTable'
import { Transcript } from './components/Transcript'
import { WaitingRoom } from './components/WaitingRoom'
import { useGameSocket } from './useGameSocket'
import { formatClock, formatCountdown, nextHourBoundary, useCountdown } from './schedule'
import type { GameConfig } from './types'

// Fully automatic spectator: fixed backend, fixed roster, no viewer controls.
const WS_URL = 'wss://mafia-a2a-909729949991.asia-south1.run.app/ws/game'
const GAME_CONFIG: GameConfig = { count: 7, brain: 'llm', model: 'gpt-4o-mini' }
const RETRY_DELAY_MS = 15_000

function App() {
  const { state, connect } = useGameSocket()
  const [nextGameAt, setNextGameAt] = useState(() => nextHourBoundary())
  const { remainingMs, reached } = useCountdown(nextGameAt)

  // The moment this hour's slot arrives, dial in.
  useEffect(() => {
    if (reached && state.status !== 'open' && state.status !== 'connecting') {
      connect(WS_URL, GAME_CONFIG)
    }
  }, [reached, state.status, connect])

  // Once a game wraps up, queue up the next hourly slot.
  useEffect(() => {
    if (state.finished) {
      setNextGameAt(nextHourBoundary())
    }
  }, [state.finished])

  // A dropped or failed connection shouldn't cost viewers the rest of the hour.
  useEffect(() => {
    if (!reached) return
    if (state.status !== 'closed' && state.status !== 'error') return
    if (state.players.length > 0) return // this slot's game already played out
    const id = setTimeout(() => connect(WS_URL, GAME_CONFIG), RETRY_DELAY_MS)
    return () => clearTimeout(id)
  }, [reached, state.status, state.players.length, connect])

  if (state.players.length === 0) {
    return <WaitingRoom nextGameAt={nextGameAt} remainingMs={remainingMs} status={state.status} error={state.error} />
  }

  const aliveCount = state.alive.size
  const totalCount = state.players.length

  return (
    <div className="mx-auto flex h-screen max-w-6xl flex-col gap-4 overflow-hidden p-4 sm:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-white">Mafia — Live Spectate</h1>
          <p className="text-xs text-white/40">
            {aliveCount} of {totalCount} players remaining
            {state.phase ? ` · ${state.phase} ${state.dayNumber}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {state.finished && (
            <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs text-white/45">
              Next game {formatClock(nextGameAt)} · {formatCountdown(remainingMs)}
            </span>
          )}
          <StatusPill status={state.status} finished={state.finished} />
        </div>
      </header>

      {state.error && (
        <div className="rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-300">
          {state.error}
        </div>
      )}

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[1.1fr_1fr]">
        <section className="flex min-h-0 flex-col overflow-y-auto rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-6">
          <PlayerTable
            players={state.players}
            alive={state.alive}
            present={state.present}
            roles={state.roles}
            lastSpeaker={state.lastSpeaker}
            phase={state.phase}
            dayNumber={state.dayNumber}
            finished={state.finished}
            winner={state.winner}
          />
          <Legend />
        </section>

        <section className="flex min-h-0 flex-col rounded-2xl border border-white/10 bg-white/[0.02] p-3 sm:p-4">
          <h2 className="mb-2 px-1 text-xs font-medium uppercase tracking-wider text-white/40">
            Table talk
          </h2>
          <div className="min-h-0 flex-1">
            <Transcript items={state.timeline} />
          </div>
        </section>
      </div>
    </div>
  )
}

function StatusPill({ status, finished }: { status: string; finished: boolean }) {
  if (finished) {
    return (
      <span className="rounded-full border border-violet-400/40 bg-violet-400/10 px-2.5 py-1 text-xs font-medium text-violet-200">
        Game over
      </span>
    )
  }
  const map: Record<string, { label: string; cls: string }> = {
    open: { label: 'Live', cls: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300' },
    connecting: { label: 'Connecting…', cls: 'border-amber-400/40 bg-amber-400/10 text-amber-300' },
    closed: { label: 'Disconnected', cls: 'border-white/15 bg-white/[0.04] text-white/50' },
    error: { label: 'Error', cls: 'border-red-400/40 bg-red-400/10 text-red-300' },
  }
  const s = map[status] ?? map.closed
  return (
    <span className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${s.cls}`}>
      {status === 'open' && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />}
      {s.label}
    </span>
  )
}

function Legend() {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-[11px] text-white/35">
      <span className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full border border-violet-300 bg-violet-400/40" /> speaking
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full border border-white/25 bg-white/10" /> awake / present
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full border border-white/10 bg-white/[0.02]" /> asleep
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full border border-white/10 bg-black/30 grayscale">💀</span> eliminated
      </span>
    </div>
  )
}

export default App
