import { Check, ChevronsUpDown, Menu, Plus, Search, Settings2, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type Dispatch, type DragEvent } from 'react'
import { projectStats, type Action, type ProjectAction } from '../store'
import { ISSUE_TYPES, type Issue, type IssueType, type Project } from '../types'
import BoardColumn, { type DropTarget } from './BoardColumn'
import IssueModal from './IssueModal'
import { Avatar, ProjectAvatar, TypeIcon } from './IssueBits'

export default function Board({
  project,
  projects,
  dispatch,
  onEditProject,
  onNewProject,
  onOpenMenu,
}: {
  project: Project
  projects: Project[]
  dispatch: Dispatch<Action>
  onEditProject: () => void
  onNewProject: () => void
  onOpenMenu: () => void
}) {
  const [search, setSearch] = useState('')
  const [types, setTypes] = useState<IssueType[]>([])
  const [assigneeFilter, setAssigneeFilter] = useState<string | null>(null)
  const [openIssueId, setOpenIssueId] = useState<string | null>(null)
  const [creatingIn, setCreatingIn] = useState<string | null>(null)
  const [dragId, setDragId] = useState<string | null>(null)
  const [drop, setDrop] = useState<DropTarget | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const act = (action: ProjectAction) => dispatch({ type: 'project', projectId: project.id, action })
  const stats = projectStats(project)

  const assignees = useMemo(
    () => [...new Set(Object.values(project.issues).map((i) => i.assignee))].sort((a, b) => a.localeCompare(b)),
    [project.issues],
  )

  // Tastenkürzel: "/" Suche, "c" neuer Vorgang
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement
      if (el.closest('input, textarea, select, [contenteditable]') || e.metaKey || e.ctrlKey || openIssueId) return
      if (e.key === '/') {
        e.preventDefault()
        searchRef.current?.focus()
      } else if (e.key === 'c') {
        e.preventDefault()
        setCreatingIn(project.columns[0]?.id ?? null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [project.columns, openIssueId])

  const q = search.trim().toLowerCase()
  const matches = (i: Issue) =>
    (!q || `${project.key}-${i.number} ${i.title} ${i.labels.join(' ')} ${i.assignee}`.toLowerCase().includes(q)) &&
    (types.length === 0 || types.includes(i.type)) &&
    (assigneeFilter === null || i.assignee === assigneeFilter)
  const filtering = !!q || types.length > 0 || assigneeFilter !== null

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    if (dragId && drop) act({ type: 'moveIssue', id: dragId, toColumnId: drop.columnId, beforeId: drop.beforeId })
    setDragId(null)
    setDrop(null)
  }

  const openIssue = openIssueId ? project.issues[openIssueId] : null

  return (
    <div className="flex h-full flex-col">
      {/* Kopfbereich */}
      <header className="border-b border-slate-200 bg-white/70 px-4 pt-4 pb-4 backdrop-blur sm:px-8 sm:pt-6 dark:border-night-800 dark:bg-night-950/70">
        <div className="flex items-center gap-2">
          <button className="icon-btn -ml-1.5 lg:hidden" onClick={onOpenMenu} title="Menü">
            <Menu size={20} />
          </button>
          <ProjectSwitcher project={project} projects={projects} onNewProject={onNewProject} />
        </div>

        <div className="mt-3 flex flex-wrap items-end gap-x-6 gap-y-4">
          <div className="flex min-w-0 items-center gap-4">
            <ProjectAvatar project={project} size={48} />
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
                {project.name}
              </h1>
              <div className="mt-0.5 flex items-center gap-2 text-sm text-slate-500">
                <span className="font-mono text-xs">{project.key}</span>
                <span>·</span>
                <span>
                  {stats.total} {stats.total === 1 ? 'Vorgang' : 'Vorgänge'}
                </span>
              </div>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-4">
            <div className="hidden w-44 sm:block">
              <div className="mb-1.5 flex justify-between text-xs">
                <span className="text-slate-500">Fortschritt</span>
                <span className="font-semibold tabular-nums">{stats.pct}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-night-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-[width] duration-500"
                  style={{ width: `${stats.pct}%` }}
                />
              </div>
            </div>
            <button className="btn-secondary" onClick={onEditProject} title="Board-Einstellungen">
              <Settings2 size={16} />
              <span className="hidden sm:inline">Einstellungen</span>
            </button>
            <button className="btn-primary" onClick={() => setCreatingIn(project.columns[0]?.id ?? null)}>
              <Plus size={16} strokeWidth={2.5} />
              Erstellen
            </button>
          </div>
        </div>

        {/* Filter */}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
            <input
              ref={searchRef}
              className="input pr-8 pl-9"
              placeholder="Board durchsuchen"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Escape' && (setSearch(''), e.currentTarget.blur())}
            />
            <kbd className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded border border-slate-200 px-1.5 font-sans text-[10px] text-slate-400 dark:border-night-700">
              /
            </kbd>
          </div>

          {assignees.length > 0 && (
            <div className="flex items-center -space-x-1.5">
              {assignees.map((a) => (
                <button
                  key={a || '__none'}
                  onClick={() => setAssigneeFilter(assigneeFilter === a ? null : a)}
                  className={`rounded-full transition hover:z-10 hover:-translate-y-0.5 ${assigneeFilter === a ? 'z-10 ring-2 ring-indigo-500 ring-offset-2 ring-offset-white dark:ring-offset-night-950' : ''}`}
                >
                  <Avatar name={a} size={32} ring />
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(ISSUE_TYPES) as IssueType[]).map((t) => {
              const on = types.includes(t)
              return (
                <button
                  key={t}
                  onClick={() => setTypes(on ? types.filter((x) => x !== t) : [...types, t])}
                  className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition ${on ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-night-700 dark:bg-night-900 dark:text-slate-300 dark:hover:border-night-600'}`}
                >
                  <TypeIcon type={t} size={14} />
                  {ISSUE_TYPES[t].label}
                  {on && <Check size={12} strokeWidth={3} />}
                </button>
              )
            })}
          </div>

          {filtering && (
            <button
              className="btn-ghost px-2 py-1 text-xs"
              onClick={() => {
                setSearch('')
                setTypes([])
                setAssigneeFilter(null)
              }}
            >
              <X size={14} /> Filter zurücksetzen
            </button>
          )}
        </div>
      </header>

      {/* Spalten */}
      <div className="flex flex-1 snap-x scroll-px-4 gap-4 overflow-x-auto px-4 py-5 sm:scroll-px-8 sm:px-8">
        {project.columns.map((col, ci) => (
          <BoardColumn
            key={col.id}
            column={col}
            index={ci}
            project={project}
            issues={(project.order[col.id] ?? []).map((id) => project.issues[id]).filter((i) => i && matches(i))}
            dragId={dragId}
            drop={drop}
            setDrop={setDrop}
            onDrop={onDrop}
            onDragStart={setDragId}
            onDragEnd={() => {
              setDragId(null)
              setDrop(null)
            }}
            onOpen={setOpenIssueId}
            act={act}
            creating={creatingIn === col.id}
            setCreating={(v) => setCreatingIn(v ? col.id : null)}
          />
        ))}
        <AddColumn onAdd={(name) => act({ type: 'addColumn', name })} />
      </div>

      {openIssue && (
        <IssueModal issue={openIssue} project={project} act={act} onClose={() => setOpenIssueId(null)} />
      )}
    </div>
  )
}

/** Dropdown oben links zum schnellen Wechseln zwischen Boards */
function ProjectSwitcher({
  project,
  projects,
  onNewProject,
}: {
  project: Project
  projects: Project[]
  onNewProject: () => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm text-slate-500 transition hover:bg-slate-900/5 hover:text-slate-800 dark:hover:bg-white/5 dark:hover:text-slate-200"
        onClick={() => setOpen(!open)}
      >
        Boards
        <span className="text-slate-300 dark:text-slate-600">/</span>
        <span className="font-medium text-slate-700 dark:text-slate-200">{project.name}</span>
        <ChevronsUpDown size={14} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="menu absolute top-full left-0 z-40 mt-1 w-72">
            <div className="px-2.5 pt-1.5 pb-1 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              Board wechseln
            </div>
            {projects.map((p) => (
              <a key={p.id} href={`#/${p.key}`} className="menu-item" onClick={() => setOpen(false)}>
                <ProjectAvatar project={p} size={22} />
                <span className="flex-1 truncate">{p.name}</span>
                <span className="font-mono text-[10px] text-slate-400">{p.key}</span>
                {p.id === project.id && <Check size={14} className="text-indigo-500" />}
              </a>
            ))}
            <div className="my-1 border-t border-slate-100 dark:border-night-700" />
            <button
              className="menu-item"
              onClick={() => {
                setOpen(false)
                onNewProject()
              }}
            >
              <Plus size={16} className="mx-[3px]" /> Neues Board
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function AddColumn({ onAdd }: { onAdd: (name: string) => void }) {
  const [open, setOpen] = useState(false)
  if (!open)
    return (
      <button
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-dashed border-slate-300 text-slate-400 transition hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-500 dark:border-night-700 dark:hover:bg-indigo-500/10"
        title="Spalte hinzufügen"
        onClick={() => setOpen(true)}
      >
        <Plus size={18} />
      </button>
    )
  return (
    <div className="w-72 shrink-0">
      <input
        className="input"
        autoFocus
        placeholder="Name der Spalte"
        onBlur={(e) => {
          if (e.target.value.trim()) onAdd(e.target.value.trim())
          setOpen(false)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur()
          if (e.key === 'Escape') setOpen(false)
        }}
      />
    </div>
  )
}
