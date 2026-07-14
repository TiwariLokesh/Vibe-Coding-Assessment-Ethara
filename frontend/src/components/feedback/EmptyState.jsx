import { Search } from 'lucide-react'

export default function EmptyState({ title = 'No records found', description = 'Try adjusting your filters or search query.' }) {
  return (
    <div className="rounded-4xl border border-dashed border-slate-700 bg-slate-950/60 p-10 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-cyan-400/10 text-cyan-300">
        <Search className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm text-slate-400">{description}</p>
    </div>
  )
}
