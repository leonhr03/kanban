import { useEffect, useState, useSyncExternalStore } from 'react'
import Board from './components/Board'
import ProjectModal from './components/ProjectModal'
import Sidebar from './components/Sidebar'
import { readHashKey, subscribeHash } from './nav'
import { useAppState } from './store'
import type { Project } from './types'

export default function App() {
  const [state, dispatch] = useAppState()
  const hashKey = useSyncExternalStore(subscribeHash, readHashKey)
  const [projectModal, setProjectModal] = useState<{ project?: Project } | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const active =
    state.projects.find((p) => p.key === hashKey) ??
    state.projects.find((p) => p.id === state.activeProjectId) ??
    state.projects[0] ??
    null

  // Zuletzt geöffnetes Board merken und ungültige/leere URLs korrigieren
  useEffect(() => {
    if (!active) return
    if (active.id !== state.activeProjectId) dispatch({ type: 'selectProject', id: active.id })
    if (hashKey !== active.key) history.replaceState(null, '', `#/${active.key}`)
    document.title = `${active.name} · Kanban`
  }, [active, hashKey, state.activeProjectId, dispatch])

  const sidebarProps = {
    activeId: active?.id ?? null,
    state,
    dispatch,
    onNewProject: () => setProjectModal({}),
    onEditProject: (project: Project) => setProjectModal({ project }),
  }

  return (
    <div className="flex h-full">
      <div className="hidden lg:flex">
        <Sidebar {...sidebarProps} />
      </div>
      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="animate-fade-in absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <div className="animate-slide-in relative flex h-full w-72">
            <Sidebar {...sidebarProps} onClose={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}

      <main className="flex min-w-0 flex-1 flex-col">
        {active ? (
          <Board
            key={active.id}
            project={active}
            projects={state.projects}
            dispatch={dispatch}
            onEditProject={() => setProjectModal({ project: active })}
            onNewProject={() => setProjectModal({})}
            onOpenMenu={() => setDrawerOpen(true)}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
            <div className="text-5xl">🗂️</div>
            <div>
              <h2 className="text-lg font-semibold">Noch kein Projekt</h2>
              <p className="text-sm text-slate-500">Lege dein erstes Board an, um loszulegen.</p>
            </div>
            <button className="btn-primary" onClick={() => setProjectModal({})}>
              Projekt erstellen
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
