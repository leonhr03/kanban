import {
  Bookmark,
  Bug,
  ChevronDown,
  ChevronsDown,
  ChevronsUp,
  ChevronUp,
  Equal,
  SquareCheck,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { ISSUE_TYPES, PRIORITIES, type IssueType, type Priority, type Project } from '../types'

const TYPE_ICONS: Record<IssueType, LucideIcon> = { story: Bookmark, task: SquareCheck, bug: Bug, epic: Zap }
const PRIORITY_ICONS: Record<Priority, LucideIcon> = {
  highest: ChevronsUp,
  high: ChevronUp,
  medium: Equal,
  low: ChevronDown,
  lowest: ChevronsDown,
}

export function TypeIcon({ type, size = 16 }: { type: IssueType; size?: number }) {
  const t = ISSUE_TYPES[type]
  const Icon = TYPE_ICONS[type]
  return (
    <span
      title={t.label}
      className="inline-flex shrink-0 items-center justify-center rounded text-white"
      style={{ background: t.color, width: size, height: size }}
    >
      <Icon size={size * 0.68} strokeWidth={2.75} fill={type === 'story' || type === 'epic' ? 'currentColor' : 'none'} />
    </span>
  )
}

export function PriorityIcon({ priority, size = 16 }: { priority: Priority; size?: number }) {
  const p = PRIORITIES[priority]
  const Icon = PRIORITY_ICONS[priority]
  return (
    <span title={`Priorität: ${p.label}`} className="inline-flex shrink-0" style={{ color: p.color }}>
      <Icon size={size} strokeWidth={2.75} />
    </span>
  )
}

const AVATAR_GRADIENTS = [
  ['#60a5fa', '#2563eb'],
  ['#a78bfa', '#7c3aed'],
  ['#f472b6', '#db2777'],
  ['#fb923c', '#ea580c'],
  ['#34d399', '#059669'],
  ['#22d3ee', '#0891b2'],
  ['#facc15', '#ca8a04'],
  ['#f87171', '#dc2626'],
]

const hashString = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7)

export function Avatar({ name, size = 24, ring = false }: { name: string; size?: number; ring?: boolean }) {
  const ringCls = ring ? 'ring-2 ring-white dark:ring-night-900' : ''
  if (!name) {
    return (
      <span
        title="Nicht zugewiesen"
        className={`inline-flex shrink-0 items-center justify-center rounded-full border border-dashed border-slate-300 bg-slate-100 text-slate-400 dark:border-night-600 dark:bg-night-800 ${ringCls}`}
        style={{ width: size, height: size, fontSize: size * 0.42 }}
      >
        ?
      </span>
    )
  }
  const [a, b] = AVATAR_GRADIENTS[hashString(name) % AVATAR_GRADIENTS.length]
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  return (
    <span
      title={name}
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${ringCls}`}
      style={{ width: size, height: size, fontSize: size * 0.38, background: `linear-gradient(135deg, ${a}, ${b})` }}
    >
      {initials}
    </span>
  )
}

const LABEL_STYLES = [
  'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
  'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
  'bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300',
  'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-500/15 dark:text-fuchsia-300',
]

export function LabelPill({ label, children }: { label: string; children?: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] leading-4 font-medium ${LABEL_STYLES[hashString(label) % LABEL_STYLES.length]}`}
    >
      {label}
      {children}
    </span>
  )
}

function projectInitials(p: Pick<Project, 'key' | 'name'>) {
  const words = p.name.trim().split(/\s+/).filter(Boolean)
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase()
  return (words[0]?.slice(0, 2) || p.key.slice(0, 2) || '?').toUpperCase()
}

export function ProjectAvatar({
  project,
  size = 24,
}: {
  project: Pick<Project, 'key' | 'name' | 'color'>
  size?: number
}) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center font-bold text-white shadow-sm"
      style={{
        background: `linear-gradient(135deg, color-mix(in srgb, ${project.color} 75%, white), ${project.color})`,
        width: size,
        height: size,
        fontSize: size * 0.38,
        borderRadius: size * 0.28,
      }}
    >
      {projectInitials(project)}
    </span>
  )
}
