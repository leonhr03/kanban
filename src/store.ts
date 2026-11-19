import { useEffect, useReducer } from 'react'
import type { AppState, Column, Issue, Project } from './types'

const STORAGE_KEY = 'kanban-state-v1'

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)

const DEFAULT_COLUMNS = ['Zu erledigen', 'In Arbeit', 'Review', 'Fertig']

export function createProject(name: string, key: string, color: string): Project {
  const columns: Column[] = DEFAULT_COLUMNS.map((n) => ({ id: uid(), name: n }))
  return {
    id: uid(),
    key: key.toUpperCase(),
    name,
    color,
    columns,
    order: Object.fromEntries(columns.map((c) => [c.id, []])),
    issues: {},
    nextNumber: 1,
  }
}

type Sample = [string, Issue['type'], Issue['priority'], number, string[], string, number | null]

function seed(p: Project, samples: Sample[]): Project {
  return samples.reduce(
    (acc, [title, type, priority, col, labels, assignee, storyPoints]) =>
      addIssue(acc, { title, type, priority, labels, assignee, storyPoints, columnId: acc.columns[col].id }),
    p,
  )
}

function demoState(): AppState {
  const web = seed(createProject('Website Relaunch', 'WEB', '#6366f1'), [
    ['Startseite neu gestalten', 'story', 'high', 0, ['design'], 'Lena Fischer', 5],
    ['Kontaktformular validieren', 'task', 'medium', 0, ['frontend'], '', 2],
    ['Dark Mode für alle Seiten', 'story', 'low', 0, ['design'], 'Mia Schmid', 3],
    ['Navigation auf dem Handy kaputt', 'bug', 'highest', 1, ['mobile'], 'Lena Fischer', 1],
    ['Blog-Bereich aufbauen', 'epic', 'medium', 1, [], 'Jonas Weber', 8],
    ['Bilder komprimieren', 'task', 'low', 2, ['performance'], 'Mia Schmid', 1],
    ['Impressum hinzufügen', 'task', 'medium', 3, [], 'Jonas Weber', 1],
    ['Domain verbinden', 'task', 'high', 3, ['ops'], 'Lena Fischer', 2],
  ])
  const api = seed(createProject('Backend API', 'API', '#10b981'), [
    ['Login mit JWT', 'story', 'high', 0, ['auth'], 'Jonas Weber', 5],
    ['Datenbank-Migrationen', 'task', 'medium', 1, ['db'], 'Lena Fischer', 3],
    ['500er bei leerem Request-Body', 'bug', 'high', 2, [], '', 1],
  ])
  const app = seed(createProject('Mobile App', 'APP', '#f43f5e'), [
    ['Push-Benachrichtigungen', 'story', 'medium', 0, ['ios', 'android'], 'Mia Schmid', 8],
    ['App-Icon erstellen', 'task', 'low', 3, ['design'], 'Mia Schmid', 1],
  ])
  return { projects: [web, api, app], activeProjectId: web.id }
}

function load(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const s = JSON.parse(raw) as AppState
      if (Array.isArray(s.projects)) return s
    }
  } catch {
    /* ignorieren -> Demo-Daten */
  }
  return demoState()
}

export type IssueDraft = Partial<Omit<Issue, 'id' | 'number' | 'createdAt' | 'updatedAt'>> & {
  title: string
  columnId: string
}

function addIssue(p: Project, draft: IssueDraft): Project {
  const now = Date.now()
  const issue: Issue = {
    description: '',
    type: 'task',
    priority: 'medium',
    assignee: '',
    labels: [],
    storyPoints: null,
    ...draft,
    id: uid(),
    number: p.nextNumber,
    createdAt: now,
    updatedAt: now,
  }
  return {
    ...p,
    issues: { ...p.issues, [issue.id]: issue },
    order: { ...p.order, [draft.columnId]: [...(p.order[draft.columnId] ?? []), issue.id] },
    nextNumber: p.nextNumber + 1,
  }
}

/** Aktionen innerhalb eines Projekts (Board) */
export type ProjectAction =
  | { type: 'addColumn'; name: string }
  | { type: 'renameColumn'; columnId: string; name: string }
  | { type: 'deleteColumn'; columnId: string }
  | { type: 'moveColumn'; columnId: string; dir: -1 | 1 }
  | { type: 'addIssue'; draft: IssueDraft }
  | { type: 'updateIssue'; id: string; patch: Partial<Issue> }
  | { type: 'deleteIssue'; id: string }
  | { type: 'moveIssue'; id: string; toColumnId: string; beforeId: string | null }

