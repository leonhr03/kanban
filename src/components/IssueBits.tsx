import { ISSUE_TYPES, PRIORITIES, type IssueType, type Priority } from '../types'

export function TypeIcon({ type }: { type: IssueType }) {
  const t = ISSUE_TYPES[type]
  return (
    <span
      title={t.label}
      className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-sm text-[9px] leading-none text-white"
      style={{ background: t.color }}
    >
      {t.icon}
    </span>
  )
}

export function PriorityIcon({ priority }: { priority: Priority }) {
  const p = PRIORITIES[priority]
  return (
    <span title={`Priorität: ${p.label}`} className="text-sm leading-none font-bold" style={{ color: p.color }}>
      {p.icon}
    </span>
  )
}

const AVATAR_COLORS = ['#0ea5e9', '#8b5cf6', '#ec4899', '#f97316', '#10b981', '#6366f1', '#ef4444', '#14b8a6']

export function Avatar({ name, size = 24 }: { name: string; size?: number }) {
  if (!name) {
    return (
      <span
        title="Nicht zugewiesen"
        className="inline-flex shrink-0 items-center justify-center rounded-full border border-dashed border-slate-400 text-slate-400"
        style={{ width: size, height: size, fontSize: size * 0.45 }}
      >
        ?
      </span>
    )
  }
  const hash = [...name].reduce((h, c) => h + c.charCodeAt(0), 0)
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  return (
    <span
      title={name}
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{ width: size, height: size, fontSize: size * 0.4, background: AVATAR_COLORS[hash % AVATAR_COLORS.length] }}
    >
      {initials}
    </span>
  )
}
