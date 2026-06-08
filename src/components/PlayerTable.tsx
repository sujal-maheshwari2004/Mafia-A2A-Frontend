import type { PhaseName } from '../types'

interface Props {
  players: string[]
  alive: Set<string>
  present: Set<string>
  roles: Record<string, string>
  lastSpeaker: string | null
  phase: PhaseName | null
  dayNumber: number
  finished: boolean
  winner: 'Town' | 'Mafia' | null
  /** 0..1 -- how far the night has soured. The table wears it as much as the room does. */
  bloodLevel: number
}

const ROLE_COLOR: Record<string, string> = {
  Mafia: 'text-red-300 border-red-500/40 bg-red-500/10',
  Doctor: 'text-lime-300 border-lime-400/30 bg-lime-400/10',
  Detective: 'text-slate-300 border-slate-400/30 bg-slate-400/10',
  Villager: 'text-stone-300/70 border-stone-400/15 bg-stone-400/[0.05]',
}

export function PlayerTable({
  players,
  alive,
  present,
  roles,
  lastSpeaker,
  phase,
  dayNumber,
  finished,
  winner,
  bloodLevel,
}: Props) {
  const n = players.length
  const radiusX = 42
  const radiusY = 38

  return (
    <div className="relative mx-auto aspect-[16/10] w-full max-w-3xl">
      {/* the table -- old wood, candlelight pooling at its centre, and (before
          the night's out) whatever's been spilled across it */}
      <div className="absolute inset-[14%] overflow-hidden rounded-[40%] border border-amber-100/[0.08] bg-[radial-gradient(ellipse_at_50%_42%,rgba(120,80,40,0.16),rgba(30,20,12,0.5)_55%,rgba(10,7,5,0.7)_100%)] shadow-[inset_0_0_70px_rgba(0,0,0,0.55)]">
        <div className="blood-spatter absolute inset-0" style={{ opacity: Math.min(0.92, bloodLevel * 1.7) }} />
        <div className="relative flex h-full flex-col items-center justify-center text-center">
          {phase && (
            <>
              <span className="text-[11px] uppercase tracking-[0.2em] text-amber-100/35">
                {phase === 'Night' ? 'Night falls over the glen' : 'Grey daylight through the glass'}
              </span>
              <span className="mt-1 text-3xl font-semibold text-amber-50/90">
                {phase} {dayNumber}
              </span>
            </>
          )}
          {finished && winner && (
            <span
              className={`mt-2 rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-wide ${
                winner === 'Town'
                  ? 'border-amber-400/40 bg-amber-400/10 text-amber-300'
                  : 'border-red-500/40 bg-red-500/10 text-red-300'
              }`}
            >
              {winner} wins
            </span>
          )}
        </div>
      </div>

      {/* seats */}
      {players.map((name, i) => {
        const angle = (i / n) * 2 * Math.PI - Math.PI / 2
        const x = 50 + radiusX * Math.cos(angle)
        const y = 50 + radiusY * Math.sin(angle)
        const isAlive = alive.has(name)
        const isPresent = present.has(name) && isAlive
        const isSpeaking = lastSpeaker === name
        const role = roles[name]

        return (
          <div
            key={name}
            className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5"
            style={{ left: `${x}%`, top: `${y}%` }}
          >
            <div className="relative">
              {!isAlive && (
                <span
                  className="blood-pool pointer-events-none absolute left-1/2 top-[60%] -z-10 h-8 w-14 -translate-x-1/2 rounded-full"
                  aria-hidden
                />
              )}
              <div
                className={`relative flex h-12 w-12 items-center justify-center rounded-full border text-sm font-semibold transition-all duration-300 sm:h-14 sm:w-14 ${
                  !isAlive
                    ? 'border-red-950/40 bg-black/40 text-stone-400/30 grayscale'
                    : isSpeaking
                      ? 'border-amber-300 bg-amber-400/20 text-amber-50 shadow-[0_0_0_4px_rgba(232,163,61,0.16),0_0_26px_rgba(232,163,61,0.5)]'
                      : isPresent
                        ? 'border-amber-100/25 bg-amber-100/[0.06] text-amber-50/90'
                        : 'border-stone-400/10 bg-stone-400/[0.02] text-stone-400/35'
                }`}
              >
                {isSpeaking && (
                  <span className="absolute inset-0 animate-ping rounded-full bg-amber-400/25" />
                )}
                <span className="relative">{initials(name)}</span>
                {!isAlive && (
                  <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-black/70 text-[10px]">
                    💀
                  </span>
                )}
              </div>
            </div>
            <span className={`text-[11px] font-medium ${isAlive ? 'text-amber-50/75' : 'text-stone-400/30 line-through'}`}>
              {name}
            </span>
            {role && (
              <span className={`rounded-full border px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide ${ROLE_COLOR[role] ?? ROLE_COLOR.Villager}`}>
                {role}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

function initials(name: string): string {
  return name.slice(0, 2).toUpperCase()
}
