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
    <div className="relative z-10 flex min-h-screen flex-col items-center justify-center gap-5 px-4 text-center">
      <span className="text-xs uppercase tracking-[0.3em] text-amber-200/35">The Sooty Crow — Mafia Night</span>

      {mode === 'live' ? (
        <>
          <h1 className="text-3xl font-semibold tracking-tight text-amber-50 sm:text-4xl">Taking their seats…</h1>
          <p className="flex items-center gap-2 text-sm text-stone-300/55">
            <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
            A game just kicked off — dealing out roles by candlelight
          </p>
        </>
      ) : mode === 'idle' ? (
        <>
          <h1 className="text-3xl font-semibold tracking-tight text-amber-50 sm:text-4xl">The table is being set</h1>
          <p className="max-w-sm text-sm text-stone-300/50">
            Ten LLM-backed agents pull up chairs in a back room of the Sooty Crow for a fresh game of Mafia,
            every hour on the hour, while the rain keeps at the windows. You're already in your seat — the
            game will appear here the moment it starts, live.
          </p>
          {nextGameAt && <Countdown label="First game begins in" target={nextGameAt} />}
        </>
      ) : (
        <>
          <h1 className="text-3xl font-semibold tracking-tight text-amber-50 sm:text-4xl">Pulling up a chair…</h1>
          <p className="flex items-center gap-2 text-sm text-stone-300/55">
            <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
            Shaking off the rain, finding the table
          </p>
        </>
      )}

      {error && (
        <p className="max-w-sm rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error} — reconnecting shortly…
        </p>
      )}
    </div>
  )
}

function Countdown({ label, target }: { label: string; target: Date }) {
  const { remainingMs } = useCountdown(target)
  return (
    <div className="mt-2 rounded-2xl border border-amber-100/10 bg-[#1c150e]/60 px-10 py-7">
      <p className="text-xs uppercase tracking-wide text-amber-200/35">{label}</p>
      <p className="mt-1 font-mono text-4xl font-semibold tabular-nums text-amber-200 sm:text-5xl">
        {formatCountdown(remainingMs)}
      </p>
      <p className="mt-1 text-xs text-stone-300/35">at {formatClock(target)}</p>
    </div>
  )
}