export type Action =
  | { type: 'selectProject'; id: string }
  | { type: 'addProject'; project: Project }
  | { type: 'updateProject'; id: string; patch: Partial<Pick<Project, 'name' | 'key' | 'color'>> }
  | { type: 'deleteProject'; id: string }
  | { type: 'project'; projectId: string; action: ProjectAction }
  | { type: 'import'; state: AppState }

function projectReducer(p: Project, a: ProjectAction): Project {
  switch (a.type) {
    case 'addColumn': {
      const col = { id: uid(), name: a.name }
      return { ...p, columns: [...p.columns, col], order: { ...p.order, [col.id]: [] } }
    }
    case 'renameColumn':
      return { ...p, columns: p.columns.map((c) => (c.id === a.columnId ? { ...c, name: a.name } : c)) }
    case 'deleteColumn': {
      if (p.columns.length <= 1) return p
      const columns = p.columns.filter((c) => c.id !== a.columnId)
      // Vorgänge der gelöschten Spalte wandern in die erste verbleibende Spalte
      const target = columns[0].id
      const moved = p.order[a.columnId] ?? []
      const issues = { ...p.issues }
      for (const id of moved) issues[id] = { ...issues[id], columnId: target }
      const order = { ...p.order, [target]: [...(p.order[target] ?? []), ...moved] }
      delete order[a.columnId]
      return { ...p, columns, order, issues }
    }
    case 'moveColumn': {
      const i = p.columns.findIndex((c) => c.id === a.columnId)
      const j = i + a.dir
      if (i < 0 || j < 0 || j >= p.columns.length) return p
      const columns = [...p.columns]
      ;[columns[i], columns[j]] = [columns[j], columns[i]]
      return { ...p, columns }
    }
    case 'addIssue':
      return addIssue(p, a.draft)
    case 'updateIssue': {
      const old = p.issues[a.id]
      if (!old) return p
      const updated = { ...old, ...a.patch, updatedAt: Date.now() }
      let order = p.order
      if (a.patch.columnId && a.patch.columnId !== old.columnId) {
        order = {
          ...order,
          [old.columnId]: order[old.columnId].filter((x) => x !== a.id),
          [a.patch.columnId]: [...(order[a.patch.columnId] ?? []), a.id],
        }
      }
      return { ...p, order, issues: { ...p.issues, [a.id]: updated } }
    }
    case 'deleteIssue': {
      const issue = p.issues[a.id]
      if (!issue) return p
      const issues = { ...p.issues }
      delete issues[a.id]
      return { ...p, issues, order: { ...p.order, [issue.columnId]: p.order[issue.columnId].filter((x) => x !== a.id) } }
    }
    case 'moveIssue': {
      const issue = p.issues[a.id]
      if (!issue) return p
      const order = { ...p.order }
      const from = order[issue.columnId].filter((x) => x !== a.id)
      order[issue.columnId] = from
      const to = issue.columnId === a.toColumnId ? from : [...(order[a.toColumnId] ?? [])]
      const idx = a.beforeId ? to.indexOf(a.beforeId) : -1
      if (idx < 0) to.push(a.id)
      else to.splice(idx, 0, a.id)
      order[a.toColumnId] = to
      return { ...p, order, issues: { ...p.issues, [a.id]: { ...issue, columnId: a.toColumnId, updatedAt: Date.now() } } }
    }
  }
}

function reducer(state: AppState, a: Action): AppState {
  switch (a.type) {
    case 'selectProject':
      return state.activeProjectId === a.id ? state : { ...state, activeProjectId: a.id }
    case 'addProject':
      return { projects: [...state.projects, a.project], activeProjectId: a.project.id }
    case 'updateProject':
      return { ...state, projects: state.projects.map((p) => (p.id === a.id ? { ...p, ...a.patch } : p)) }
    case 'deleteProject': {
      const projects = state.projects.filter((p) => p.id !== a.id)
      const activeProjectId = state.activeProjectId === a.id ? (projects[0]?.id ?? null) : state.activeProjectId
      return { projects, activeProjectId }
    }
    case 'project':
      return {
        ...state,
        projects: state.projects.map((p) => (p.id === a.projectId ? projectReducer(p, a.action) : p)),
      }
    case 'import':
      return a.state
  }
}

export function useAppState() {
  const [state, dispatch] = useReducer(reducer, undefined, load)
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* Speicher voll oder blockiert */
    }
  }, [state])
  return [state, dispatch] as const
}

/** Statistik für Fortschrittsanzeigen: letzte Spalte zählt als „erledigt“ */
export function projectStats(p: Project) {
  const total = Object.keys(p.issues).length
  const doneCol = p.columns[p.columns.length - 1]
  const done = doneCol ? (p.order[doneCol.id]?.length ?? 0) : 0
  return { total, done, pct: total ? Math.round((done / total) * 100) : 0 }
}
