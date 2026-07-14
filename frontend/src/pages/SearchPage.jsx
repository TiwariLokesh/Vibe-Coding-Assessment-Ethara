import { useState } from 'react'
import { Search } from 'lucide-react'
import { searchWorkspace } from '../api/searchApi'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import Spinner from '../components/feedback/Spinner'
import ErrorState from '../components/feedback/ErrorState'
import EmptyState from '../components/feedback/EmptyState'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [results, setResults] = useState(null)

  async function handleSearch(event) {
    event.preventDefault()
    try {
      setLoading(true)
      setError('')
      const response = await searchWorkspace(query)
      setResults(response?.data || response)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-semibold text-white">Search</h3>
        <p className="mt-1 text-sm text-slate-400">Find employees, projects, seats, and allocations from one place.</p>
      </div>

      <form className="rounded-4xl border border-slate-800 bg-slate-900/70 p-5">
        <div className="flex flex-col gap-3 md:flex-row">
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name, code, email, floor, zone, or project" />
          <Button type="submit"><Search className="h-4 w-4" />Search</Button>
        </div>
      </form>

      {loading ? <Spinner label="Searching workspace" /> : null}
      {error ? <ErrorState title="Unable to search" description={error} /> : null}

      {!loading && !error && !results ? (
        <EmptyState title="No search performed yet" description="Enter a query to find records across the workspace." />
      ) : null}

      {results ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <section className="rounded-4xl border border-slate-800 bg-slate-900/70 p-5">
            <h4 className="text-lg font-semibold text-white">Employees</h4>
            <div className="mt-4 space-y-3">
              {(results.employees || []).map((employee) => (
                <div key={employee.id} className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-300">
                  {employee.first_name} {employee.last_name} - {employee.email}
                </div>
              ))}
            </div>
          </section>
          <section className="rounded-4xl border border-slate-800 bg-slate-900/70 p-5">
            <h4 className="text-lg font-semibold text-white">Projects</h4>
            <div className="mt-4 space-y-3">
              {(results.projects || []).map((project) => (
                <div key={project.id} className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-300">
                  {project.name} - {project.code}
                </div>
              ))}
            </div>
          </section>
          <section className="rounded-4xl border border-slate-800 bg-slate-900/70 p-5">
            <h4 className="text-lg font-semibold text-white">Seats</h4>
            <div className="mt-4 space-y-3">
              {(results.seats || []).map((seat) => (
                <div key={seat.id} className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-300">
                  {seat.floor} / {seat.zone} / {seat.seat_number}
                </div>
              ))}
            </div>
          </section>
          <section className="rounded-4xl border border-slate-800 bg-slate-900/70 p-5">
            <h4 className="text-lg font-semibold text-white">Allocations</h4>
            <div className="mt-4 space-y-3">
              {(results.allocations || []).map((allocation) => (
                <div key={allocation.id} className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-300">
                  {allocation.employee_name || allocation.employee?.name || 'Employee'} - {allocation.seat_number || allocation.seat?.seat_number || 'Seat'}
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  )
}
