import { cn } from '../../utils/cn'

export default function Select({ className, label, children, error, ...props }) {
  return (
    <label className="block space-y-2">
      {label ? <span className="text-sm text-slate-300">{label}</span> : null}
      <select
        className={cn(
          'w-full rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/60',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
    </label>
  )
}
