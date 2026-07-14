import { X } from 'lucide-react'

export default function Modal({ title, open, onClose, children, actions }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 px-4">
      <div className="w-full max-w-2xl rounded-4xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-slate-950/60">
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-xl font-semibold text-white">{title}</h3>
          </div>
          <button onClick={onClose} aria-label="Close modal" className="rounded-full border border-slate-800 p-2 text-slate-300 hover:bg-slate-800">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="py-5">{children}</div>
        {actions ? <div className="flex flex-wrap justify-end gap-3 border-t border-slate-800 pt-4">{actions}</div> : null}
      </div>
    </div>
  )
}
