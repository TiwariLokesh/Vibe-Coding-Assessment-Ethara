import { ChevronLeft, ChevronRight } from 'lucide-react'
import Button from '../common/Button'

export default function Pagination({ page, pageCount, onPageChange }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-800 bg-slate-900/70 px-4 py-4 text-sm text-slate-300">
      <span>
        Page {page} of {pageCount}
      </span>
      <div className="flex items-center gap-2">
        <Button variant="secondary" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft className="h-4 w-4" />
          Prev
        </Button>
        <Button variant="secondary" disabled={page >= pageCount} onClick={() => onPageChange(page + 1)}>
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
