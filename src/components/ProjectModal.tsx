import { useState, type Dispatch, type FormEvent } from 'react'
import { createProject, type Action } from '../store'
import { PROJECT_COLORS, type Project } from '../types'
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
  const keyError = !/^[A-Z][A-Z0-9]{1,9}$/.test(finalKey)
    ? '2–10 Zeichen, beginnt mit Buchstabe'
    : existingKeys.includes(finalKey)
      ? 'Schlüssel bereits vergeben'
      : null

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim() || keyError) return
    if (project) dispatch({ type: 'updateProject', id: project.id, patch: { name: name.trim(), key: finalKey, color } })
    else dispatch({ type: 'addProject', project: createProject(name.trim(), finalKey, color) })
    onClose()
  }

  const remove = () => {
    if (!project) return
    if (confirm(`Projekt „${project.name}" mit allen ${Object.keys(project.issues).length} Vorgängen löschen?`)) {
      dispatch({ type: 'deleteProject', id: project.id })
      onClose()
    }
  }

  return (
    <Modal onClose={onClose}>
      <form onSubmit={submit} className="space-y-4 p-5">
        <h2 className="text-lg font-semibold">{project ? 'Projekt bearbeiten' : 'Neues Projekt'}</h2>
        <div>
          <label className="label">Name</label>
          <input className="input" autoFocus value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="label">Schlüssel</label>
          <input
            className="input font-mono uppercase"
            value={finalKey}
            onChange={(e) => {
              setKeyTouched(true)
              setKey(e.target.value)
            }}
          />
          <p className={`mt-1 text-xs ${keyError && finalKey ? 'text-red-600' : 'text-slate-500'}`}>
            {keyError && finalKey ? keyError : `Vorgänge heißen z. B. ${finalKey || 'KEY'}-1`}
          </p>
        </div>
        <div>
          <label className="label">Farbe</label>
          <div className="flex gap-2">
            {PROJECT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className={`h-7 w-7 rounded-full ring-offset-2 dark:ring-offset-slate-900 ${c === color ? 'ring-2 ring-slate-500' : ''}`}
                style={{ background: c }}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 pt-2">
          {project && (
            <button type="button" className="btn-danger" onClick={remove}>
              Löschen
            </button>
          )}
          <div className="flex-1" />
          <button type="button" className="btn-ghost" onClick={onClose}>
            Abbrechen
          </button>
          <button className="btn-primary" disabled={!name.trim() || !!keyError}>
            {project ? 'Speichern' : 'Erstellen'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
