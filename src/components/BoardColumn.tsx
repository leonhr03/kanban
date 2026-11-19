import { ArrowLeft, ArrowRight, CheckCircle2, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState, type DragEvent } from 'react'
import type { ProjectAction } from '../store'
import { columnColor, ISSUE_TYPES, type Column, type Issue, type IssueType, type Project } from '../types'
import { Avatar, LabelPill, PriorityIcon, TypeIcon } from './IssueBits'

export type DropTarget = { columnId: string; beforeId: string | null }

export default function BoardColumn({
  column,
  index,
  project,
  issues,
  dragId,
  drop,
  setDrop,
  onDrop,
  onDragStart,
  onDragEnd,
  onOpen,
  act,
  creating,
  setCreating,
}: {
  column: Column
  index: number
  project: Project
  issues: Issue[]
  dragId: string | null
  drop: DropTarget | null
  setDrop: (d: DropTarget | null) => void
  onDrop: (e: DragEvent) => void
  onDragStart: (id: string) => void
  onDragEnd: () => void
  onOpen: (id: string) => void
  act: (a: ProjectAction) => void
  creating: boolean
  setCreating: (v: boolean) => void
}) {
  const [menu, setMenu] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const count = project.columns.length
  const isDone = index === count - 1 && count > 1
  const isTarget = !!dragId && drop?.columnId === column.id
  const color = columnColor(index, count)
  const points = issues.reduce((s, i) => s + (i.storyPoints ?? 0), 0)

  const indicator = (
    <div className="relative my-0.5 h-0.5 rounded-full bg-indigo-500">
      <span className="absolute -top-[3px] -left-1 h-2 w-2 rounded-full border-2 border-indigo-500 bg-white dark:bg-night-900" />
    </div>
  )

  const menuItems: [string, typeof Pencil, () => void, boolean][] = [
    ['Umbenennen', Pencil, () => setRenaming(true), true],
    ['Nach links', ArrowLeft, () => act({ type: 'moveColumn', columnId: column.id, dir: -1 }), index > 0],
    ['Nach rechts', ArrowRight, () => act({ type: 'moveColumn', columnId: column.id, dir: 1 }), index < count - 1],
  ]

  return (
    <section
      className={`flex max-h-full w-[85vw] shrink-0 snap-start flex-col rounded-2xl border transition-colors sm:w-[300px] ${isTarget ? 'border-indigo-300 bg-indigo-50/60 dark:border-indigo-500/40 dark:bg-indigo-500/5' : 'border-transparent bg-slate-100/80 dark:bg-night-900'}`}
      onDragOver={(e) => {
        e.preventDefault()
        if (!dragId) return
        const t = e.target as HTMLElement
        if (t === e.currentTarget || t.dataset.colbody) {
          if (drop?.columnId !== column.id || drop.beforeId !== null) setDrop({ columnId: column.id, beforeId: null })
        }
      }}
      onDrop={onDrop}
    >
      {/* Spaltenkopf */}
      <div className="relative flex items-center gap-2 px-3.5 pt-3.5 pb-2.5">
        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: color, boxShadow: `0 0 0 3px ${color}26` }} />
        {renaming ? (
          <input
            className="input py-1 text-sm"
            autoFocus
            defaultValue={column.name}
            onBlur={(e) => {
              if (e.target.value.trim()) act({ type: 'renameColumn', columnId: column.id, name: e.target.value.trim() })
              setRenaming(false)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur()
              if (e.key === 'Escape') setRenaming(false)
            }}
          />
        ) : (
          <h2
            className="truncate text-sm font-semibold text-slate-700 dark:text-slate-200"
            onDoubleClick={() => setRenaming(true)}
            title="Doppelklick zum Umbenennen"
          >
            {column.name}
          </h2>
        )}
        {!renaming && (
          <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-[11px] font-semibold text-slate-600 tabular-nums dark:bg-night-800 dark:text-slate-400">
            {issues.length}
          </span>
        )}
        {isDone && <CheckCircle2 size={15} className="text-emerald-500" />}
        <div className="flex-1" />
        {points > 0 && !renaming && (
          <span className="text-[11px] text-slate-400 tabular-nums" title="Story Points">
            {points} SP
          </span>
        )}
        <button className="icon-btn h-7 w-7" onClick={() => setMenu(!menu)}>
          <MoreHorizontal size={16} />
        </button>
        {menu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenu(false)} />
            <div className="menu absolute top-11 right-2 z-20 w-48">
              {menuItems.map(([label, Icon, fn, enabled]) => (
                <button
                  key={label}
                  disabled={!enabled}
                  className="menu-item"
                  onClick={() => {
                    setMenu(false)
                    fn()
                  }}
                >
                  <Icon size={15} className="text-slate-400" /> {label}
                </button>
              ))}
              <div className="my-1 border-t border-slate-100 dark:border-night-700" />
              <button
                disabled={count <= 1}
                className="menu-item text-red-600 dark:text-red-400"
                onClick={() => {
                  setMenu(false)
                  if (confirm(`Spalte „${column.name}“ löschen? Vorgänge werden in die erste Spalte verschoben.`))
                    act({ type: 'deleteColumn', columnId: column.id })
                }}
              >
                <Trash2 size={15} /> Spalte löschen
              </button>
            </div>
          </>
        )}
      </div>

      {/* Karten */}
      <div data-colbody="1" className="flex min-h-24 flex-1 flex-col gap-2 overflow-y-auto px-2.5 pb-2.5">
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

        {issues.length === 0 && !creating && !isTarget && (
          <div
            data-colbody="1"
            className="flex h-20 items-center justify-center rounded-xl border-2 border-dashed border-slate-200 text-xs text-slate-400 dark:border-night-800"
          >
            Keine Vorgänge
          </div>
        )}

        {creating ? (
          <QuickCreate
            onCancel={() => setCreating(false)}
            onCreate={(title, type) => act({ type: 'addIssue', draft: { title, type, columnId: column.id } })}
          />
        ) : (
          <button
            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-slate-500 transition hover:bg-slate-900/5 hover:text-slate-800 dark:hover:bg-white/5 dark:hover:text-slate-200"
            onClick={() => setCreating(true)}
          >
            <Plus size={16} /> Vorgang erstellen
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
      role="button"
      tabIndex={0}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', issue.id)
        onDragStart()
      }}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onClick={onOpen}
      onKeyDown={(e) => e.key === 'Enter' && onOpen()}
      className={`group cursor-grab rounded-xl border border-slate-200/80 bg-white p-3 shadow-xs transition outline-none hover:-translate-y-px hover:border-slate-300 hover:shadow-md focus-visible:ring-2 focus-visible:ring-indigo-500 active:cursor-grabbing dark:border-night-700 dark:bg-night-850 dark:hover:border-night-600 dark:hover:shadow-black/30 ${dragging ? 'scale-[0.98] opacity-40' : ''}`}
    >
      <p
        className={`text-sm leading-snug font-medium ${done ? 'text-slate-400 line-through decoration-slate-300 dark:text-slate-500 dark:decoration-slate-600' : 'text-slate-800 dark:text-slate-100'}`}
      >
        {issue.title}
      </p>

      {issue.labels.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {issue.labels.map((l) => (
            <LabelPill key={l} label={l} />
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center gap-2">
        <TypeIcon type={issue.type} />
        <span className={`font-mono text-[11px] font-medium text-slate-500 ${done ? 'line-through' : ''}`}>
          {project.key}-{issue.number}
        </span>
        <div className="flex-1" />
        {issue.storyPoints != null && (
          <span
            className="flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-100 px-1.5 text-[11px] font-semibold text-slate-600 tabular-nums dark:bg-night-700 dark:text-slate-300"
            title="Story Points"
          >
            {issue.storyPoints}
          </span>
        )}
        <PriorityIcon priority={issue.priority} />
        <Avatar name={issue.assignee} size={24} />
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
  const submit = () => {
    if (!title.trim()) return
    onCreate(title.trim(), type)
    setTitle('')
  }
  return (
    <div className="animate-pop-in rounded-xl border border-indigo-400 bg-white p-3 shadow-lg ring-3 shadow-indigo-500/10 ring-indigo-500/15 dark:bg-night-850">
      <textarea
        autoFocus
        rows={2}
        className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-slate-400"
        placeholder="Was muss erledigt werden?"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            submit()
          }
          if (e.key === 'Escape') onCancel()
        }}
      />
      <div className="mt-1 flex items-center gap-1">
        {(Object.keys(ISSUE_TYPES) as IssueType[]).map((t) => (
          <button
            key={t}
            title={ISSUE_TYPES[t].label}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setType(t)}
            className={`rounded-md p-1 transition ${type === t ? 'bg-slate-100 ring-1 ring-slate-300 dark:bg-night-700 dark:ring-night-600' : 'opacity-50 hover:opacity-100'}`}
          >
            <TypeIcon type={t} />
          </button>
        ))}
        <div className="flex-1" />
        <button className="btn-ghost px-2 py-1 text-xs" onMouseDown={(e) => e.preventDefault()} onClick={onCancel}>
          Abbrechen
        </button>
        <button
          className="btn-primary px-2.5 py-1 text-xs"
          disabled={!title.trim()}
          onMouseDown={(e) => e.preventDefault()}
          onClick={submit}
        >
          Erstellen
        </button>
      </div>
    </div>
  )
}
