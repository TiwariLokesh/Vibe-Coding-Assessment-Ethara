import { useEffect, useState } from 'react'
import { Plus, PencilLine, Trash2, RefreshCcw } from 'lucide-react'
import { createSeat, deleteSeat, fetchSeats, updateSeat } from '../api/seatApi'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import Select from '../components/common/Select'
import Modal from '../components/common/Modal'
import Spinner from '../components/feedback/Spinner'
import ErrorState from '../components/feedback/ErrorState'
import EmptyState from '../components/feedback/EmptyState'
import DataTable from '../components/tables/DataTable'
import { formatDate } from '../utils/formatters'

const emptyForm = { floor: '', zone: '', seat_number: '', status: 'available', notes: '' }

export default function SeatsPage() {
  const [seats, setSeats] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingSeat, setEditingSeat] = useState(null)
  const [form, setForm] = useState(emptyForm)

  async function loadSeats() {
    try {
      setLoading(true)
      setError('')
      const response = await fetchSeats()
      const payload = response?.data || response
      setSeats(payload.items || payload.results || payload || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSeats()
  }, [])

  function openCreate() {
    setEditingSeat(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  function openEdit(seat) {
    setEditingSeat(seat)
    setForm({
      floor: seat.floor || '',
      zone: seat.zone || '',
      seat_number: seat.seat_number || '',
      status: seat.status || 'available',
      notes: seat.notes || '',
    })
    setModalOpen(true)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (editingSeat) {
      await updateSeat(editingSeat.id, form)
    } else {
      await createSeat(form)
    }
    setModalOpen(false)
    await loadSeats()
  }

  async function handleDelete(seatId) {
    if (!window.confirm('Delete this seat?')) return
    await deleteSeat(seatId)
    await loadSeats()
  }

  if (loading) return <Spinner label="Loading seats" />
  if (error) return <ErrorState title="Unable to load seats" description={error} />

  const rows = seats.map((seat) => (
    <tr key={seat.id}>
      <td className="px-4 py-3 font-medium text-white">{seat.floor}</td>
      <td className="px-4 py-3 text-slate-300">{seat.zone}</td>
      <td className="px-4 py-3 text-slate-300">{seat.seat_number}</td>
      <td className="px-4 py-3 text-slate-300">{seat.status}</td>
      <td className="px-4 py-3 text-slate-300">{seat.assigned_employee || seat.employee_name || '-'}</td>
      <td className="px-4 py-3 text-slate-300">{formatDate(seat.created_at)}</td>
      <td className="px-4 py-3">
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => openEdit(seat)}><PencilLine className="h-4 w-4" />Edit</Button>
          <Button variant="danger" onClick={() => handleDelete(seat.id)}><Trash2 className="h-4 w-4" />Delete</Button>
        </div>
      </td>
    </tr>
  ))

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-semibold text-white">Seats</h3>
          <p className="mt-1 text-sm text-slate-400">Manage available seats across floors and zones.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={loadSeats}><RefreshCcw className="h-4 w-4" />Refresh</Button>
          <Button onClick={openCreate}><Plus className="h-4 w-4" />Add Seat</Button>
        </div>
      </div>
      <DataTable columns={[{ key: 'floor', label: 'Floor' }, { key: 'zone', label: 'Zone' }, { key: 'seat', label: 'Seat' }, { key: 'status', label: 'Status' }, { key: 'employee', label: 'Employee' }, { key: 'created', label: 'Created' }, { key: 'actions', label: 'Actions' }]} rows={rows} emptyState={<EmptyState title="No seats yet" description="Create the first seat to start making allocations." />} />

      <Modal open={modalOpen} title={editingSeat ? 'Edit Seat' : 'Add Seat'} onClose={() => setModalOpen(false)} actions={<>
        <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
        <Button onClick={handleSubmit}>Save</Button>
      </>}>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <Input label="Floor" value={form.floor} onChange={(event) => setForm({ ...form, floor: event.target.value })} required />
          <Input label="Zone" value={form.zone} onChange={(event) => setForm({ ...form, zone: event.target.value })} required />
          <Input label="Seat number" value={form.seat_number} onChange={(event) => setForm({ ...form, seat_number: event.target.value })} required />
          <Select label="Status" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
            <option value="available">Available</option>
            <option value="occupied">Occupied</option>
            <option value="maintenance">Maintenance</option>
          </Select>
          <Input className="md:col-span-2" label="Notes" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
        </form>
      </Modal>
    </div>
  )
}
