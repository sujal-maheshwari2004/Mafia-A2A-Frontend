import { useEffect, useState } from 'react'

/** The next top-of-the-hour instant strictly after `from`. */
export function nextHourBoundary(from: Date = new Date()): Date {
  const next = new Date(from)
  next.setMinutes(0, 0, 0)
  next.setHours(next.getHours() + 1)
  return next
}

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
