import type { VoteCast } from '../types'

interface Props {
  votes: VoteCast[]
  voterCount: number
}

/**
 * The lynch vote, landing live. Each `vote_cast` frame carries the running
 * tally the instant after it lands -- so rather than waiting for `day_resolved`
 * to announce a finished result, the room can watch the count actually build:
 * bars climbing one at a time, in casting order, a leader emerging or a late
 * swing overtaking it right before the gavel falls.
 */
export function VoteBoard({ votes, voterCount }: Props) {
  if (votes.length === 0) return null

  const tally = votes[votes.length - 1].tally_so_far
  const standings = Object.entries(tally).sort(([, a], [, b]) => b - a)
  const topCount = standings.length ? standings[0][1] : 0
  const scale = Math.max(1, ...standings.map(([, count]) => count))

  return (
    <div className="mt-4 rounded-xl border border-amber-400/15 bg-amber-400/[0.04] p-3.5">
      <div className="mb-2.5 flex items-center justify-between">
        <h3 className="text-[11px] font-medium uppercase tracking-wider text-amber-200/70">
          ⚖️ The vote, live
        </h3>
        <span className="text-[11px] tabular-nums text-white/35">
          {votes.length} of {voterCount} cast
        </span>
      </div>

      {standings.length === 0 ? (
        <p className="text-xs italic text-white/35">Votes are landing — no one's named anyone yet…</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {standings.map(([name, count]) => (
            <div key={name} className="flex items-center gap-2">
              <span className="w-[4.5rem] shrink-0 truncate text-xs text-white/70">{name}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.05]">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${
                    count === topCount ? 'bg-rose-400/70' : 'bg-amber-400/45'
                  }`}
                  style={{ width: `${(count / scale) * 100}%` }}
                />
              </div>
              <span className="w-4 shrink-0 text-right text-xs font-semibold tabular-nums text-white/80">
                {count}
              </span>
            </div>
          ))}
        </div>
      )}

      <ol className="mt-3 flex flex-wrap gap-x-3 gap-y-1 border-t border-white/5 pt-2.5 text-[11px] text-white/35">
        {votes.map((vote, i) => (
          <li key={i} className="flex items-center gap-1 animate-[fadeIn_0.4s_ease-out]">
            <span className="text-white/60">{vote.voter}</span>
            <span className="text-white/25">→</span>
            <span className={vote.target ? 'text-amber-200/70' : 'italic text-white/35'}>
              {vote.target ?? 'abstains'}
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}
