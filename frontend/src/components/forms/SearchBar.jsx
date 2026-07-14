import { Search } from 'lucide-react'
import Input from '../common/Input'

export default function SearchBar({ value, onChange, placeholder = 'Search...' }) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-4">
      <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3">
        <Search className="h-4 w-4 text-cyan-300" />
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
        />
      </div>
    </div>
  )
}
