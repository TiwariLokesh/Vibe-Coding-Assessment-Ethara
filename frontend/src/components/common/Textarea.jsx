import { cn } from '../../utils/cn'

export default function Textarea({ className, label, error, ...props }) {
  return (
    <label className="block space-y-2">
      {label ? <span className="text-sm text-slate-300">{label}</span> : null}
      <textarea
        className={cn(
          'min-h-28 w-full rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/60',
          className,
        )}
        {...props}
      />
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
    </label>
  )
}
