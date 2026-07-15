import { useEffect, useMemo, useState } from 'react'
import { Plus, RefreshCcw, Trash2, PencilLine, FileUp, Download, CheckCircle, AlertCircle, X } from 'lucide-react'
import { createEmployee, deleteEmployee, fetchEmployees, updateEmployee, uploadEmployeesCsv } from '../api/employeeApi'
import { fetchProjects } from '../api/projectApi'
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
  name: '',
  email: '',
  employee_code: '',
  department: 'Engineering',
  role: 'Engineer',
  joining_date: new Date().toISOString().split('T')[0],
  employment_status: 'active',
  project_id: '',
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [total, setTotal] = useState(0)
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false)
  
  // Form State
  const [editingEmployee, setEditingEmployee] = useState(null)
  const [form, setForm] = useState(emptyForm)
  
  // CSV Import State
  const [csvFile, setCsvFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [csvErrors, setCsvErrors] = useState([])
  const [csvSuccess, setCsvSuccess] = useState('')
  
  // Toast notifications State
  const [toast, setToast] = useState(null)

  const pageCount = useMemo(() => getPageCount(total, pageSize), [total, pageSize])

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  function showToast(message, type = 'success') {
    setToast({ message, type })
  }

  async function loadData() {
    try {
      setLoading(true)
      setError('')
      const [empResponse, projResponse] = await Promise.all([
        fetchEmployees({ search: query || undefined, status: statusFilter || undefined, page, page_size: pageSize }),
        fetchProjects()
      ])
      
      const empPayload = empResponse?.data || empResponse
      setEmployees(empPayload.items || empPayload.results || empPayload || [])
      setTotal(empPayload.total || empPayload.count || 0)
      
      const projPayload = projResponse?.data || projResponse
      setProjects(projPayload || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [page, statusFilter])

  async function handleSubmit(event) {
    event.preventDefault()
    try {
      const payload = {
        name: form.name,
        email: form.email,
        employee_code: form.employee_code,
        department: form.department,
        role: form.role,
        joining_date: form.joining_date,
        employment_status: form.employment_status,
        project_id: parseInt(form.project_id) || null,
      }
      
      if (!payload.project_id) {
        showToast('Please select a valid Project.', 'error')
        return
      }

      if (editingEmployee) {
        await updateEmployee(editingEmployee.id, payload)
        showToast('Employee updated successfully!')
      } else {
        await createEmployee(payload)
        showToast('Employee created successfully!')
      }
      setIsModalOpen(false)
      setEditingEmployee(null)
      setForm(emptyForm)
      await loadData()
    } catch (err) {
      showToast(err.response?.data?.detail || err.message, 'error')
    }
  }

  function openCreateModal() {
    setEditingEmployee(null)
    setForm(emptyForm)
    if (projects.length > 0) {
      setForm(prev => ({ ...prev, project_id: projects[0].id.toString() }))
    }
    setIsModalOpen(true)
  }

  function openEditModal(employee) {
    setEditingEmployee(employee)
    setForm({
      name: employee.name || '',
      email: employee.email || '',
      employee_code: employee.employee_code || '',
      department: employee.department || 'Engineering',
      role: employee.role || 'Engineer',
      joining_date: employee.joining_date || '',
      employment_status: employee.employment_status || 'active',
      project_id: employee.project_id?.toString() || '',
    })
    setIsModalOpen(true)
  }

  async function handleDelete(employeeId) {
    if (!window.confirm('Are you sure you want to delete this employee?')) return
    try {
      await deleteEmployee(employeeId)
      showToast('Employee deleted successfully.')
      await loadData()
    } catch (err) {
      showToast(err.response?.data?.detail || err.message, 'error')
    }
  }

  async function handleCsvUpload(event) {
    event.preventDefault()
    if (!csvFile) return
    setUploading(true)
    setCsvErrors([])
    setCsvSuccess('')
    try {
      const response = await uploadEmployeesCsv(csvFile)
      if (response.success) {
        setCsvSuccess(response.message || `Successfully imported ${response.data?.inserted} records.`)
        showToast('CSV imported successfully!')
        setCsvFile(null)
        // Refresh
        await loadData()
      } else {
        setCsvErrors(response.data?.errors || [response.message || 'Validation failed.'])
      }
    } catch (err) {
      setCsvErrors([err.response?.data?.detail || err.message])
    } finally {
      setUploading(false)
    }
  }

  if (loading && employees.length === 0) return <Spinner label="Loading employees" />
  if (error) return <ErrorState title="Unable to load employees" description={error} />

  const columns = [
    { key: 'name', label: 'Employee' },
    { key: 'email', label: 'Email' },
    { key: 'code', label: 'Code' },
    { key: 'dept', label: 'Department' },
    { key: 'role', label: 'Role' },
    { key: 'status', label: 'Status' },
    { key: 'project', label: 'Project' },
    { key: 'joined', label: 'Joining Date' },
    { key: 'actions', label: 'Actions' },
  ]

  const rows = employees.map((employee) => (
    <tr key={employee.id} className="border-b border-slate-800/50 hover:bg-slate-900/20 transition-all">
      <td className="px-4 py-3 font-semibold text-white">{employee.name}</td>
      <td className="px-4 py-3 text-slate-300">{employee.email}</td>
      <td className="px-4 py-3 text-slate-300 font-mono text-xs">{employee.employee_code}</td>
      <td className="px-4 py-3 text-slate-300">{employee.department}</td>
      <td className="px-4 py-3 text-slate-300">{employee.role}</td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold uppercase ${employee.employment_status === 'active' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-slate-800 text-slate-400'}`}>
          {employee.employment_status}
        </span>
      </td>
      <td className="px-4 py-3 text-slate-300">{employee.project_name || employee.project?.name || '-'}</td>
      <td className="px-4 py-3 text-slate-300">{formatDate(employee.joining_date)}</td>
      <td className="px-4 py-3">
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => openEditModal(employee)} className="p-2 min-h-0 flex items-center justify-center rounded-xl bg-slate-900 border-slate-800 hover:border-cyan-400/40 text-slate-200">
            <PencilLine className="h-4 w-4" />
          </Button>
          <Button variant="danger" onClick={() => handleDelete(employee.id)} className="p-2 min-h-0 flex items-center justify-center rounded-xl bg-slate-900 border-slate-800 hover:bg-red-500/10 hover:border-red-500/40 text-red-400">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </td>
    </tr>
  ))

  return (
    <div className="space-y-6">
      {/* Toast Alert Banner */}
      {toast && (
        <div className={`fixed right-6 top-24 z-50 flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-xl backdrop-blur-md transition-all duration-300 transform translate-y-0 ${toast.type === 'error' ? 'border-red-500/20 bg-red-950/80 text-red-300' : 'border-cyan-400/20 bg-slate-950/90 text-cyan-300'}`}>
          {toast.type === 'error' ? <AlertCircle className="h-5 w-5 text-red-400" /> : <CheckCircle className="h-5 w-5 text-cyan-400" />}
          <span className="text-sm font-medium">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 hover:text-white transition">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-semibold text-white">Employees</h3>
          <p className="mt-1 text-sm text-slate-400">Manage the employees being mapped to seats and projects.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => setIsCsvModalOpen(true)} className="flex items-center gap-2 border-slate-800 bg-slate-900/50 text-slate-200 hover:border-cyan-400/30">
            <FileUp className="h-4 w-4 text-cyan-400" />Import CSV
          </Button>
          <Button variant="secondary" onClick={loadData}><RefreshCcw className="h-4 w-4" />Refresh</Button>
          <Button onClick={openCreateModal} className="bg-cyan-400 text-slate-950 hover:bg-cyan-300"><Plus className="h-4 w-4" />Add Employee</Button>
        </div>
      </div>

      <div className="grid gap-3 rounded-3xl border border-slate-800 bg-slate-900/50 p-4 md:grid-cols-3 xl:grid-cols-4">
        <Input label="Search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, email, or code" />
        <Select label="Status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="notice">Notice</option>
          <option value="terminated">Terminated</option>
        </Select>
        <div className="flex items-end gap-3 md:col-span-1">
          <Button className="w-full bg-slate-800 border-slate-700 hover:bg-slate-700 text-white" onClick={() => { setPage(1); loadData() }}>Apply Filters</Button>
        </div>
      </div>

      <DataTable columns={columns} rows={rows} emptyState={<EmptyState title="No employees found" description="Try refining your filter or add a new employee." />} />
      <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />

      {/* Create/Edit Modal */}
      <Modal
        open={isModalOpen}
        title={editingEmployee ? 'Edit Employee' : 'Add Employee'}
        onClose={() => setIsModalOpen(false)}
        actions={<>
          <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} className="bg-cyan-400 text-slate-950 hover:bg-cyan-300">Save</Button>
        </>}
      >
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <Input label="Full Name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
          <Input label="Email Address" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
          <Input label="Employee Code" value={form.employee_code} onChange={(event) => setForm({ ...form, employee_code: event.target.value })} required placeholder="e.g. EMP-09923" />
          
          <Select label="Project Assignment" value={form.project_id} onChange={(event) => setForm({ ...form, project_id: event.target.value })} required>
            <option value="">Select a Project...</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </Select>

          <Input label="Department" value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })} required />
          <Input label="Role" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} required />
          <Input label="Joining Date" type="date" value={form.joining_date} onChange={(event) => setForm({ ...form, joining_date: event.target.value })} required />
          
          <Select label="Status" value={form.employment_status} onChange={(event) => setForm({ ...form, employment_status: event.target.value })}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="notice">Notice</option>
            <option value="terminated">Terminated</option>
          </Select>
        </form>
      </Modal>

      {/* CSV Import Modal */}
      <Modal
        open={isCsvModalOpen}
        title="Import Employees from CSV"
        onClose={() => { setIsCsvModalOpen(false); setCsvErrors([]); setCsvSuccess(''); }}
        actions={<>
          <Button variant="ghost" onClick={() => setIsCsvModalOpen(false)}>Cancel</Button>
          <Button onClick={handleCsvUpload} disabled={uploading || !csvFile} className="bg-cyan-400 text-slate-950 hover:bg-cyan-300 flex items-center gap-2">
            {uploading ? <Spinner className="h-4 w-4" /> : <FileUp className="h-4 w-4" />}
            Upload
          </Button>
        </>}
      >
        <div className="space-y-4">
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/40 p-5 text-center">
            <input
              type="file"
              accept=".csv"
              id="csv-file-input"
              className="hidden"
              onChange={(e) => setCsvFile(e.target.files[0])}
            />
            <label htmlFor="csv-file-input" className="cursor-pointer space-y-2 block">
              <FileUp className="h-10 w-10 text-cyan-400 mx-auto animate-pulse" />
              <p className="text-sm text-slate-200">
                {csvFile ? `Selected: ${csvFile.name}` : 'Click to browse files, or drag and drop here.'}
              </p>
              <p className="text-xs text-slate-500">Only standard CSV format files are supported.</p>
            </label>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <Download className="h-3.5 w-3.5 text-cyan-400" />
              Expected Columns Checklist:
            </h4>
            <code className="text-xs text-cyan-300/80 block select-all bg-slate-950 p-2 rounded-xl border border-slate-800 font-mono">
              employee_code, name, email, department, role, joining_date, employment_status, project_name
            </code>
            <p className="mt-2 text-xs text-slate-400">
              * Note: Dates should be in <code className="font-mono bg-slate-950 px-1 rounded text-cyan-400">YYYY-MM-DD</code> format. Project names must match existing project entries. Duplicate prevention is applied automatically.
            </p>
          </div>

          {csvSuccess && (
            <div className="rounded-2xl border border-green-500/20 bg-green-500/10 p-3 text-sm text-green-400">
              {csvSuccess}
            </div>
          )}

          {csvErrors.length > 0 && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400 max-h-40 overflow-y-auto space-y-1">
              <p className="font-semibold mb-1">Import failed with errors:</p>
              {csvErrors.map((err, i) => (
                <div key={i} className="text-xs font-mono">- {err}</div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}
