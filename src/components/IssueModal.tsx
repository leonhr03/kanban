import { useState, type Dispatch } from 'react'
import type { Action } from '../store'
import { ISSUE_TYPES, PRIORITIES, type Issue, type IssueType, type Priority, type Project } from '../types'
import { Avatar, PriorityIcon, TypeIcon } from './IssueBits'
import Modal from './Modal'

const fmt = (t: number) =>
  new Date(t).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

export default function IssueModal({
  issue,
  project,
  dispatch,
  onClose,
}: {
  issue: Issue
  project: Project
  dispatch: Dispatch<Action>
  onClose: () => void
}) {
  const [title, setTitle] = useState(issue.title)
  const [description, setDescription] = useState(issue.description)
  const [labelInput, setLabelInput] = useState('')
  const update = (patch: Partial<Issue>) => dispatch({ type: 'updateIssue', id: issue.id, patch })

  const knownAssignees = [...new Set(Object.values(project.issues).map((i) => i.assignee).filter(Boolean))]

  const addLabel = () => {
    const l = labelInput.trim().toLowerCase().replace(/\s+/g, '-')
    if (l && !issue.labels.includes(l)) update({ labels: [...issue.labels, l] })
    setLabelInput('')
  }

  return (
    <Modal onClose={onClose} wide>
      <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-3 text-sm dark:border-slate-800">
        <TypeIcon type={issue.type} />
        <span className="font-medium text-slate-500">
          {project.key}-{issue.number}
        </span>
        <div className="flex-1" />
        <button
          className="btn-danger"
          onClick={() => {
            if (confirm(`${project.key}-${issue.number} löschen?`)) {
              dispatch({ type: 'deleteIssue', id: issue.id })
              onClose()
            }
          }}
        >
          Löschen
        </button>
        <button className="btn-ghost text-lg leading-none" onClick={onClose} title="Schließen (Esc)">
          ×
        </button>
      </div>

      <div className="grid gap-6 p-5 md:grid-cols-[1fr_15rem]">
        {/* Links: Inhalt */}
        <div className="min-w-0 space-y-4">
          <input
            className="w-full rounded-md border border-transparent bg-transparent px-2 py-1 text-xl font-semibold outline-none hover:bg-slate-100 focus:border-blue-500 dark:hover:bg-slate-800"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => (title.trim() ? update({ title: title.trim() }) : setTitle(issue.title))}
            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          />
          <div>
            <label className="label px-2">Beschreibung</label>
            <textarea
              className="input min-h-40 resize-y"
              placeholder="Beschreibung hinzufügen…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() => description !== issue.description && update({ description })}
            />
          </div>
          <p className="px-2 text-xs text-slate-400">
            Erstellt {fmt(issue.createdAt)} · Aktualisiert {fmt(issue.updatedAt)}
          </p>
        </div>

        {/* Rechts: Details */}
        <div className="space-y-4">
          <div>
            <label className="label">Status</label>
            <select
              className="input font-medium"
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

          <div>
            <label className="label">Bearbeiter</label>
            <div className="flex items-center gap-2">
              <Avatar name={issue.assignee} size={28} />
              <input
                className="input"
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
          </div>

          <div>
            <label className="label">Typ</label>
            <div className="flex items-center gap-2">
              <TypeIcon type={issue.type} />
              <select
                className="input"
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
          </div>

          <div>
            <label className="label">Priorität</label>
            <div className="flex items-center gap-2">
              <span className="w-4 text-center">
                <PriorityIcon priority={issue.priority} />
              </span>
              <select
                className="input"
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
          </div>

          <div>
            <label className="label">Story Points</label>
            <input
              className="input"
              type="number"
              min={0}
              placeholder="–"
              value={issue.storyPoints ?? ''}
              onChange={(e) => update({ storyPoints: e.target.value === '' ? null : Number(e.target.value) })}
            />
          </div>

          <div>
            <label className="label">Labels</label>
            <div className="mb-2 flex flex-wrap gap-1">
              {issue.labels.map((l) => (
                <span
                  key={l}
                  className="inline-flex items-center gap-1 rounded bg-slate-200 px-1.5 py-0.5 text-xs dark:bg-slate-700"
                >
                  {l}
                  <button
                    className="text-slate-500 hover:text-red-600"
                    onClick={() => update({ labels: issue.labels.filter((x) => x !== l) })}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <input
              className="input"
              placeholder="Label + Enter"
              value={labelInput}
              onChange={(e) => setLabelInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addLabel()}
              onBlur={addLabel}
            />
          </div>
        </div>
      </div>
    </Modal>
  )
}
