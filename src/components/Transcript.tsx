import { useEffect, useRef } from 'react'
import type { TimelineItem } from '../types'

interface Props {
  items: TimelineItem[]
}

export function Transcript({ items }: Props) {
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [items.length])

  return (
    <div className="flex h-full flex-col gap-2 overflow-y-auto px-1 py-2">
      {items.length === 0 && (
        <p className="m-auto text-sm text-stone-400/30">The hearth's lit, the glasses are out — waiting on the first word…</p>
      )}
      {items.map((item, i) => (
        <TimelineEntry key={i} item={item} />
      ))}
      <div ref={endRef} />
    </div>
  )
}

function TimelineEntry({ item }: { item: TimelineItem }) {
  switch (item.kind) {
    case 'phase': {
      const { phase, day_number, present } = item.data
      return (
        <Divider>
          {phase === 'Night'
            ? `Night ${day_number} falls — awake: ${present.length ? present.join(', ') : 'no one'}`
            : `Day ${day_number} begins — at the table: ${present.join(', ')}`}
        </Divider>
      )
    }

    case 'talk':
      return <TalkBubble talk={item.data} />

    case 'night': {
      const { killed, saved } = item.data
      return (
        <Narration tone="dark">
          {killed
            ? `🌙 ${killed} was found dead this morning, out in the rain.`
            : saved
              ? "🌙 The doctor's patient was attacked but survived the night!"
              : '🌙 No one died last night — small mercies, on a night like this.'}
        </Narration>
      )
    }

    case 'day': {
      const { lynched, lynched_role, tied } = item.data
      return (
        <Narration tone="warm">
          {lynched
            ? `⚖️ The town votes to lynch ${lynched} — revealed as the ${lynched_role}.`
            : tied
              ? '⚖️ The vote ended in a tie — no one is lynched today.'
              : '⚖️ No votes were cast — no one is lynched today.'}
        </Narration>
      )
    }

    case 'end': {
      const { winner, roles } = item.data
      const town = winner === 'Town'
      return (
        <div
          className={`my-2 rounded-xl border p-4 ${
            town ? 'border-amber-400/30 bg-amber-400/10' : 'border-red-500/30 bg-red-500/10'
          }`}
        >
          <p className={`text-sm font-semibold uppercase tracking-wide ${town ? 'text-amber-200' : 'text-red-300'}`}>
            {town ? '🏁 Last orders — the Town wins!' : '🏁 Last orders — the Mafia walks out free!'}
          </p>
          <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-stone-300/65 sm:grid-cols-3">
            {Object.entries(roles).map(([name, role]) => (
              <li key={name}>
                <span className="text-amber-50/85">{name}</span> — {role}
              </li>
            ))}
          </ul>
        </div>
      )
    }
  }
}

function Divider({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-1 flex items-center gap-3 text-[11px] uppercase tracking-wider text-stone-300/35">
      <span className="h-px flex-1 bg-amber-100/10" />
      {children}
      <span className="h-px flex-1 bg-amber-100/10" />
    </div>
  )
}

function Narration({ children, tone }: { children: React.ReactNode; tone: 'dark' | 'warm' }) {
  return (
    <div
      className={`mx-auto max-w-md rounded-lg border px-3 py-1.5 text-center text-xs italic ${
        tone === 'dark'
          ? 'border-slate-400/15 bg-slate-400/[0.05] text-slate-300/75'
          : 'border-amber-400/20 bg-amber-400/[0.06] text-amber-200/80'
      }`}
    >
      {children}
    </div>
  )
}

const CAST_STYLE = {
  broadcast: {
    label: (sender: string, _to: string[]) => `📢 ${sender} → the whole room`,
    bubble: 'border-amber-100/[0.08] bg-amber-100/[0.03]',
    tag: 'text-stone-300/45',
  },
  multicast: {
    label: (sender: string, to: string[]) => `🤫 ${sender} huddles with ${to.join(', ')}`,
    bubble: 'border-amber-400/25 bg-amber-400/[0.06] border-dashed',
    tag: 'text-amber-300/70',
  },
  unicast: {
    label: (sender: string, to: string[]) => `🤐 ${sender} leans in and whispers to ${to[0]}`,
    bubble: 'border-rose-400/20 bg-rose-400/[0.05] border-dashed',
    tag: 'text-rose-300/65',
  },
} as const

function TalkBubble({ talk }: { talk: import('../types').TableTalk }) {
  const style = CAST_STYLE[talk.cast]
  const label = style.label(talk.sender, talk.to)

  return (
    <div className={`max-w-[85%] rounded-xl border px-3.5 py-2.5 ${style.bubble}`}>
      <p className={`mb-1 text-[11px] font-medium ${style.tag}`}>{label}</p>
      <p className="text-sm leading-relaxed text-amber-50/90">{talk.content}</p>
    </div>
  )
}
