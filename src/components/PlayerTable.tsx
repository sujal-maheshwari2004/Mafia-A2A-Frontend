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
}

const ROLE_COLOR: Record<string, string> = {
  Mafia: 'text-rose-300 border-rose-400/40 bg-rose-400/10',
  Doctor: 'text-emerald-300 border-emerald-400/40 bg-emerald-400/10',
  Detective: 'text-sky-300 border-sky-400/40 bg-sky-400/10',
  Villager: 'text-white/70 border-white/15 bg-white/[0.04]',
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
}: Props) {
  const n = players.length
  const radiusX = 42
  const radiusY = 38

  return (
    <div className="relative mx-auto aspect-[16/10] w-full max-w-3xl">
      {/* table surface */}
      <div className="absolute inset-[14%] rounded-[40%] border border-white/10 bg-gradient-to-br from-white/[0.04] to-transparent shadow-[inset_0_0_60px_rgba(0,0,0,0.4)]">
        <div className="flex h-full flex-col items-center justify-center text-center">
          {phase && (
            <>
              <span className="text-[11px] uppercase tracking-[0.2em] text-white/35">
                {phase === 'Night' ? 'Night falls' : 'Daylight'}
              </span>
              <span className="mt-1 text-3xl font-semibold text-white/85">
                {phase} {dayNumber}
              </span>
            </>
          )}
          {finished && winner && (
            <span
              className={`mt-2 rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-wide ${
                winner === 'Town'
                  ? 'border-sky-400/40 bg-sky-400/10 text-sky-300'
                  : 'border-rose-400/40 bg-rose-400/10 text-rose-300'
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
            <div
              className={`relative flex h-12 w-12 items-center justify-center rounded-full border text-sm font-semibold transition-all duration-300 sm:h-14 sm:w-14 ${
                !isAlive
                  ? 'border-white/10 bg-black/30 text-white/25 grayscale'
                  : isSpeaking
                    ? 'border-violet-300 bg-violet-400/25 text-white shadow-[0_0_0_4px_rgba(167,139,250,0.18),0_0_24px_rgba(167,139,250,0.45)]'
                    : isPresent
                      ? 'border-white/25 bg-white/[0.07] text-white'
                      : 'border-white/10 bg-white/[0.02] text-white/35'
              }`}
            >
              {isSpeaking && (
                <span className="absolute inset-0 animate-ping rounded-full bg-violet-400/30" />
              )}
              <span className="relative">{initials(name)}</span>
              {!isAlive && (
                <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-black/70 text-[10px]">
                  💀
                </span>
              )}
            </div>
            <span className={`text-[11px] font-medium ${isAlive ? 'text-white/75' : 'text-white/30 line-through'}`}>
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
