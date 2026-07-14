export default function DataTable({ columns, rows, emptyState }) {
  return (
    <div className="overflow-hidden rounded-4xl border border-slate-800 bg-slate-900/70">
      <table className="min-w-full divide-y divide-slate-800 text-left text-sm">
        <thead className="bg-slate-950/60 text-slate-400">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className="px-4 py-3 font-medium uppercase tracking-[0.22em]">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800 text-slate-200">{rows}</tbody>
      </table>
      {!rows?.length ? <div className="px-4 py-10 text-sm text-slate-400">{emptyState}</div> : null}
    </div>
  )
}
