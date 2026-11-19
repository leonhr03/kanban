import { useMemo, useState, type Dispatch, type DragEvent } from 'react'
import type { Action } from '../store'
import { ISSUE_TYPES, type Column, type Issue, type IssueType, type Project } from '../types'
import IssueModal from './IssueModal'
import { Avatar, PriorityIcon, TypeIcon } from './IssueBits'
import { ProjectAvatar } from './Sidebar'

type DropTarget = { columnId: string; beforeId: string | null }

export default function Board({
  project,
  dispatch,
  onEditProject,
}: {
  project: Project
  dispatch: Dispatch<Action>
  onEditProject: () => void
}) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<IssueType | ''>('')
  const [assigneeFilter, setAssigneeFilter] = useState<string | null>(null)
  const [openIssueId, setOpenIssueId] = useState<string | null>(null)
  const [creatingIn, setCreatingIn] = useState<string | null>(null)
  const [dragId, setDragId] = useState<string | null>(null)
  const [drop, setDrop] = useState<DropTarget | null>(null)

  const assignees = useMemo(
    () => [...new Set(Object.values(project.issues).map((i) => i.assignee))].sort((a, b) => a.localeCompare(b)),
    [project.issues],
  )

  const matches = (i: Issue) => {
    const q = search.trim().toLowerCase()
    if (q && !`${project.key}-${i.number} ${i.title} ${i.labels.join(' ')}`.toLowerCase().includes(q)) return false
    if (typeFilter && i.type !== typeFilter) return false
    if (assigneeFilter !== null && i.assignee !== assigneeFilter) return false
    return true
  }
  const filtering = !!search.trim() || !!typeFilter || assigneeFilter !== null

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    if (dragId && drop) dispatch({ type: 'moveIssue', id: dragId, toColumnId: drop.columnId, beforeId: drop.beforeId })
    setDragId(null)
    setDrop(null)
  }

  const openIssue = openIssueId ? project.issues[openIssueId] : null

  return (
    <div className="flex h-full flex-col">
      {/* Kopfbereich */}
      <header className="px-6 pt-5 pb-3">
        <div className="flex items-center gap-1.5 text-sm text-slate-500">
          <span>Projekte</span>
          <span>/</span>
          <button className="flex items-center gap-1.5 hover:underline" onClick={onEditProject}>
            <ProjectAvatar project={project} size={18} />
            {project.name}
          </button>
        </div>
        <div className="mt-1 flex items-center gap-3">
          <h1 className="text-2xl font-semibold">{project.key} Board</h1>
          <div className="flex-1" />
          <button className="btn-primary" onClick={() => setCreatingIn(project.columns[0]?.id ?? null)}>
            + Erstellen
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <input
            className="input w-56"
            placeholder="Board durchsuchen…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="flex -space-x-1.5">
            {assignees.map((a) => (
              <button
                key={a || '__none'}
                onClick={() => setAssigneeFilter(assigneeFilter === a ? null : a)}
                className={`rounded-full ring-2 transition hover:z-10 hover:-translate-y-0.5 ${assigneeFilter === a ? 'z-10 ring-blue-500' : 'ring-white dark:ring-slate-950'}`}
              >
                <Avatar name={a} size={30} />
              </button>
            ))}
          </div>
          <select
            className="input w-auto"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as IssueType | '')}
          >
            <option value="">Alle Typen</option>
            {Object.entries(ISSUE_TYPES).map(([k, t]) => (
              <option key={k} value={k}>
                {t.label}
              </option>
            ))}
          </select>
          {filtering && (
            <button
              className="btn-ghost"
              onClick={() => {
                setSearch('')
                setTypeFilter('')
                setAssigneeFilter(null)
              }}
            >
              Filter zurücksetzen
            </button>
          )}
        </div>
      </header>

      {/* Spalten */}
      <div className="flex flex-1 gap-3 overflow-x-auto px-6 pb-6">
        {project.columns.map((col, ci) => (
          <BoardColumn
            key={col.id}
            column={col}
            project={project}
            issues={(project.order[col.id] ?? []).map((id) => project.issues[id]).filter((i) => i && matches(i))}
            isFirst={ci === 0}
            isLast={ci === project.columns.length - 1}
            isDone={ci === project.columns.length - 1}
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
            dispatch={dispatch}
            creating={creatingIn === col.id}
            setCreating={(v) => setCreatingIn(v ? col.id : null)}
          />
        ))}
        <AddColumn onAdd={(name) => dispatch({ type: 'addColumn', name })} />
      </div>

      {openIssue && (
        <IssueModal issue={openIssue} project={project} dispatch={dispatch} onClose={() => setOpenIssueId(null)} />
      )}
    </div>
  )
}

