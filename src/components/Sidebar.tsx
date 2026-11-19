import { Download, Monitor, Moon, Plus, Settings2, Sun, Upload, X } from 'lucide-react'
import { useRef, type Dispatch } from 'react'
import { projectStats, type Action } from '../store'
import { useTheme, type ThemeMode } from '../theme'
import type { AppState, Project } from '../types'
import { ProjectAvatar } from './IssueBits'

const THEMES: { mode: ThemeMode; icon: typeof Sun; label: string }[] = [
  { mode: 'light', icon: Sun, label: 'Hell' },
  { mode: 'system', icon: Monitor, label: 'System' },
  { mode: 'dark', icon: Moon, label: 'Dunkel' },
]

export default function Sidebar({
  state,
  activeId,
  dispatch,
  onNewProject,
  onEditProject,
  onClose,
}: {
  state: AppState
  activeId: string | null
  dispatch: Dispatch<Action>
  onNewProject: () => void
  onEditProject: (p: Project) => void
  onClose?: () => void
}) {
  const fileInput = useRef<HTMLInputElement>(null)
  const [theme, setTheme] = useTheme()

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
    <aside className="flex h-full w-64 shrink-0 flex-col bg-night-950 text-slate-300 lg:w-64 dark:border-r dark:border-night-800">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 pt-5 pb-6">
        <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" className="h-8 w-8" />
        <div className="leading-tight">
          <div className="font-semibold text-white">Kanban</div>
          <div className="text-xs text-slate-500">Projektboards</div>
        </div>
        {onClose && (
          <button className="ml-auto rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white" onClick={onClose}>
            <X size={18} />
          </button>
        )}
      </div>

      {/* Projekte */}
      <div className="flex items-center justify-between px-5 pb-2">
        <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">Boards</span>
        <span className="text-[11px] text-slate-600">{state.projects.length}</span>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3">
        {state.projects.map((p) => {
          const active = p.id === activeId
          const { total, pct } = projectStats(p)
          return (
            <div
              key={p.id}
              className={`group relative flex items-center rounded-xl transition ${active ? 'bg-white/10 text-white' : 'hover:bg-white/5 hover:text-white'}`}
            >
              {active && <span className="absolute top-2 bottom-2 -left-3 w-1 rounded-r-full bg-indigo-400" />}
              <a href={`#/${p.key}`} onClick={onClose} className="flex min-w-0 flex-1 items-center gap-3 px-2.5 py-2">
                <ProjectAvatar project={p} size={30} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{p.name}</span>
                  <span className="mt-1 flex items-center gap-2">
                    <span className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
                      <span className="block h-full rounded-full" style={{ width: `${pct}%`, background: p.color }} />
                    </span>
                    <span className="text-[10px] text-slate-500 tabular-nums">{total}</span>
                  </span>
                </span>
              </a>
              <button
                className="mr-1.5 rounded-md p-1 text-slate-500 opacity-0 transition group-hover:opacity-100 hover:bg-white/10 hover:text-white focus:opacity-100"
                title="Board-Einstellungen"
                onClick={() => onEditProject(p)}
              >
                <Settings2 size={15} />
              </button>
            </div>
          )
        })}

        <button
          className="mt-1 flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white"
          onClick={onNewProject}
        >
          <span className="flex h-[30px] w-[30px] items-center justify-center rounded-lg border border-dashed border-slate-600">
            <Plus size={16} />
          </span>
          Neues Board
        </button>
      </nav>

      {/* Fußbereich */}
      <div className="space-y-3 border-t border-white/5 p-4">
        <div className="flex rounded-lg bg-white/5 p-1">
          {THEMES.map(({ mode, icon: Icon, label }) => (
            <button
              key={mode}
              title={label}
              onClick={() => setTheme(mode)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs transition ${theme === mode ? 'bg-white/10 text-white shadow-sm' : 'text-slate-500 hover:text-slate-200'}`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          <button
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs text-slate-400 hover:bg-white/5 hover:text-white"
            onClick={exportJson}
          >
            <Download size={14} /> Export
          </button>
          <button
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs text-slate-400 hover:bg-white/5 hover:text-white"
            onClick={() => fileInput.current?.click()}
          >
            <Upload size={14} /> Import
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
      </div>
    </aside>
  )
}
