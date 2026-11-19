export type IssueType = 'story' | 'task' | 'bug' | 'epic'
export type Priority = 'highest' | 'high' | 'medium' | 'low' | 'lowest'

export interface Column {
  id: string
  name: string
}

export interface Issue {
  id: string
  /** Fortlaufende Nummer innerhalb des Projekts -> Schlüssel z. B. WEB-12 */
  number: number
  title: string
  description: string
  type: IssueType
  priority: Priority
  assignee: string
  labels: string[]
  storyPoints: number | null
  columnId: string
  createdAt: number
  updatedAt: number
}

export interface Project {
  id: string
  key: string
  name: string
  color: string
  columns: Column[]
  /** Reihenfolge der Vorgänge pro Spalte */
  order: Record<string, string[]>
  issues: Record<string, Issue>
  nextNumber: number
}

export interface AppState {
  projects: Project[]
  activeProjectId: string | null
}

export const ISSUE_TYPES: Record<IssueType, { label: string; color: string }> = {
  story: { label: 'Story', color: '#22c55e' },
  task: { label: 'Aufgabe', color: '#3b82f6' },
  bug: { label: 'Bug', color: '#ef4444' },
  epic: { label: 'Epic', color: '#a855f7' },
}

export const PRIORITIES: Record<Priority, { label: string; color: string }> = {
  highest: { label: 'Höchste', color: '#ef4444' },
  high: { label: 'Hoch', color: '#f97316' },
  medium: { label: 'Mittel', color: '#eab308' },
  low: { label: 'Niedrig', color: '#3b82f6' },
  lowest: { label: 'Niedrigste', color: '#06b6d4' },
}

export const PROJECT_COLORS = ['#6366f1', '#3b82f6', '#06b6d4', '#10b981', '#eab308', '#f97316', '#f43f5e', '#a855f7']

/** Punktfarbe der Spalten: erste grau, letzte grün, dazwischen blau/gelb/violett… */
const MIDDLE_DOTS = ['#3b82f6', '#f59e0b', '#a855f7', '#06b6d4', '#ec4899']
export function columnColor(index: number, count: number) {
  if (index === count - 1 && count > 1) return '#22c55e'
  if (index === 0) return '#94a3b8'
  return MIDDLE_DOTS[(index - 1) % MIDDLE_DOTS.length]
}
