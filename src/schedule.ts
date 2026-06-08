import { useEffect, useState } from 'react'

// The server is the source of truth for *when* the next game starts (it sends
// `next_game_at` in its status frames) -- this module just renders a countdown
// to whatever instant it names.

export function useCountdown(target: Date) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  const remainingMs = Math.max(0, target.getTime() - now)
  return { remainingMs, reached: remainingMs <= 0 }
}

export function formatCountdown(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  const pad = (n: number) => n.toString().padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}

export function formatClock(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
