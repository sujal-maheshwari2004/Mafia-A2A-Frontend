import { useEffect, useMemo } from 'react'
import { PlayerTable } from './components/PlayerTable'
import { Transcript } from './components/Transcript'
import { VoteBoard } from './components/VoteBoard'
import { WaitingRoom } from './components/WaitingRoom'
import { useGameSocket } from './useGameSocket'
import { useRoleReveal } from './useRoleReveal'
import { formatClock, formatCountdown, useCountdown } from './schedule'
import type { ConnectionStatus, Mode } from './types'

// Fully automatic spectator: one fixed backend streaming the one shared,
// hourly scheduled game. Nothing for a viewer to configure or wait through --
// connect once, and the server catches you up on whatever's on the table
// (live, or the last game's replay) and keeps the feed open across games.
const WS_URL = 'wss://mafia-a2a-909729949991.asia-south1.run.app/ws/game'
const RETRY_DELAY_MS = 5_000

function App() {
  const { state, connect } = useGameSocket()

  // A fresh table gets a fresh peek -- if a viewer's already revealed seats
  // and the next game sits down, this re-fetches rather than showing stale cards.
  const gameKey = useMemo(() => state.players.join('|'), [state.players])
  const reveal = useRoleReveal(WS_URL, gameKey)
  const displayRoles = useMemo(
    () => (reveal.roles ? { ...reveal.roles, ...state.roles } : state.roles),
    [reveal.roles, state.roles],
  )

  useEffect(() => {
    connect(WS_URL)
  }, [connect])

  // The server is the source of truth for the schedule and the transcript --
  // if the socket drops, just reopen it and let the next snapshot catch us up.
  useEffect(() => {
    if (state.status !== 'closed' && state.status !== 'error') return
    const id = setTimeout(() => connect(WS_URL), RETRY_DELAY_MS)
    return () => clearTimeout(id)
  }, [state.status, connect])

  if (state.players.length === 0) {
    return <WaitingRoom mode={state.mode} nextGameAt={state.nextGameAt} error={state.error} />
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
          {state.mode === 'replay' && state.nextGameAt && <NextGamePill nextGameAt={state.nextGameAt} />}
          <RevealToggle
            revealed={reveal.revealed}
            loading={reveal.loading}
            error={reveal.error}
            onToggle={reveal.toggle}
          />
          <ModeBadge mode={state.mode} />
          <ConnectionNotice status={state.status} />
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
            roles={displayRoles}
            lastSpeaker={state.lastSpeaker}
            phase={state.phase}
            dayNumber={state.dayNumber}
            finished={state.finished}
            winner={state.winner}
          />
          <VoteBoard votes={state.votes} voterCount={state.alive.size} />
          <Legend revealed={reveal.revealed} />
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

function NextGamePill({ nextGameAt }: { nextGameAt: Date }) {
  const { remainingMs } = useCountdown(nextGameAt)
  return (
    <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs text-white/45">
      Next live game {formatClock(nextGameAt)} · {formatCountdown(remainingMs)}
    </span>
  )
}

function ModeBadge({ mode }: { mode: Mode | null }) {
  if (mode === 'live') {
    return (
      <span className="flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-2.5 py-1 text-xs font-medium text-emerald-300">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
        Live
      </span>
    )
  }
  if (mode === 'replay') {
    return (
      <span className="rounded-full border border-violet-400/40 bg-violet-400/10 px-2.5 py-1 text-xs font-medium text-violet-200">
        📼 Replay — last game
      </span>
    )
  }
  return null
}

function ConnectionNotice({ status }: { status: ConnectionStatus }) {
  if (status === 'open') return null
  const map: Record<string, { label: string; cls: string }> = {
    idle: { label: 'Connecting…', cls: 'border-amber-400/40 bg-amber-400/10 text-amber-300' },
    connecting: { label: 'Connecting…', cls: 'border-amber-400/40 bg-amber-400/10 text-amber-300' },
    closed: { label: 'Reconnecting…', cls: 'border-white/15 bg-white/[0.04] text-white/50' },
    error: { label: 'Reconnecting…', cls: 'border-red-400/40 bg-red-400/10 text-red-300' },
  }
  const s = map[status] ?? map.closed
  return (
    <span className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${s.cls}`}>
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current opacity-60" />
      {s.label}
    </span>
  )
}

/**
 * The deliberate exception to "you only learn a role when the table does":
 * an opt-in peek behind the curtain, backed by `GET /game/roles`. Off by
 * default, so the suspense stays intact for anyone who'd rather not know.
 */
function RevealToggle({
  revealed,
  loading,
  error,
  onToggle,
}: {
  revealed: boolean
  loading: boolean
  error: boolean
  onToggle: () => void
}) {
  const label = !revealed ? 'Reveal seats' : loading ? 'Peeking…' : error ? "Couldn't peek" : 'Seats revealed'
  return (
    <button
      type="button"
      onClick={onToggle}
      title={revealed ? 'Hide roles and go back to watching it unfold' : "Peek at every seat's true role, right now"}
      className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
        revealed
          ? 'border-violet-400/40 bg-violet-400/15 text-violet-200'
          : 'border-white/10 bg-white/[0.03] text-white/45 hover:border-white/20 hover:text-white/70'
      }`}
    >
      <span aria-hidden>{revealed ? '🙈' : '🔍'}</span>
      {label}
    </button>
  )
}

function Legend({ revealed }: { revealed: boolean }) {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-[11px] text-white/35">
      {revealed && (
        <span className="flex items-center gap-1.5 text-violet-300/70">
          <span aria-hidden>🔍</span> seats revealed — you're peeking ahead of the table
        </span>
      )}
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
