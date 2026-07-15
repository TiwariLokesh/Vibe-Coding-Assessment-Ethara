import { useEffect, useState } from 'react'
import { RefreshCcw, ArrowRightLeft, Search } from 'lucide-react'

import { allocateSeat } from '../api/allocationApi'
import { fetchEmployees } from '../api/employeeApi'
import { fetchAvailableSeats } from '../api/seatApi'
import { fetchProjects } from '../api/projectApi'

import Button from '../components/common/Button'
import Select from '../components/common/Select'
import Spinner from '../components/feedback/Spinner'
import ErrorState from '../components/feedback/ErrorState'
import EmptyState from '../components/feedback/EmptyState'
import Modal from '../components/common/Modal'


const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'
).replace(/\/$/, '')


function extractItems(response) {
  const value =
    response?.data?.items ??
    response?.data ??
    response?.items ??
    response ??
    []

  return Array.isArray(value) ? value : []
}


function extractAllocations(response) {
  return Array.isArray(response?.allocations)
    ? response.allocations
    : []
}


function normalizeSearchValue(value) {
  return String(value || '').trim().toLowerCase()
}


function getReadableErrorMessage(value) {
  if (!value) {
    return 'Something went wrong'
  }

  if (typeof value === 'string') {
    return value
  }

  if (Array.isArray(value)) {
    const messages = value
      .map((item) => getReadableErrorMessage(item))
      .filter(Boolean)

    return messages.length > 0
      ? messages.join(', ')
      : 'Something went wrong'
  }

  if (typeof value === 'object') {
    if (value.detail !== undefined) {
      return getReadableErrorMessage(value.detail)
    }

    if (value.message !== undefined) {
      return getReadableErrorMessage(value.message)
    }

    if (value.msg !== undefined) {
      return getReadableErrorMessage(value.msg)
    }

    if (value.error !== undefined) {
      return getReadableErrorMessage(value.error)
    }

    try {
      const serialized = JSON.stringify(value)

      return serialized || 'Something went wrong'
    } catch {
      return 'Something went wrong'
    }
  }

  return String(value)
}


function getMatchPriority(employee, normalizedSearch) {
  const employeeCode = normalizeSearchValue(employee.employee_code)
  const employeeName = normalizeSearchValue(employee.name)

  if (employeeCode === normalizedSearch) {
    return 0
  }

  if (employeeName === normalizedSearch) {
    return 1
  }

  if (employeeCode.startsWith(normalizedSearch)) {
    return 2
  }

  if (employeeName.startsWith(normalizedSearch)) {
    return 3
  }

  if (
    employeeCode.includes(normalizedSearch) ||
    employeeName.includes(normalizedSearch)
  ) {
    return 4
  }

  return 5
}


function sortReleaseEmployees(employees, searchText) {
  const normalizedSearch = normalizeSearchValue(searchText)

  return [...employees].sort((left, right) => {
    const leftPriority = getMatchPriority(left, normalizedSearch)
    const rightPriority = getMatchPriority(right, normalizedSearch)

    if (leftPriority !== rightPriority) {
      return leftPriority - rightPriority
    }

    const nameComparison = left.name.localeCompare(right.name)

    if (nameComparison !== 0) {
      return nameComparison
    }

    return left.employee_code.localeCompare(right.employee_code)
  })
}


async function requestJson(path, options = {}) {
  const response = await fetch(
    `${API_BASE_URL}${path}`,
    {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    }
  )

  const contentType = response.headers.get('content-type') || ''
  const body = contentType.includes('application/json')
    ? await response.json().catch(() => null)
    : await response.text().catch(() => null)

  if (!response.ok) {
    const detail =
      body && typeof body === 'object' && 'detail' in body
        ? body.detail
        : body

    throw new Error(getReadableErrorMessage(detail))
  }

  return body
}


function getErrorMessage(error) {
  const detail =
    error?.response?.data?.detail ??
    error?.detail

  if (typeof detail === 'string') {
    return detail
  }

  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === 'string') {
          return item
        }

        return item?.msg || JSON.stringify(item)
      })
      .join(', ')
  }

  if (detail && typeof detail === 'object') {
    return (
      detail.message ||
      detail.msg ||
      JSON.stringify(detail)
    )
  }

  if (typeof error?.message === 'string') {
    return error.message
  }

  return 'Something went wrong'
}


