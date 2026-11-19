import { useEffect, useState } from 'react'
import Board from './components/Board'
import ProjectModal from './components/ProjectModal'
import Sidebar from './components/Sidebar'
import { useAppState } from './store'
import type { Project } from './types'

/** Projekt-Schlüssel aus der URL (#/WEB) lesen */
const keyFromHash = () => decodeURIComponent(location.hash.replace(/^#\/?/, '')).toUpperCase()

export default function App() {
  const [state, dispatch] = useAppState()
  const [projectModal, setProjectModal] = useState<{ project?: Project } | null>(null)
  const active = state.projects.find((p) => p.id === state.activeProjectId) ?? null

  // URL -> aktives Projekt
  useEffect(() => {
    const sync = () => {
      const p = state.projects.find((x) => x.key === keyFromHash())
      if (p && p.id !== state.activeProjectId) dispatch({ type: 'selectProject', id: p.id })
    }
    sync()
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [state.projects, state.activeProjectId, dispatch])

  // aktives Projekt -> URL
  useEffect(() => {
    if (active && keyFromHash() !== active.key) history.replaceState(null, '', `#/${active.key}`)
    document.title = active ? `${active.name} – Kanban` : 'Kanban'
  }, [active])

  return (
    <div className="flex h-full">
      <Sidebar
        state={state}
        dispatch={dispatch}
        onNewProject={() => setProjectModal({})}
        onEditProject={(project) => setProjectModal({ project })}
      />
      <main className="min-w-0 flex-1">
        {active ? (
          <Board project={active} dispatch={dispatch} onEditProject={() => setProjectModal({ project: active })} />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-500">
            <p>Noch kein Projekt vorhanden.</p>
            <button className="btn-primary" onClick={() => setProjectModal({})}>
              + Projekt erstellen
            </button>
          </div>
        )}
      </main>
      {projectModal && (
        <ProjectModal
          project={projectModal.project}
          existingKeys={state.projects.filter((p) => p.id !== projectModal.project?.id).map((p) => p.key)}
          dispatch={dispatch}
          onClose={() => setProjectModal(null)}
        />
      )}
    </div>
  )
}
