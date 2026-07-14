import { useEffect, useState } from 'react'
import { Plus, PencilLine, Trash2, RefreshCcw } from 'lucide-react'
import { createProject, deleteProject, fetchProjects, updateProject } from '../api/projectApi'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import Select from '../components/common/Select'
import Textarea from '../components/common/Textarea'
import Modal from '../components/common/Modal'
import Spinner from '../components/feedback/Spinner'
import ErrorState from '../components/feedback/ErrorState'
import EmptyState from '../components/feedback/EmptyState'
import DataTable from '../components/tables/DataTable'
import { formatDate } from '../utils/formatters'

const emptyForm = { name: '', code: '', status: 'active', description: '' }

export default function ProjectsPage() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProject, setEditingProject] = useState(null)
  const [form, setForm] = useState(emptyForm)

  async function loadProjects() {
    try {
      setLoading(true)
      setError('')
      const response = await fetchProjects()
      const payload = response?.data || response
      setProjects(payload.items || payload.results || payload || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProjects()
  }, [])

  function openCreate() {
    setEditingProject(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  function openEdit(project) {
    setEditingProject(project)
    setForm({
      name: project.name || '',
      code: project.code || '',
      status: project.status || 'active',
      description: project.description || '',
    })
    setModalOpen(true)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const payload = { ...form }
    if (editingProject) {
      await updateProject(editingProject.id, payload)
    } else {
      await createProject(payload)
    }
    setModalOpen(false)
    await loadProjects()
  }

  async function handleDelete(projectId) {
    if (!window.confirm('Delete this project?')) return
    await deleteProject(projectId)
    await loadProjects()
  }

  if (loading) return <Spinner label="Loading projects" />
  if (error) return <ErrorState title="Unable to load projects" description={error} />

  const rows = projects.map((project) => (
    <tr key={project.id}>
      <td className="px-4 py-3 font-medium text-white">{project.name}</td>
      <td className="px-4 py-3 text-slate-300">{project.code}</td>
      <td className="px-4 py-3 text-slate-300">{project.status}</td>
      <td className="px-4 py-3 text-slate-300">{project.employee_count ?? project.employees_count ?? 0}</td>
      <td className="px-4 py-3 text-slate-300">{formatDate(project.created_at)}</td>
      <td className="px-4 py-3">
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => openEdit(project)}><PencilLine className="h-4 w-4" />Edit</Button>
          <Button variant="danger" onClick={() => handleDelete(project.id)}><Trash2 className="h-4 w-4" />Delete</Button>
        </div>
      </td>
    </tr>
  ))

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-semibold text-white">Projects</h3>
          <p className="mt-1 text-sm text-slate-400">Track initiatives and map employees onto delivery teams.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={loadProjects}><RefreshCcw className="h-4 w-4" />Refresh</Button>
          <Button onClick={openCreate}><Plus className="h-4 w-4" />Add Project</Button>
        </div>
      </div>
      <DataTable columns={[{ key: 'name', label: 'Project' }, { key: 'code', label: 'Code' }, { key: 'status', label: 'Status' }, { key: 'employees', label: 'Employees' }, { key: 'created', label: 'Created' }, { key: 'actions', label: 'Actions' }]} rows={rows} emptyState={<EmptyState title="No projects yet" description="Create a project to start grouping employees and seats." />} />

      <Modal open={modalOpen} title={editingProject ? 'Edit Project' : 'Add Project'} onClose={() => setModalOpen(false)} actions={<>
        <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
        <Button onClick={handleSubmit}>Save</Button>
      </>}>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <Input label="Name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
          <Input label="Code" value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} required />
          <Select label="Status" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
          <Textarea label="Description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
        </form>
      </Modal>
    </div>
  )
}
