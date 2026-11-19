import { useRef, type Dispatch } from 'react'
import type { Action } from '../store'
import type { AppState, Project } from '../types'

export function ProjectAvatar({ project, size = 24 }: { project: Project; size?: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded font-bold text-white"
      style={{ background: project.color, width: size, height: size, fontSize: size * 0.42 }}
    >
      {project.key.slice(0, 2)}
    </span>
  )
}

export default function Sidebar({
  state,
  dispatch,
  onNewProject,
  onEditProject,
}: {
  state: AppState
  dispatch: Dispatch<Action>
  onNewProject: () => void
  onEditProject: (p: Project) => void
}) {
  const fileInput = useRef<HTMLInputElement>(null)

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `kanban-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const importJson = async (file: File) => {
    try {
      const data = JSON.parse(await file.text()) as AppState
      if (!Array.isArray(data.projects)) throw new Error()
      if (confirm('Alle aktuellen Daten durch das Backup ersetzen?')) dispatch({ type: 'import', state: data })
    } catch {
      alert('Ungültige Backup-Datei.')
    }
  }

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/60">
      <div className="flex items-center gap-2 px-4 py-4">
        <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" className="h-7 w-7" />
        <span className="text-lg font-semibold">Kanban</span>
      </div>

      <div className="flex items-center justify-between px-4 pt-2 pb-1">
        <span className="label mb-0">Projekte</span>
        <button className="btn-ghost px-1.5 py-0.5" title="Neues Projekt" onClick={onNewProject}>
          +
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2">
        {state.projects.map((p) => {
          const active = p.id === state.activeProjectId
          return (
            <div
              key={p.id}
              className={`group flex items-center rounded-md ${active ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200' : 'hover:bg-slate-200/70 dark:hover:bg-slate-800'}`}
            >
              <a
                href={`#/${p.key}`}
                onClick={() => dispatch({ type: 'selectProject', id: p.id })}
                className="flex min-w-0 flex-1 items-center gap-2 px-2 py-1.5 text-sm"
              >
                <ProjectAvatar project={p} />
                <span className="truncate">{p.name}</span>
                <span className="ml-auto text-xs text-slate-400">{Object.keys(p.issues).length}</span>
              </a>
              <button
                className="mr-1 rounded px-1 text-slate-400 opacity-0 group-hover:opacity-100 hover:text-slate-700 dark:hover:text-slate-200"
                title="Projekt bearbeiten"
                onClick={() => onEditProject(p)}
              >
                ⚙
              </button>
            </div>
          )
        })}
      </nav>

      <div className="flex gap-1 border-t border-slate-200 p-2 dark:border-slate-800">
        <button className="btn-ghost flex-1 text-xs" onClick={exportJson}>
          Export
        </button>
        <button className="btn-ghost flex-1 text-xs" onClick={() => fileInput.current?.click()}>
          Import
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void importJson(f)
            e.target.value = ''
          }}
        />
      </div>
    </aside>
  )
}
