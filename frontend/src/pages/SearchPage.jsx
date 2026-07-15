import { useState } from 'react'
import { Search, Users, Briefcase, MapPin, CalendarDays } from 'lucide-react'
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
    if (!query.trim()) return
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
        <h3 className="text-2xl font-semibold text-white">Universal Search</h3>
        <p className="mt-1 text-sm text-slate-400">Search across employees, projects, seats, and allocations in one place.</p>
      </div>

      <form onSubmit={handleSearch} className="rounded-4xl border border-slate-800 bg-slate-900/50 p-5 shadow-lg">
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="flex-1">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by employee name, code, email, project, floor, zone, or seat..."
              className="bg-slate-950 border-slate-800 focus:border-cyan-400/50"
            />
          </div>
          <Button type="submit" disabled={loading || !query.trim()} className="bg-cyan-400 text-slate-950 hover:bg-cyan-300 px-6 flex items-center justify-center gap-2">
            <Search className="h-4 w-4" />
            <span>Search</span>
          </Button>
        </div>
      </form>

      {loading ? <Spinner label="Searching Ethara workspace..." /> : null}
      {error ? <ErrorState title="Search failed" description={error} /> : null}

      {!loading && !error && !results ? (
        <EmptyState title="No search performed yet" description="Type in employee info, floors, zones, or projects to begin." />
      ) : null}

      {!loading && !error && results ? (
        <div className="grid gap-6 xl:grid-cols-2">
          {/* Employees */}
          <section className="rounded-4xl border border-slate-800 bg-slate-900/40 p-5 flex flex-col">
            <h4 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-cyan-400" />
              <span>Employees ({results.employees?.length || 0})</span>
            </h4>
            <div className="space-y-3 flex-1">
              {(results.employees || []).length > 0 ? (
                results.employees.map((employee) => (
                  <div key={employee.id} className="rounded-2xl border border-slate-800/80 bg-slate-950/40 p-4 space-y-1 hover:border-cyan-400/20 transition duration-150">
                    <p className="font-semibold text-white text-sm">{employee.name}</p>
                    <p className="text-xs text-slate-400">
                      Code: <span className="font-mono text-cyan-300">{employee.employee_code}</span> | Email: <span className="text-slate-300">{employee.email}</span>
                    </p>
                    <p className="text-xs text-slate-400">
                      Dept: <span className="text-slate-300">{employee.department}</span> | Role: <span className="text-slate-300">{employee.role}</span>
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-500 italic p-4 text-center">No matching employees found.</div>
              )}
            </div>
          </section>

          {/* Projects */}
          <section className="rounded-4xl border border-slate-800 bg-slate-900/40 p-5 flex flex-col">
            <h4 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
              <Briefcase className="h-5 w-5 text-cyan-400" />
              <span>Projects ({results.projects?.length || 0})</span>
            </h4>
            <div className="space-y-3 flex-1">
              {(results.projects || []).length > 0 ? (
                results.projects.map((project) => (
                  <div key={project.id} className="rounded-2xl border border-slate-800/80 bg-slate-950/40 p-4 space-y-1 hover:border-cyan-400/20 transition duration-150">
                    <p className="font-semibold text-white text-sm">{project.name}</p>
                    <p className="text-xs text-slate-400">
                      Manager: <span className="text-slate-300">{project.manager_name}</span> | Status: <span className="text-cyan-300 uppercase">{project.status}</span>
                    </p>
                    {project.description && (
                      <p className="text-xs text-slate-500 italic mt-1">{project.description}</p>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-500 italic p-4 text-center">No matching projects found.</div>
              )}
            </div>
          </section>

          {/* Seats */}
          <section className="rounded-4xl border border-slate-800 bg-slate-900/40 p-5 flex flex-col">
            <h4 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
              <MapPin className="h-5 w-5 text-cyan-400" />
              <span>Seats ({results.seats?.length || 0})</span>
            </h4>
            <div className="space-y-3 flex-1">
              {(results.seats || []).length > 0 ? (
                results.seats.map((seat) => (
                  <div key={seat.id} className="rounded-2xl border border-slate-800/80 bg-slate-950/40 p-4 hover:border-cyan-400/20 transition duration-150 flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-white text-sm">Seat {seat.seat_number}</p>
                      <p className="text-xs text-slate-400">
                        Floor: <span className="text-slate-300">{seat.floor}</span> | Zone: <span className="text-slate-300">{seat.zone}</span> | Bay: <span className="text-slate-300">{seat.bay}</span>
                      </p>
                    </div>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ${
                      seat.status === 'Available' ? 'bg-green-500/10 text-green-400' :
                      seat.status === 'Occupied' ? 'bg-cyan-500/10 text-cyan-400' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      {seat.status}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-500 italic p-4 text-center">No matching seats found.</div>
              )}
            </div>
          </section>

          {/* Allocations */}
          <section className="rounded-4xl border border-slate-800 bg-slate-900/40 p-5 flex flex-col">
            <h4 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
              <CalendarDays className="h-5 w-5 text-cyan-400" />
              <span>Allocations ({results.allocations?.length || 0})</span>
            </h4>
            <div className="space-y-3 flex-1">
              {(results.allocations || []).length > 0 ? (
                results.allocations.map((allocation) => (
                  <div key={allocation.id} className="rounded-2xl border border-slate-800/80 bg-slate-950/40 p-4 hover:border-cyan-400/20 transition duration-150 flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-white text-sm">
                        {allocation.employee_name}
                      </p>
                      <p className="text-xs text-slate-400">
                        Seat: <span className="text-cyan-300">{allocation.seat_number}</span> (Floor {allocation.floor}, Zone {allocation.zone})
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Project: {allocation.project_name}
                      </p>
                    </div>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-2xs font-semibold uppercase ${
                      allocation.status === 'active' ? 'bg-cyan-500/10 text-cyan-400' :
                      allocation.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      {allocation.status}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-500 italic p-4 text-center">No matching allocations found.</div>
              )}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  )
}
