import { useEffect, useState } from 'react'

// The backend deliberately keeps this out of the WebSocket stream -- roles
// there only surface when the *table itself* learns them (a lynch, the final
// curtain). `GET /game/roles` is the one place that reveals every seat's true
// role the instant the table sits down: a spectator's peek behind the curtain,
// entirely opt-in, for anyone who'd rather watch knowing who's who.

function rolesUrlFor(wsUrl: string): string {
  return wsUrl.replace(/^ws/, 'http').replace(/\/ws\/game\/?$/, '/game/roles')
}

interface Fetched {
  key: string
  roles: Record<string, string> | null
}

/**
 * Drives the "reveal seats" toggle: fetches `/game/roles` on demand, keyed by
 * `gameKey` (the seated roster) so that a viewer who's already revealed the
 * table automatically gets a fresh peek the moment the next one sits down,
 * rather than staring at a finished game's cast.
 */
export function useRoleReveal(wsUrl: string, gameKey: string) {
  const [revealed, setRevealed] = useState(false)
  const [fetched, setFetched] = useState<Fetched | null>(null)
  const [failedKey, setFailedKey] = useState<string | null>(null)

  // Only ever fetches when revealed AND we don't already have an answer (or a
  // failure) for the *current* table -- every `setState` below happens inside
  // a promise callback, once the external fetch actually resolves, never
  // synchronously in the effect body.
  const haveAnswer = fetched?.key === gameKey || failedKey === gameKey

  useEffect(() => {
    if (!revealed || haveAnswer) return

    let cancelled = false
    fetch(rolesUrlFor(wsUrl))
      .then((res) => res.json())
      .then((body: { roles: Record<string, string> | null }) => {
        if (cancelled) return
        setFetched({ key: gameKey, roles: body.roles ?? null })
      })
      .catch(() => {
        if (cancelled) return
        setFailedKey(gameKey)
      })

    return () => {
      cancelled = true
    }
  }, [wsUrl, revealed, gameKey, haveAnswer])

  return {
    /** The revealed seat -> role map for the current table, or null until resolved. */
    roles: revealed && fetched?.key === gameKey ? fetched.roles : null,
    revealed,
    loading: revealed && !haveAnswer,
    error: revealed && failedKey === gameKey,
    toggle: () => setRevealed((on) => !on),
  }
}
