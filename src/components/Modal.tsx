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
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  return (
    <div
      className="animate-fade-in fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/40 p-3 pt-[6vh] backdrop-blur-sm sm:p-6 sm:pt-[8vh] dark:bg-black/60"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={`animate-pop-in w-full ${wide ? 'max-w-4xl' : 'max-w-md'} overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/20 dark:border-night-700 dark:bg-night-900 dark:shadow-black/50`}
      >
        {children}
      </div>
    </div>
  )
}