function BoardColumn({
  column,
  project,
  issues,
  isFirst,
  isLast,
  isDone,
  dragId,
  drop,
  setDrop,
  onDrop,
  onDragStart,
  onDragEnd,
  onOpen,
  dispatch,
  creating,
  setCreating,
}: {
  column: Column
  project: Project
  issues: Issue[]
  isFirst: boolean
  isLast: boolean
  isDone: boolean
  dragId: string | null
  drop: DropTarget | null
  setDrop: (d: DropTarget | null) => void
  onDrop: (e: DragEvent) => void
  onDragStart: (id: string) => void
  onDragEnd: () => void
  onOpen: (id: string) => void
  dispatch: Dispatch<Action>
  creating: boolean
  setCreating: (v: boolean) => void
}) {
  const [menu, setMenu] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const isTarget = drop?.columnId === column.id

  const indicator = <div className="my-0.5 h-0.5 rounded bg-blue-500" />

  return (
    <section
      className={`flex w-72 shrink-0 flex-col rounded-lg bg-slate-100 transition dark:bg-slate-900 ${isTarget ? 'ring-2 ring-blue-400/50' : ''}`}
      onDragOver={(e) => {
        e.preventDefault()
        // Über leerem Bereich der Spalte -> ans Ende
        if (e.target === e.currentTarget || (e.target as HTMLElement).dataset.colbody) {
          if (!isTarget || drop?.beforeId !== null) setDrop({ columnId: column.id, beforeId: null })
        }
      }}
      onDrop={onDrop}
    >
      <div className="relative flex items-center gap-2 px-3 pt-3 pb-2">
        {renaming ? (
          <input
            className="input py-0.5 text-xs"
            autoFocus
            defaultValue={column.name}
            onBlur={(e) => {
              if (e.target.value.trim()) dispatch({ type: 'renameColumn', columnId: column.id, name: e.target.value.trim() })
              setRenaming(false)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur()
              if (e.key === 'Escape') setRenaming(false)
            }}
          />
        ) : (
          <h2
            className="truncate text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400"
            onDoubleClick={() => setRenaming(true)}
          >
            {column.name} <span className="ml-1 font-normal">{issues.length}</span>
          </h2>
        )}
        {isDone && <span className="text-green-600" title="Fertig-Spalte">✓</span>}
        <div className="flex-1" />
        <button className="btn-ghost px-1.5 py-0" onClick={() => setMenu(!menu)}>
          ⋯
        </button>
        {menu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenu(false)} />
            <div className="absolute top-9 right-2 z-20 w-44 overflow-hidden rounded-md border border-slate-200 bg-white py-1 text-sm shadow-lg dark:border-slate-700 dark:bg-slate-800">
              {[
                ['Umbenennen', () => setRenaming(true), true],
                ['Nach links', () => dispatch({ type: 'moveColumn', columnId: column.id, dir: -1 }), !isFirst],
                ['Nach rechts', () => dispatch({ type: 'moveColumn', columnId: column.id, dir: 1 }), !isLast],
                [
                  'Spalte löschen',
                  () => {
                    if (confirm(`Spalte „${column.name}" löschen? Vorgänge werden in die erste Spalte verschoben.`))
                      dispatch({ type: 'deleteColumn', columnId: column.id })
                  },
                  project.columns.length > 1,
                ],
              ].map(([label, fn, enabled]) => (
                <button
                  key={label as string}
                  disabled={!enabled}
                  className="block w-full px-3 py-1.5 text-left hover:bg-slate-100 disabled:opacity-40 dark:hover:bg-slate-700"
                  onClick={() => {
                    setMenu(false)
                    ;(fn as () => void)()
                  }}
                >
                  {label as string}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div data-colbody="1" className="flex min-h-16 flex-1 flex-col gap-1.5 overflow-y-auto px-2 pb-2">
        {issues.map((issue) => (
          <div key={issue.id}>
            {isTarget && drop?.beforeId === issue.id && dragId !== issue.id && indicator}
            <IssueCard
              issue={issue}
              project={project}
              done={isDone}
              dragging={dragId === issue.id}
              onOpen={() => onOpen(issue.id)}
              onDragStart={() => onDragStart(issue.id)}
              onDragEnd={onDragEnd}
              onDragOver={(e) => {
                e.preventDefault()
                e.stopPropagation()
                const r = e.currentTarget.getBoundingClientRect()
                const after = e.clientY > r.top + r.height / 2
                const idx = issues.indexOf(issue)
                const beforeId = after ? (issues[idx + 1]?.id ?? null) : issue.id
                if (drop?.columnId !== column.id || drop.beforeId !== beforeId) setDrop({ columnId: column.id, beforeId })
              }}
            />
          </div>
        ))}
        {isTarget && drop?.beforeId === null && indicator}

        {creating ? (
          <QuickCreate
            onCancel={() => setCreating(false)}
            onCreate={(title, type) => dispatch({ type: 'addIssue', draft: { title, type, columnId: column.id } })}
          />
        ) : (
          <button
            data-colbody="1"
            className="btn-ghost mt-0.5 justify-start text-slate-500"
            onClick={() => setCreating(true)}
          >
            + Vorgang erstellen
          </button>
        )}
      </div>
    </section>
  )
}

function IssueCard({
  issue,
  project,
  done,
  dragging,
  onOpen,
  onDragStart,
  onDragEnd,
  onDragOver,
}: {
  issue: Issue
  project: Project
  done: boolean
  dragging: boolean
  onOpen: () => void
  onDragStart: () => void
  onDragEnd: () => void
  onDragOver: (e: DragEvent<HTMLDivElement>) => void
}) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', issue.id)
        onDragStart()
      }}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onClick={onOpen}
      className={`cursor-pointer rounded-md border border-slate-200 bg-white p-2.5 text-sm shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 ${dragging ? 'opacity-40' : ''}`}
    >
      <p className={`mb-2 leading-snug ${done ? 'text-slate-500 line-through decoration-slate-400' : ''}`}>
        {issue.title}
      </p>
      {issue.labels.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {issue.labels.map((l) => (
            <span
              key={l}
              className="rounded bg-slate-200 px-1.5 py-0.5 text-[11px] font-medium text-slate-700 uppercase dark:bg-slate-700 dark:text-slate-300"
            >
              {l}
            </span>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2">
        <TypeIcon type={issue.type} />
        <span className={`text-xs font-medium text-slate-500 ${done ? 'line-through' : ''}`}>
          {project.key}-{issue.number}
        </span>
        <div className="flex-1" />
        {issue.storyPoints != null && (
          <span className="rounded-full bg-slate-200 px-1.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
            {issue.storyPoints}
          </span>
        )}
        <PriorityIcon priority={issue.priority} />
        <Avatar name={issue.assignee} size={22} />
      </div>
    </div>
  )
}

function QuickCreate({
  onCreate,
  onCancel,
}: {
  onCreate: (title: string, type: IssueType) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState('')
  const [type, setType] = useState<IssueType>('task')
  return (
    <div className="rounded-md border-2 border-blue-500 bg-white p-2 dark:bg-slate-800">
      <textarea
        autoFocus
        rows={2}
        className="w-full resize-none bg-transparent text-sm outline-none"
        placeholder="Was muss erledigt werden?"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            if (title.trim()) {
              onCreate(title.trim(), type)
              setTitle('')
            }
          }
          if (e.key === 'Escape') onCancel()
        }}
        onBlur={() => !title.trim() && onCancel()}
      />
      <div className="flex items-center gap-2">
        <select
          className="rounded bg-transparent text-xs outline-none"
          value={type}
          onChange={(e) => setType(e.target.value as IssueType)}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {Object.entries(ISSUE_TYPES).map(([k, t]) => (
            <option key={k} value={k}>
              {t.label}
            </option>
          ))}
        </select>
        <span className="flex-1 text-right text-[11px] text-slate-400">Enter ↵</span>
      </div>
    </div>
  )
}

function AddColumn({ onAdd }: { onAdd: (name: string) => void }) {
  const [open, setOpen] = useState(false)
  if (!open)
    return (
      <button
        className="h-10 w-10 shrink-0 rounded-lg bg-slate-100 text-xl text-slate-500 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800"
        title="Spalte hinzufügen"
        onClick={() => setOpen(true)}
      >
        +
      </button>
    )
  return (
    <div className="w-72 shrink-0">
      <input
        className="input"
        autoFocus
        placeholder="Spaltenname"
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
