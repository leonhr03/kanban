import { Clock, Link2, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import type { ProjectAction } from '../store'
import {
  columnColor,
  ISSUE_TYPES,
  PRIORITIES,
  type Issue,
  type IssueType,
  type Priority,
  type Project,
} from '../types'
import { Avatar, LabelPill, PriorityIcon, ProjectAvatar, TypeIcon } from './IssueBits'
import Modal from './Modal'

const fmt = (t: number) =>
  new Date(t).toLocaleString('de-DE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[6.5rem_1fr] items-center gap-2">
      <span className="text-sm text-slate-500">{label}</span>
      <div className="min-w-0">{children}</div>
    </div>
  )
}

const selectCls =
  'w-full cursor-pointer appearance-none rounded-lg border border-transparent bg-transparent px-2 py-1.5 text-sm outline-none transition hover:bg-slate-900/5 focus:border-indigo-500 dark:hover:bg-white/5 dark:[&>option]:bg-night-850'

export default function IssueModal({
  issue,
  project,
  act,
  onClose,
}: {
  issue: Issue
  project: Project
  act: (a: ProjectAction) => void
  onClose: () => void
}) {
  const [title, setTitle] = useState(issue.title)
  const [description, setDescription] = useState(issue.description)
  const [labelInput, setLabelInput] = useState('')
  const update = (patch: Partial<Issue>) => act({ type: 'updateIssue', id: issue.id, patch })

  const key = `${project.key}-${issue.number}`
  const colIndex = project.columns.findIndex((c) => c.id === issue.columnId)
  const knownAssignees = [...new Set(Object.values(project.issues).map((i) => i.assignee).filter(Boolean))]

  const addLabel = () => {
    const l = labelInput.trim().toLowerCase().replace(/\s+/g, '-')
    if (l && !issue.labels.includes(l)) update({ labels: [...issue.labels, l] })
    setLabelInput('')
  }

  return (
    <Modal onClose={onClose} wide>
      {/* Kopfzeile */}
      <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-3 text-sm dark:border-night-800">
        <ProjectAvatar project={project} size={20} />
        <span className="text-slate-500">{project.name}</span>
        <span className="text-slate-300 dark:text-slate-600">/</span>
        <TypeIcon type={issue.type} />
        <span className="font-mono text-xs font-medium text-slate-600 dark:text-slate-300">{key}</span>
        <div className="flex-1" />
        <button
          className="icon-btn"
          title="Link kopieren"
          onClick={() => void navigator.clipboard?.writeText(`${location.href.split('#')[0]}#/${project.key}`)}
        >
          <Link2 size={16} />
        </button>
        <button
          className="icon-btn hover:!bg-red-500/10 hover:!text-red-600"
          title="Löschen"
          onClick={() => {
            if (confirm(`${key} „${issue.title}“ löschen?`)) {
              act({ type: 'deleteIssue', id: issue.id })
              onClose()
            }
          }}
        >
          <Trash2 size={16} />
        </button>
        <button className="icon-btn" onClick={onClose} title="Schließen (Esc)">
          <X size={18} />
        </button>
      </div>

      <div className="grid md:grid-cols-[1fr_20rem]">
        {/* Inhalt */}
        <div className="min-w-0 space-y-5 p-5 sm:p-6">
          <textarea
            rows={1}
            className="field-sizing-content w-full resize-none rounded-lg border border-transparent bg-transparent px-2 py-1 -mx-2 text-2xl font-semibold tracking-tight text-slate-900 outline-none hover:bg-slate-900/[0.03] focus:border-indigo-500 dark:text-white dark:hover:bg-white/[0.03]"
            value={title}
            onChange={(e) => setTitle(e.target.value.replace(/\n/g, ''))}
            onBlur={() => (title.trim() ? title.trim() !== issue.title && update({ title: title.trim() }) : setTitle(issue.title))}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), e.currentTarget.blur())}
          />

          <div>
            <span className="field-label">Beschreibung</span>
            <textarea
              className="input min-h-48 resize-y leading-relaxed"
              placeholder="Beschreibung hinzufügen …"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() => description !== issue.description && update({ description })}
            />
          </div>

          <div>
            <span className="field-label">Labels</span>
            <div className="flex flex-wrap items-center gap-1.5">
              {issue.labels.map((l) => (
                <LabelPill key={l} label={l}>
                  <button
                    className="opacity-60 hover:opacity-100"
                    onClick={() => update({ labels: issue.labels.filter((x) => x !== l) })}
                  >
                    <X size={11} strokeWidth={3} />
                  </button>
                </LabelPill>
              ))}
              <input
                className="min-w-24 flex-1 rounded-md bg-transparent px-1 py-0.5 text-sm outline-none placeholder:text-slate-400"
                placeholder="+ Label hinzufügen"
                value={labelInput}
                onChange={(e) => setLabelInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addLabel()}
                onBlur={addLabel}
              />
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-5 border-t border-slate-100 bg-slate-50/70 p-5 sm:p-6 md:border-t-0 md:border-l dark:border-night-800 dark:bg-night-950/40">
          <div>
            <span className="field-label">Status</span>
            <div className="relative">
              <span
                className="pointer-events-none absolute top-1/2 left-3 h-2.5 w-2.5 -translate-y-1/2 rounded-full"
                style={{ background: columnColor(colIndex, project.columns.length) }}
              />
              <select
                className="input cursor-pointer appearance-none pl-8 font-medium"
                value={issue.columnId}
                onChange={(e) => update({ columnId: e.target.value })}
              >
                {project.columns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <span className="field-label">Details</span>
            <Field label="Bearbeiter">
              <div className="flex items-center gap-1 pl-2">
                <Avatar name={issue.assignee} size={22} />
                <input
                  className="w-full rounded-lg border border-transparent bg-transparent px-1.5 py-1.5 text-sm outline-none placeholder:text-slate-400 hover:bg-slate-900/5 focus:border-indigo-500 dark:hover:bg-white/5"
                  list="assignees"
                  placeholder="Nicht zugewiesen"
                  defaultValue={issue.assignee}
                  onBlur={(e) => e.target.value.trim() !== issue.assignee && update({ assignee: e.target.value.trim() })}
                  onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                />
                <datalist id="assignees">
                  {knownAssignees.map((a) => (
                    <option key={a} value={a} />
                  ))}
                </datalist>
              </div>
            </Field>
            <Field label="Typ">
              <div className="relative flex items-center">
                <span className="pointer-events-none absolute left-2">
                  <TypeIcon type={issue.type} />
                </span>
                <select
                  className={`${selectCls} pl-8`}
                  value={issue.type}
                  onChange={(e) => update({ type: e.target.value as IssueType })}
                >
                  {Object.entries(ISSUE_TYPES).map(([k, t]) => (
                    <option key={k} value={k}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </Field>
            <Field label="Priorität">
              <div className="relative flex items-center">
                <span className="pointer-events-none absolute left-2">
                  <PriorityIcon priority={issue.priority} />
                </span>
                <select
                  className={`${selectCls} pl-8`}
                  value={issue.priority}
                  onChange={(e) => update({ priority: e.target.value as Priority })}
                >
                  {Object.entries(PRIORITIES).map(([k, p]) => (
                    <option key={k} value={k}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            </Field>
            <Field label="Story Points">
              <input
                className={`${selectCls} cursor-text`}
                type="number"
                min={0}
                placeholder="Keine"
                value={issue.storyPoints ?? ''}
                onChange={(e) => update({ storyPoints: e.target.value === '' ? null : Number(e.target.value) })}
              />
            </Field>
          </div>

          <div className="space-y-1 border-t border-slate-200/70 pt-4 text-xs text-slate-400 dark:border-night-800">
            <div className="flex items-center gap-1.5">
              <Clock size={12} /> Erstellt {fmt(issue.createdAt)}
            </div>
            <div className="flex items-center gap-1.5">
              <Clock size={12} /> Aktualisiert {fmt(issue.updatedAt)}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}