export default function AllocationPage() {
  const [employees, setEmployees] = useState([])
  const [releaseEmployees, setReleaseEmployees] = useState([])
  const [seats, setSeats] = useState([])
  const [projects, setProjects] = useState([])

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [releaseSearching, setReleaseSearching] = useState(false)

  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [confirmation, setConfirmation] = useState('')

  const [employeeId, setEmployeeId] = useState('')
  const [seatId, setSeatId] = useState('')
  const [projectId, setProjectId] = useState('')

  const [releaseModalOpen, setReleaseModalOpen] = useState(false)
  const [releaseEmployeeId, setReleaseEmployeeId] = useState('')
  const [releaseSearch, setReleaseSearch] = useState('')
  const [releaseError, setReleaseError] = useState('')


  async function loadData() {
    try {
      setLoading(true)
      setError('')

      const [
        employeeResponse,
        seatResponse,
        projectResponse,
      ] = await Promise.all([
        fetchEmployees({
          status: 'active',
          has_active_seat: false,
          page: 1,
          page_size: 100,
        }),

        fetchAvailableSeats(),

        fetchProjects(),
      ])

      setEmployees(extractItems(employeeResponse))
      setSeats(extractItems(seatResponse))
      setProjects(extractItems(projectResponse))

    } catch (err) {
      setError(getErrorMessage(err))

    } finally {
      setLoading(false)
    }
  }


  useEffect(() => {
    void (async () => {
      await loadData()
    })()
  }, [])


  async function searchReleaseEmployees(searchText) {
    const value = searchText.trim()

    setReleaseError('')
    setReleaseEmployeeId('')

    if (!value) {
      setReleaseEmployees([])
      return
    }

    try {
      setReleaseSearching(true)

      const response = await requestJson(
        `/search?q=${encodeURIComponent(value)}`
      )

      const activeEmployees = []
      const seenEmployeeIds = new Set()
      const normalizedSearch = normalizeSearchValue(value)

      for (const allocation of extractAllocations(response)) {
        if (
          String(
            allocation?.status ?? allocation?.allocation_status ?? ''
          ).toLowerCase() !== 'active'
        ) {
          continue
        }

        const employeeId = allocation?.employee_id ?? allocation?.employee?.id
        const employeeName = allocation?.employee_name ?? allocation?.employee?.name ?? ''
        const employeeCode = allocation?.employee_code ?? allocation?.employee?.employee_code ?? ''
        const seatId = allocation?.seat_id ?? allocation?.seat?.id

        if (!employeeId || !seatId) {
          continue
        }

        if (
          !normalizeSearchValue(employeeName).includes(normalizedSearch) &&
          !normalizeSearchValue(employeeCode).includes(normalizedSearch)
        ) {
          continue
        }

        if (seenEmployeeIds.has(employeeId)) {
          continue
        }

        seenEmployeeIds.add(employeeId)
        activeEmployees.push({
          id: employeeId,
          name: employeeName,
          employee_code: employeeCode,
          seat_id: seatId,
        })
      }

      const sortedEmployees = sortReleaseEmployees(activeEmployees, value).slice(0, 5)

      setReleaseEmployees(sortedEmployees)

      if (sortedEmployees.length === 1) {
        setReleaseEmployeeId(String(sortedEmployees[0].id))
      }

      if (sortedEmployees.length === 0) {
        setReleaseError('No employee with an active seat found.')
      }

    } catch (err) {
      setReleaseEmployees([])
      setReleaseError(getReadableErrorMessage(err))

    } finally {
      setReleaseSearching(false)
    }
  }


  function handleReleaseSearchChange(event) {
    const value = event.target.value

    setReleaseSearch(value)
    setReleaseEmployeeId('')
    setReleaseError('')
  }


  async function handleReleaseSearch(event) {
    event.preventDefault()

    if (!releaseSearch.trim()) {
      setReleaseError(
        'Enter an employee name, email, or employee code'
      )
      return
    }

    await searchReleaseEmployees(releaseSearch)
  }


  function handleEmployeeChange(event) {
    const value = event.target.value

    setEmployeeId(value)
    setActionError('')
    setConfirmation('')

    if (!value) {
      setProjectId('')
      return
    }

    const selectedEmployee = employees.find(
      (employee) =>
        String(employee.id) === String(value)
    )

    if (selectedEmployee?.project_id) {
      setProjectId(
        String(selectedEmployee.project_id)
      )
    } else {
      setProjectId('')
    }
  }


  async function handleAllocate(event) {
    event.preventDefault()

    setActionError('')
    setConfirmation('')

    if (!employeeId) {
      setActionError('Please select an employee')
      return
    }

    if (!seatId) {
      setActionError('Please select a seat')
      return
    }

    const selectedEmployee = employees.find(
      (employee) =>
        String(employee.id) === String(employeeId)
    )

    const employeeProjectId =
      selectedEmployee?.project_id

    if (!employeeProjectId) {
      setActionError(
        'Selected employee does not have an assigned project'
      )
      return
    }

    try {
      setSubmitting(true)

      const response = await allocateSeat({
        employee_id: Number(employeeId),
        seat_id: Number(seatId),
        project_id: Number(employeeProjectId),
      })

      setConfirmation(
        response?.message ||
        'Seat allocated successfully'
      )

      setEmployeeId('')
      setSeatId('')
      setProjectId('')

      await loadData()

    } catch (err) {
      setActionError(getErrorMessage(err))

    } finally {
      setSubmitting(false)
    }
  }


  async function handleRelease(event) {
    event?.preventDefault()

    setReleaseError('')
    setConfirmation('')

    if (!releaseEmployeeId) {
      setReleaseError(
        'Please select an employee'
      )
      return
    }

    const selectedEmployee = releaseEmployees.find(
      (employee) => String(employee.id) === String(releaseEmployeeId)
    )

    if (!selectedEmployee?.seat_id) {
      setReleaseError('No employee with an active seat found.')
      return
    }

    try {
      setSubmitting(true)

      const response = await requestJson('/seats/release', {
        method: 'POST',
        body: JSON.stringify({
          seat_id: Number(selectedEmployee.seat_id),
        }),
      })

      setConfirmation(
        response?.message || 'Seat released'
      )

      setReleaseModalOpen(false)
      setReleaseEmployeeId('')
      setReleaseSearch('')
      setReleaseEmployees([])
      setReleaseError('')

      await loadData()

    } catch (err) {
      setReleaseError(getReadableErrorMessage(err))

    } finally {
      setSubmitting(false)
    }
  }


  function openReleaseModal() {
    setReleaseError('')
    setReleaseEmployeeId('')
    setReleaseSearch('')
    setReleaseEmployees([])
    setReleaseModalOpen(true)
  }


  function closeReleaseModal() {
    if (submitting) {
      return
    }

    setReleaseModalOpen(false)
    setReleaseEmployeeId('')
    setReleaseSearch('')
    setReleaseEmployees([])
    setReleaseError('')
  }


  if (loading) {
    return (
      <Spinner label="Loading allocation workspace" />
    )
  }


  if (error) {
    return (
      <ErrorState
        title="Unable to load allocation workspace"
        description={error}
      />
    )
  }


  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-semibold text-white">
            Seat Allocation
          </h3>

          <p className="mt-1 text-sm text-slate-400">
            Assign an employee to an available seat and connect the employee&apos;s assigned project.
          </p>
        </div>

        <Button
          variant="secondary"
          onClick={loadData}
          disabled={submitting}
        >
          <RefreshCcw className="h-4 w-4" />
          Refresh
        </Button>
      </div>


      {confirmation ? (
        <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {confirmation}
        </div>
      ) : null}


      {actionError ? (
        <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {actionError}
        </div>
      ) : null}


      <div className="grid gap-6 xl:grid-cols-2">
        <form
          className="space-y-4 rounded-4xl border border-slate-800 bg-slate-900/70 p-6"
          onSubmit={handleAllocate}
        >
          <h4 className="text-lg font-semibold text-white">
            Allocate Seat
          </h4>


          <Select
            label="Employee"
            value={employeeId}
            onChange={handleEmployeeChange}
            required
          >
            <option value="">
              Select employee
            </option>

            {employees.map((employee) => (
              <option
                key={employee.id}
                value={employee.id}
              >
                {employee.name} ({employee.employee_code})
              </option>
            ))}
          </Select>


          <Select
            label="Seat"
            value={seatId}
            onChange={(event) => {
              setSeatId(event.target.value)
              setActionError('')
            }}
            required
          >
            <option value="">
              Select seat
            </option>

            {seats.map((seat) => (
              <option
                key={seat.id}
                value={seat.id}
              >
                {seat.floor} - {seat.zone} - {seat.seat_number}
              </option>
            ))}
          </Select>


          <Select
            label="Project"
            value={projectId}
            disabled
          >
            <option value="">
              Use employee&apos;s project
            </option>

            {projects.map((project) => (
              <option
                key={project.id}
                value={project.id}
              >
                {project.name}
              </option>
            ))}
          </Select>


          <Button
            type="submit"
            disabled={submitting}
          >
            <ArrowRightLeft className="h-4 w-4" />

            {submitting
              ? 'Allocating...'
              : 'Allocate now'}
          </Button>
        </form>


        <div className="rounded-4xl border border-slate-800 bg-slate-900/70 p-6">
          <div className="flex items-center justify-between gap-4">
            <h4 className="text-lg font-semibold text-white">
              Release Seat
            </h4>

            <Button
              variant="secondary"
              onClick={openReleaseModal}
            >
              Open release form
            </Button>
          </div>


          <div className="mt-4 space-y-3 text-sm text-slate-400">
            <p>
              Release an employee&apos;s current seat to return it to the available pool.
            </p>

            <p>
              Use this when a person moves teams, floors, or leaves the workspace.
            </p>
          </div>


          <div className="mt-6 rounded-3xl border border-dashed border-slate-700 bg-slate-950/60 p-6">
            <EmptyState
              title="No active release session"
              description="Open the release form to search for the employee being removed from a seat."
            />
          </div>
        </div>
      </div>


      <Modal
        open={releaseModalOpen}
        title="Release Seat"
        onClose={closeReleaseModal}
        actions={
          <>
            <Button
              variant="ghost"
              onClick={closeReleaseModal}
              disabled={submitting}
            >
              Cancel
            </Button>

            <Button
              onClick={handleRelease}
              disabled={
                submitting ||
                !releaseEmployeeId
              }
            >
              {submitting
                ? 'Releasing...'
                : 'Release'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <form
            onSubmit={handleReleaseSearch}
            className="space-y-3"
          >
            <label className="block text-sm text-slate-300">
              Search employee
            </label>

            <div className="flex gap-3">
              <input
                type="text"
                value={releaseSearch}
                onChange={handleReleaseSearchChange}
                placeholder="Employee 4901 or EMP-04901"
                className="min-w-0 flex-1 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
              />

              <Button
                type="submit"
                variant="secondary"
                disabled={releaseSearching}
              >
                <Search className="h-4 w-4" />

                {releaseSearching
                  ? 'Searching...'
                  : 'Search'}
              </Button>
            </div>
          </form>


          {releaseEmployees.length > 0 ? (
            <Select
              label="Employee"
              value={releaseEmployeeId}
              onChange={(event) => {
                setReleaseEmployeeId(
                  event.target.value
                )

                setReleaseError('')
              }}
              required
            >
              <option value="">
                Select employee
              </option>

              {releaseEmployees.map((employee) => (
                <option
                  key={employee.id}
                  value={employee.id}
                >
                  {employee.name} ({employee.employee_code})
                </option>
              ))}
            </Select>
          ) : releaseSearch && !releaseSearching ? (
            <p className="text-sm text-slate-400">
              Search for an employee with an active seat.
            </p>
          ) : null}


          {releaseError ? (
            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {releaseError}
            </div>
          ) : null}
        </div>
      </Modal>
    </div>
  )
}