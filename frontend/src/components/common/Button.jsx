import { cn } from '../../utils/cn'

export default function Button({ children, className, variant = 'primary', ...props }) {
  const variants = {
    primary: 'bg-cyan-400 text-slate-950 hover:bg-cyan-300',
    secondary: 'bg-slate-900 text-white border border-slate-800 hover:border-cyan-400/40',
    danger: 'bg-rose-500 text-white hover:bg-rose-400',
    ghost: 'bg-transparent text-slate-300 hover:bg-slate-900',
  }

  return (
    <button
      className={cn('inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition', variants[variant], className)}
      {...props}
    >
      {children}
    </button>
  )
}
