import { useEffect, useMemo, useState } from 'react'
import { Plus, RefreshCcw, Trash2, PencilLine } from 'lucide-react'
import { createEmployee, deleteEmployee, fetchEmployees, updateEmployee } from '../api/employeeApi'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import Select from '../components/common/Select'
import Modal from '../components/common/Modal'
import Spinner from '../components/feedback/Spinner'
import ErrorState from '../components/feedback/ErrorState'
import EmptyState from '../components/feedback/EmptyState'
import DataTable from '../components/tables/DataTable'
import Pagination from '../components/tables/Pagination'
import { getPageCount } from '../utils/pagination'
import { formatDate } from '../utils/formatters'

const emptyForm = {
  first_name: '',
  last_name: '',
  email: '',
  employee_code: '',
  status: 'active',
  role: '',
  project_id: '',
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState(null)
  const [form, setForm] = useState(emptyForm)

  const pageCount = useMemo(() => getPageCount(total, pageSize), [total, pageSize])

  async function loadEmployees() {
    try {
      setLoading(true)
      setError('')
      const response = await fetchEmployees({ search: query || undefined, status: status || undefined, page, page_size: pageSize })
      const payload = response?.data || response
      setEmployees(payload.items || payload.results || payload || [])
      setTotal(payload.total || payload.count || 0)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEmployees()
  }, [page, status])

  async function handleSubmit(event) {
    event.preventDefault()
    try {
      const payload = {
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        employee_code: form.employee_code,
        status: form.status,
        role: form.role,
        project_id: form.project_id || null,
      }
      if (editingEmployee) {
        await updateEmployee(editingEmployee.id, payload)
      } else {
        await createEmployee(payload)
      }
      setIsModalOpen(false)
      setEditingEmployee(null)
      setForm(emptyForm)
      await loadEmployees()
    } catch (err) {
      setError(err.message)
    }
  }

  function openCreateModal() {
    setEditingEmployee(null)
    setForm(emptyForm)
    setIsModalOpen(true)
  }

  function openEditModal(employee) {
    setEditingEmployee(employee)
    setForm({
      first_name: employee.first_name || '',
      last_name: employee.last_name || '',
      email: employee.email || '',
      employee_code: employee.employee_code || '',
      status: employee.status || 'active',
      role: employee.role || '',
      project_id: employee.project_id || '',
    })
    setIsModalOpen(true)
  }

  async function handleDelete(employeeId) {
    if (!window.confirm('Delete this employee?')) return
    await deleteEmployee(employeeId)
    await loadEmployees()
  }

  if (loading) return <Spinner label="Loading employees" />
  if (error) return <ErrorState title="Unable to load employees" description={error} />

  const columns = [
    { key: 'name', label: 'Employee' },
    { key: 'email', label: 'Email' },
    { key: 'code', label: 'Code' },
    { key: 'status', label: 'Status' },
    { key: 'project', label: 'Project' },
    { key: 'joined', label: 'Created' },
    { key: 'actions', label: 'Actions' },
  ]

  const rows = employees.map((employee) => (
    <tr key={employee.id}>
      <td className="px-4 py-3 font-medium text-white">{employee.first_name} {employee.last_name}</td>
      <td className="px-4 py-3 text-slate-300">{employee.email}</td>
      <td className="px-4 py-3 text-slate-300">{employee.employee_code}</td>
      <td className="px-4 py-3 text-slate-300">{employee.status}</td>
      <td className="px-4 py-3 text-slate-300">{employee.project_name || employee.project?.name || '-'}</td>
      <td className="px-4 py-3 text-slate-300">{formatDate(employee.created_at)}</td>
      <td className="px-4 py-3">
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => openEditModal(employee)}><PencilLine className="h-4 w-4" />Edit</Button>
          <Button variant="danger" onClick={() => handleDelete(employee.id)}><Trash2 className="h-4 w-4" />Delete</Button>
        </div>
      </td>
    </tr>
  ))

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-semibold text-white">Employees</h3>
          <p className="mt-1 text-sm text-slate-400">Manage the people being mapped to seats and projects.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={loadEmployees}><RefreshCcw className="h-4 w-4" />Refresh</Button>
          <Button onClick={openCreateModal}><Plus className="h-4 w-4" />Add Employee</Button>
        </div>
      </div>

      <div className="grid gap-3 rounded-3xl border border-slate-800 bg-slate-900/70 p-4 md:grid-cols-2 xl:grid-cols-4">
        <Input label="Search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, email, or code" />
        <Select label="Status" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>
        <div className="flex items-end gap-3">
          <Button className="w-full" onClick={() => { setPage(1); loadEmployees() }}>Apply</Button>
        </div>
      </div>

      <DataTable columns={columns} rows={rows} emptyState={<EmptyState title="No employees yet" description="Create your first employee to start allocating seats." />} />
      <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />

      <Modal
        open={isModalOpen}
        title={editingEmployee ? 'Edit Employee' : 'Add Employee'}
        onClose={() => setIsModalOpen(false)}
        actions={<>
          <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit}>Save</Button>
        </>}
      >
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <Input label="First name" value={form.first_name} onChange={(event) => setForm({ ...form, first_name: event.target.value })} required />
          <Input label="Last name" value={form.last_name} onChange={(event) => setForm({ ...form, last_name: event.target.value })} required />
          <Input label="Email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
          <Input label="Employee code" value={form.employee_code} onChange={(event) => setForm({ ...form, employee_code: event.target.value })} required />
          <Select label="Status" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
          <Input label="Role" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} />
        </form>
      </Modal>
    </div>
  )
}
