import type { Mode } from '../types'
import { formatClock, formatCountdown, useCountdown } from '../schedule'

interface Props {
  mode: Mode | null
  nextGameAt: Date | null
  error: string | null
}

/** Shown only when there's nothing to display yet -- no game has run this session
 *  (mode "idle"), or we're still waiting on the very first frame from the server. */
export function WaitingRoom({ mode, nextGameAt, error }: Props) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 px-4 text-center">
      <span className="text-xs uppercase tracking-[0.3em] text-white/35">Mafia — Live Spectate</span>

      {mode === 'live' ? (
        <>
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Taking their seats…</h1>
          <p className="flex items-center gap-2 text-sm text-white/50">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            A game just kicked off — dealing out roles
          </p>
        </>
      ) : mode === 'idle' ? (
        <>
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">The table is being set</h1>
          <p className="max-w-sm text-sm text-white/45">
            Seven LLM-backed agents sit down for a fresh game of Mafia every hour, on the hour. You're already
            connected — the game will appear here the moment it starts, live.
          </p>
          {nextGameAt && <Countdown label="First game begins in" target={nextGameAt} />}
        </>
      ) : (
        <>
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Pulling up a chair…</h1>
          <p className="flex items-center gap-2 text-sm text-white/50">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            Connecting to the table
          </p>
        </>
      )}

      {error && (
        <p className="max-w-sm rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-300">
          {error} — reconnecting shortly…
        </p>
      )}
    </div>
  )
}

function Countdown({ label, target }: { label: string; target: Date }) {
  const { remainingMs } = useCountdown(target)
  return (
    <div className="mt-2 rounded-2xl border border-white/10 bg-white/[0.03] px-10 py-7">
      <p className="text-xs uppercase tracking-wide text-white/35">{label}</p>
      <p className="mt-1 font-mono text-4xl font-semibold tabular-nums text-violet-200 sm:text-5xl">
        {formatCountdown(remainingMs)}
      </p>
      <p className="mt-1 text-xs text-white/35">at {formatClock(target)}</p>
    </div>
  )
}
