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

function demoState(): AppState {
  const p = createProject('Website', 'WEB', '#2563eb')
  const samples: [string, Issue['type'], Issue['priority'], number, string[]][] = [
    ['Startseite neu gestalten', 'story', 'high', 0, ['design']],
    ['Kontaktformular validieren', 'task', 'medium', 0, []],
    ['Navigation auf dem Handy kaputt', 'bug', 'highest', 1, ['mobile']],
    ['Bilder komprimieren', 'task', 'low', 2, ['performance']],
    ['Impressum hinzufügen', 'task', 'medium', 3, []],
  ]
  let state: Project = p
  for (const [title, type, priority, col, labels] of samples) {
    state = addIssue(state, { title, type, priority, labels, columnId: p.columns[col].id })
  }
  return { projects: [state, createProject('Backend', 'API', '#16a34a')], activeProjectId: p.id }
}

function load(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as AppState
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

export type Action =
  | { type: 'selectProject'; id: string }
  | { type: 'addProject'; project: Project }
  | { type: 'updateProject'; id: string; patch: Partial<Pick<Project, 'name' | 'key' | 'color'>> }
  | { type: 'deleteProject'; id: string }
  | { type: 'addColumn'; name: string }
  | { type: 'renameColumn'; columnId: string; name: string }
  | { type: 'deleteColumn'; columnId: string }
  | { type: 'moveColumn'; columnId: string; dir: -1 | 1 }
  | { type: 'addIssue'; draft: IssueDraft }
  | { type: 'updateIssue'; id: string; patch: Partial<Issue> }
  | { type: 'deleteIssue'; id: string }
  | { type: 'moveIssue'; id: string; toColumnId: string; beforeId: string | null }
  | { type: 'import'; state: AppState }

function updateActive(state: AppState, fn: (p: Project) => Project): AppState {
  return { ...state, projects: state.projects.map((p) => (p.id === state.activeProjectId ? fn(p) : p)) }
}

function reducer(state: AppState, a: Action): AppState {
  switch (a.type) {
    case 'selectProject':
      return { ...state, activeProjectId: a.id }
    case 'addProject':
      return { projects: [...state.projects, a.project], activeProjectId: a.project.id }
    case 'updateProject':
      return { ...state, projects: state.projects.map((p) => (p.id === a.id ? { ...p, ...a.patch } : p)) }
    case 'deleteProject': {
      const projects = state.projects.filter((p) => p.id !== a.id)
      const activeProjectId = state.activeProjectId === a.id ? (projects[0]?.id ?? null) : state.activeProjectId
      return { projects, activeProjectId }
    }
    case 'addColumn':
      return updateActive(state, (p) => {
        const col = { id: uid(), name: a.name }
        return { ...p, columns: [...p.columns, col], order: { ...p.order, [col.id]: [] } }
      })
    case 'renameColumn':
      return updateActive(state, (p) => ({
        ...p,
        columns: p.columns.map((c) => (c.id === a.columnId ? { ...c, name: a.name } : c)),
      }))
    case 'deleteColumn':
      return updateActive(state, (p) => {
        if (p.columns.length <= 1) return p
        const columns = p.columns.filter((c) => c.id !== a.columnId)
        // Issues der gelöschten Spalte wandern in die erste verbleibende Spalte
        const target = columns[0].id
        const moved = p.order[a.columnId] ?? []
        const issues = { ...p.issues }
        for (const id of moved) issues[id] = { ...issues[id], columnId: target }
        const order = { ...p.order, [target]: [...p.order[target], ...moved] }
        delete order[a.columnId]
        return { ...p, columns, order, issues }
      })
    case 'moveColumn':
      return updateActive(state, (p) => {
        const i = p.columns.findIndex((c) => c.id === a.columnId)
        const j = i + a.dir
        if (i < 0 || j < 0 || j >= p.columns.length) return p
        const columns = [...p.columns]
        ;[columns[i], columns[j]] = [columns[j], columns[i]]
        return { ...p, columns }
      })
    case 'addIssue':
      return updateActive(state, (p) => addIssue(p, a.draft))
    case 'updateIssue':
      return updateActive(state, (p) => {
        const old = p.issues[a.id]
        if (!old) return p
        let next: Project = { ...p, issues: { ...p.issues, [a.id]: { ...old, ...a.patch, updatedAt: Date.now() } } }
        if (a.patch.columnId && a.patch.columnId !== old.columnId) {
          next = {
            ...next,
            order: {
              ...next.order,
              [old.columnId]: next.order[old.columnId].filter((x) => x !== a.id),
              [a.patch.columnId]: [...next.order[a.patch.columnId], a.id],
            },
          }
        }
        return next
      })
    case 'deleteIssue':
      return updateActive(state, (p) => {
        const issue = p.issues[a.id]
        if (!issue) return p
        const issues = { ...p.issues }
        delete issues[a.id]
        return { ...p, issues, order: { ...p.order, [issue.columnId]: p.order[issue.columnId].filter((x) => x !== a.id) } }
      })
    case 'moveIssue':
      return updateActive(state, (p) => {
        const issue = p.issues[a.id]
        if (!issue) return p
        const order = { ...p.order }
        const from = order[issue.columnId].filter((x) => x !== a.id)
        order[issue.columnId] = from
        const to = issue.columnId === a.toColumnId ? from : [...order[a.toColumnId]]
        const idx = a.beforeId ? to.indexOf(a.beforeId) : -1
        if (idx < 0) to.push(a.id)
        else to.splice(idx, 0, a.id)
        order[a.toColumnId] = to
        return {
          ...p,
          order,
          issues: { ...p.issues, [a.id]: { ...issue, columnId: a.toColumnId, updatedAt: Date.now() } },
        }
      })
    case 'import':
      return a.state
  }
}

export function useAppState() {
  const [state, dispatch] = useReducer(reducer, undefined, load)
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])
  return [state, dispatch] as const
}
