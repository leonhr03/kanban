import { Check, Trash2, X } from 'lucide-react'
import { useState, type Dispatch, type FormEvent } from 'react'
import { goToProject } from '../nav'
import { createProject, type Action } from '../store'
import { PROJECT_COLORS, type Project } from '../types'
import { ProjectAvatar } from './IssueBits'
import Modal from './Modal'

const suggestKey = (name: string) =>
  name
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .map((w, _, all) => (all.length > 1 ? w[0] : w.slice(0, 3)))
    .join('')
    .slice(0, 5)
    .toUpperCase()

export default function ProjectModal({
  project,
  existingKeys,
  dispatch,
  onClose,
}: {
  project?: Project
  existingKeys: string[]
  dispatch: Dispatch<Action>
  onClose: () => void
}) {
  const [name, setName] = useState(project?.name ?? '')
  const [key, setKey] = useState(project?.key ?? '')
  const [keyTouched, setKeyTouched] = useState(!!project)
  const [color, setColor] = useState(project?.color ?? PROJECT_COLORS[0])

  const finalKey = (keyTouched ? key : suggestKey(name)).toUpperCase()
  const keyError = !finalKey
    ? null
    : !/^[A-Z][A-Z0-9]{1,9}$/.test(finalKey)
      ? '2–10 Zeichen, beginnt mit einem Buchstaben'
      : existingKeys.includes(finalKey)
        ? 'Dieser Schlüssel ist schon vergeben'
        : null
  const valid = !!name.trim() && !!finalKey && !keyError

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!valid) return
    if (project) {
      dispatch({ type: 'updateProject', id: project.id, patch: { name: name.trim(), key: finalKey, color } })
    } else {
      dispatch({ type: 'addProject', project: createProject(name.trim(), finalKey, color) })
    }
    goToProject(finalKey)
    onClose()
  }

  const remove = () => {
    if (!project) return
    if (confirm(`Board „${project.name}“ mit allen ${Object.keys(project.issues).length} Vorgängen löschen?`)) {
      dispatch({ type: 'deleteProject', id: project.id })
      onClose()
    }
  }

  return (
    <Modal onClose={onClose}>
      <form onSubmit={submit}>
        <div className="flex items-start gap-4 border-b border-slate-100 p-5 dark:border-night-800">
          <ProjectAvatar project={{ key: finalKey || '?', name, color }} size={48} />
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold">{project ? 'Board-Einstellungen' : 'Neues Board'}</h2>
            <p className="truncate text-sm text-slate-500">{name.trim() || 'Gib deinem Board einen Namen'}</p>
          </div>
          <button type="button" className="icon-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="space-y-5 p-5">
          <div>
            <label className="field-label" htmlFor="pname">
              Name
            </label>
            <input
              id="pname"
              className="input"
              autoFocus
              placeholder="z. B. Website Relaunch"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="field-label" htmlFor="pkey">
              Schlüssel
            </label>
            <input
              id="pkey"
              className="input font-mono uppercase"
              placeholder="WEB"
              value={finalKey}
              onChange={(e) => {
                setKeyTouched(true)
                setKey(e.target.value)
              }}
            />
            <p className={`mt-1.5 text-xs ${keyError ? 'text-red-600 dark:text-red-400' : 'text-slate-500'}`}>
              {keyError ?? `Vorgänge werden ${finalKey || 'KEY'}-1, ${finalKey || 'KEY'}-2 … genannt`}
            </p>
          </div>
          <div>
            <span className="field-label">Farbe</span>
            <div className="flex flex-wrap gap-2.5">
              {PROJECT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-white transition hover:scale-110"
                  style={{ background: c, boxShadow: c === color ? `0 0 0 3px white, 0 0 0 5px ${c}` : undefined }}
                  onClick={() => setColor(c)}
                >
                  {c === color && <Check size={16} strokeWidth={3} />}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 border-t border-slate-100 bg-slate-50/70 px-5 py-3.5 dark:border-night-800 dark:bg-night-950/40">
          {project && (
            <button type="button" className="btn-danger px-2.5" onClick={remove}>
              <Trash2 size={15} /> Löschen
            </button>
          )}
          <div className="flex-1" />
          <button type="button" className="btn-ghost" onClick={onClose}>
            Abbrechen
          </button>
          <button className="btn-primary" disabled={!valid}>
            {project ? 'Speichern' : 'Board erstellen'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
