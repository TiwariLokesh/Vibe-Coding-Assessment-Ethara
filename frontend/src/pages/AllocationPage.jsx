import { useEffect, useState } from 'react'
import { RefreshCcw, ArrowRightLeft } from 'lucide-react'
import { allocateSeat, releaseSeat } from '../api/allocationApi'
import { fetchEmployees } from '../api/employeeApi'
import { fetchAvailableSeats } from '../api/seatApi'
import { fetchProjects } from '../api/projectApi'
import Button from '../components/common/Button'
import Select from '../components/common/Select'
import Spinner from '../components/feedback/Spinner'
import ErrorState from '../components/feedback/ErrorState'
import EmptyState from '../components/feedback/EmptyState'
import Modal from '../components/common/Modal'

export default function AllocationPage() {
  const [employees, setEmployees] = useState([])
  const [seats, setSeats] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [employeeId, setEmployeeId] = useState('')
  const [seatId, setSeatId] = useState('')
  const [projectId, setProjectId] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [releaseModalOpen, setReleaseModalOpen] = useState(false)
  const [releaseEmployeeId, setReleaseEmployeeId] = useState('')

  async function loadData() {
    try {
      setLoading(true)
      setError('')
      const [employeeResponse, seatResponse, projectResponse] = await Promise.all([
        fetchEmployees({ status: 'active' }),
        fetchAvailableSeats(),
        fetchProjects(),
      ])
      setEmployees(employeeResponse?.data?.items || employeeResponse?.data || employeeResponse?.items || employeeResponse || [])
      setSeats(seatResponse?.data?.items || seatResponse?.data || seatResponse?.items || seatResponse || [])
      setProjects(projectResponse?.data?.items || projectResponse?.data || projectResponse?.items || projectResponse || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  async function handleAllocate(event) {
    event.preventDefault()
    const response = await allocateSeat({ employee_id: employeeId, seat_id: seatId, project_id: projectId || null })
    setConfirmation(response?.message || 'Seat allocated successfully')
    setEmployeeId('')
    setSeatId('')
    setProjectId('')
    await loadData()
  }

  async function handleRelease(event) {
    event.preventDefault()
    const response = await releaseSeat({ employee_id: releaseEmployeeId })
    setConfirmation(response?.message || 'Seat released successfully')
    setReleaseModalOpen(false)
    setReleaseEmployeeId('')
    await loadData()
  }

  if (loading) return <Spinner label="Loading allocation workspace" />
  if (error) return <ErrorState title="Unable to load allocation workspace" description={error} />

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-semibold text-white">Seat Allocation</h3>
          <p className="mt-1 text-sm text-slate-400">Assign an employee to an available seat and optionally connect a project.</p>
        </div>
        <Button variant="secondary" onClick={loadData}><RefreshCcw className="h-4 w-4" />Refresh</Button>
      </div>

      {confirmation ? <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{confirmation}</div> : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <form className="space-y-4 rounded-4xl border border-slate-800 bg-slate-900/70 p-6" onSubmit={handleAllocate}>
          <h4 className="text-lg font-semibold text-white">Allocate Seat</h4>
          <Select label="Employee" value={employeeId} onChange={(event) => setEmployeeId(event.target.value)} required>
            <option value="">Select employee</option>
            {employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.first_name} {employee.last_name}</option>)}
          </Select>
          <Select label="Seat" value={seatId} onChange={(event) => setSeatId(event.target.value)} required>
            <option value="">Select seat</option>
            {seats.map((seat) => <option key={seat.id} value={seat.id}>{seat.floor} - {seat.zone} - {seat.seat_number}</option>)}
          </Select>
          <Select label="Project" value={projectId} onChange={(event) => setProjectId(event.target.value)}>
            <option value="">Optional project</option>
            {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
          </Select>
          <Button type="submit"><ArrowRightLeft className="h-4 w-4" />Allocate now</Button>
        </form>

        <div className="rounded-4xl border border-slate-800 bg-slate-900/70 p-6">
          <div className="flex items-center justify-between gap-4">
            <h4 className="text-lg font-semibold text-white">Release Seat</h4>
            <Button variant="secondary" onClick={() => setReleaseModalOpen(true)}>Open release form</Button>
          </div>
          <div className="mt-4 space-y-3 text-sm text-slate-400">
            <p>Release an employee’s current seat to return it to the available pool.</p>
            <p>Use this when a person moves teams, floors, or leaves the workspace.</p>
          </div>
          <div className="mt-6 rounded-3xl border border-dashed border-slate-700 bg-slate-950/60 p-6">
            <EmptyState title="No active release session" description="Open the release form to select the employee being removed from a seat." />
          </div>
        </div>
      </div>

      <Modal open={releaseModalOpen} title="Release Seat" onClose={() => setReleaseModalOpen(false)} actions={<>
        <Button variant="ghost" onClick={() => setReleaseModalOpen(false)}>Cancel</Button>
        <Button onClick={handleRelease}>Release</Button>
      </>}>
        <form onSubmit={handleRelease} className="space-y-4">
          <Select label="Employee" value={releaseEmployeeId} onChange={(event) => setReleaseEmployeeId(event.target.value)} required>
            <option value="">Select employee</option>
            {employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.first_name} {employee.last_name}</option>)}
          </Select>
        </form>
      </Modal>
    </div>
  )
}
