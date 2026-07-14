import { Link } from 'react-router-dom'
import Button from '../components/common/Button'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="max-w-xl rounded-[2.25rem] border border-slate-800 bg-slate-900/80 p-10 text-center shadow-2xl shadow-slate-950/40">
        <p className="text-xs uppercase tracking-[0.4em] text-cyan-300">404</p>
        <h3 className="mt-4 text-3xl font-semibold text-white">Page not found</h3>
        <p className="mt-3 text-sm text-slate-400">The route you requested does not exist in the Ethara workspace.</p>
        <div className="mt-6 flex justify-center">
          <Link to="/">
            <Button>Return to dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
