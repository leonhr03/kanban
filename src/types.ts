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
  /** Reihenfolge der Issues pro Spalte */
  order: Record<string, string[]>
  issues: Record<string, Issue>
  nextNumber: number
}

export interface AppState {
  projects: Project[]
  activeProjectId: string | null
}

export const ISSUE_TYPES: Record<IssueType, { label: string; color: string; icon: string }> = {
  story: { label: 'Story', color: '#16a34a', icon: '▮' },
  task: { label: 'Aufgabe', color: '#2563eb', icon: '✓' },
  bug: { label: 'Bug', color: '#dc2626', icon: '●' },
  epic: { label: 'Epic', color: '#7c3aed', icon: '⚡' },
}

export const PRIORITIES: Record<Priority, { label: string; color: string; icon: string }> = {
  highest: { label: 'Höchste', color: '#dc2626', icon: '⇈' },
  high: { label: 'Hoch', color: '#ea580c', icon: '↑' },
  medium: { label: 'Mittel', color: '#ca8a04', icon: '=' },
  low: { label: 'Niedrig', color: '#2563eb', icon: '↓' },
  lowest: { label: 'Niedrigste', color: '#0891b2', icon: '⇊' },
}

export const PROJECT_COLORS = ['#2563eb', '#7c3aed', '#db2777', '#dc2626', '#ea580c', '#16a34a', '#0891b2', '#475569']
