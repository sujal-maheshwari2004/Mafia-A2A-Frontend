export type CastType = 'unicast' | 'multicast' | 'broadcast'
export type PhaseName = 'Night' | 'Day'
export type Winner = 'Town' | 'Mafia'

export interface GameStarted {
  type: 'game_started'
  players: string[]
}

export interface PhaseStarted {
  type: 'phase_started'
  phase: PhaseName
  day_number: number
  present: string[]
}

export interface TableTalk {
  type: 'table_talk'
  seq: number
  sender: string
  cast: CastType
  to: string[]
  content: string
  day_number: number
  phase: PhaseName
}

export interface NightResolved {
  type: 'night_resolved'
  day_number: number
  killed: string | null
  saved: boolean
}

export interface DayResolved {
  type: 'day_resolved'
  day_number: number
  lynched: string | null
  lynched_role: string | null
  vote_counts: Record<string, number>
  tied: boolean
}

export interface GameEnded {
  type: 'game_ended'
  winner: Winner
  roles: Record<string, string>
}

export interface ErrorFrame {
  type: 'error'
  message: string
}

export type GameEvent =
  | GameStarted
  | PhaseStarted
  | TableTalk
  | NightResolved
  | DayResolved
  | GameEnded
  | ErrorFrame

export interface GameConfig {
  count: number
  seed?: number
  brain: 'heuristic' | 'llm' | 'mixed'
  model: string
}

export type ConnectionStatus = 'idle' | 'connecting' | 'open' | 'closed' | 'error'

/** A timeline entry the UI renders -- either a chat message or a narrative beat. */
export type TimelineItem =
  | { kind: 'talk'; data: TableTalk }
  | { kind: 'phase'; data: PhaseStarted }
  | { kind: 'night'; data: NightResolved }
  | { kind: 'day'; data: DayResolved }
  | { kind: 'end'; data: GameEnded }
