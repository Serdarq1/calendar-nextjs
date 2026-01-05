export type EventMember = { name: string; avatar?: string }

export type EventData = {
  id: string
  calendar_id?: string
  status: 'Tek' | 'Birlikte'
  title: string
  /** ISO date string (e.g. 2024-09-15) */
  date: string
  day: number
  time?: string
  type: 'single' | 'collaborative'
  members: EventMember[]
}
