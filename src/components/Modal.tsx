import { useEffect, type ReactNode } from 'react'

export default function Modal({
  onClose,
  children,
  wide = false,
}: {
  onClose: () => void
  children: ReactNode
  wide?: boolean
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 pt-[8vh]"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={`w-full ${wide ? 'max-w-3xl' : 'max-w-md'} rounded-lg bg-white shadow-2xl dark:bg-slate-900 dark:ring-1 dark:ring-slate-800`}
      >
        {children}
      </div>
    </div>
  )
}
