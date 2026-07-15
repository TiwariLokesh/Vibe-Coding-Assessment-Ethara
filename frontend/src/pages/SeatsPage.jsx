import { useEffect, useState } from 'react'
import { Plus, PencilLine, Trash2, RefreshCcw, FileUp, Download, CheckCircle, AlertCircle, X } from 'lucide-react'
import { createSeat, deleteSeat, fetchSeats, updateSeat, uploadSeatsCsv } from '../api/seatApi'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import Select from '../components/common/Select'
import Modal from '../components/common/Modal'
import Spinner from '../components/feedback/Spinner'
import ErrorState from '../components/feedback/ErrorState'
import EmptyState from '../components/feedback/EmptyState'
import DataTable from '../components/tables/DataTable'
import { formatDate } from '../utils/formatters'

const emptyForm = { floor: '', zone: '', bay: '', seat_number: '', status: 'Available' }

export default function SeatsPage() {
  const [seats, setSeats] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Modals
  const [modalOpen, setModalOpen] = useState(false)
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false)
  
  // Form State
  const [editingSeat, setEditingSeat] = useState(null)
  const [form, setForm] = useState(emptyForm)
  
  // CSV Import State
  const [csvFile, setCsvFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [csvErrors, setCsvErrors] = useState([])
  const [csvSuccess, setCsvSuccess] = useState('')
  
  // Toast notifications State
  const [toast, setToast] = useState(null)

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
      bay: seat.bay || '',
      seat_number: seat.seat_number || '',
      status: seat.status || 'Available',
    })
    setModalOpen(true)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    try {
      const payload = {
        floor: form.floor,
        zone: form.zone,
        bay: form.bay,
        seat_number: form.seat_number,
        status: form.status,
      }
      
      if (editingSeat) {
        await updateSeat(editingSeat.id, payload)
        showToast('Seat updated successfully!')
      } else {
        await createSeat(payload)
        showToast('Seat created successfully!')
      }
      setModalOpen(false)
      await loadSeats()
    } catch (err) {
      showToast(err.response?.data?.detail || err.message, 'error')
    }
  }

  async function handleDelete(seatId) {
    if (!window.confirm('Are you sure you want to delete this seat?')) return
    try {
      await deleteSeat(seatId)
      showToast('Seat deleted successfully.')
      await loadSeats()
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
      const response = await uploadSeatsCsv(csvFile)
      if (response.success) {
        setCsvSuccess(response.message || `Successfully imported ${response.data?.inserted} seats.`)
        showToast('Seats CSV imported successfully!')
        setCsvFile(null)
        await loadSeats()
      } else {
        setCsvErrors(response.data?.errors || [response.message || 'Validation failed.'])
      }
    } catch (err) {
      setCsvErrors([err.response?.data?.detail || err.message])
    } finally {
      setUploading(false)
    }
  }

  if (loading && seats.length === 0) return <Spinner label="Loading seats" />
  if (error) return <ErrorState title="Unable to load seats" description={error} />

  const columns = [
    { key: 'floor', label: 'Floor' },
    { key: 'zone', label: 'Zone' },
    { key: 'bay', label: 'Bay' },
    { key: 'seat', label: 'Seat' },
    { key: 'status', label: 'Status' },
    { key: 'employee', label: 'Assigned Employee' },
    { key: 'created', label: 'Created At' },
    { key: 'actions', label: 'Actions' }
  ]

  const rows = seats.map((seat) => (
    <tr key={seat.id} className="border-b border-slate-800/50 hover:bg-slate-900/20 transition-all">
      <td className="px-4 py-3 font-semibold text-white">{seat.floor}</td>
      <td className="px-4 py-3 text-slate-300">{seat.zone}</td>
      <td className="px-4 py-3 text-slate-300">{seat.bay}</td>
      <td className="px-4 py-3 text-slate-300 font-mono text-xs">{seat.seat_number}</td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold uppercase ${
          seat.status === 'Available' ? 'bg-green-500/10 text-green-400' :
          seat.status === 'Occupied' ? 'bg-cyan-500/10 text-cyan-400' :
          seat.status === 'Reserved' ? 'bg-yellow-500/10 text-yellow-400' :
          'bg-slate-800 text-slate-400'
        }`}>
          {seat.status}
        </span>
      </td>
      <td className="px-4 py-3 text-slate-300">
        {seat.active_employee ? seat.active_employee.name : (seat.assigned_employee || seat.employee_name || '-')}
      </td>
      <td className="px-4 py-3 text-slate-300">{formatDate(seat.created_at)}</td>
      <td className="px-4 py-3">
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => openEdit(seat)} className="p-2 min-h-0 flex items-center justify-center rounded-xl bg-slate-900 border-slate-800 hover:border-cyan-400/40 text-slate-200">
            <PencilLine className="h-4 w-4" />
          </Button>
          <Button variant="danger" onClick={() => handleDelete(seat.id)} className="p-2 min-h-0 flex items-center justify-center rounded-xl bg-slate-900 border-slate-800 hover:bg-red-500/10 hover:border-red-500/40 text-red-400" disabled={seat.status === 'Occupied'}>
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
          <h3 className="text-2xl font-semibold text-white">Seats</h3>
          <p className="mt-1 text-sm text-slate-400">Manage available seats across floors and zones.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => setIsCsvModalOpen(true)} className="flex items-center gap-2 border-slate-800 bg-slate-900/50 text-slate-200 hover:border-cyan-400/30">
            <FileUp className="h-4 w-4 text-cyan-400" />Import CSV
          </Button>
          <Button variant="secondary" onClick={loadSeats}><RefreshCcw className="h-4 w-4" />Refresh</Button>
          <Button onClick={openCreate} className="bg-cyan-400 text-slate-950 hover:bg-cyan-300"><Plus className="h-4 w-4" />Add Seat</Button>
        </div>
      </div>

      <DataTable columns={columns} rows={rows} emptyState={<EmptyState title="No seats found" description="Create the first seat to start making allocations." />} />

      {/* Create/Edit Modal */}
      <Modal open={modalOpen} title={editingSeat ? 'Edit Seat' : 'Add Seat'} onClose={() => setModalOpen(false)} actions={<>
        <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
        <Button onClick={handleSubmit} className="bg-cyan-400 text-slate-950 hover:bg-cyan-300">Save</Button>
      </>}>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <Input label="Floor" value={form.floor} onChange={(event) => setForm({ ...form, floor: event.target.value })} required placeholder="e.g. F1" />
          <Input label="Zone" value={form.zone} onChange={(event) => setForm({ ...form, zone: event.target.value })} required placeholder="e.g. A" />
          <Input label="Bay" value={form.bay} onChange={(event) => setForm({ ...form, bay: event.target.value })} required placeholder="e.g. B1" />
          <Input label="Seat number" value={form.seat_number} onChange={(event) => setForm({ ...form, seat_number: event.target.value })} required placeholder="e.g. 11101" />
          
          <Select label="Status" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
            <option value="Available">Available</option>
            <option value="Reserved">Reserved</option>
            <option value="Maintenance">Maintenance</option>
          </Select>
        </form>
      </Modal>

      {/* CSV Import Modal */}
      <Modal
        open={isCsvModalOpen}
        title="Import Seats from CSV"
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
              id="csv-seat-file-input"
              className="hidden"
              onChange={(e) => setCsvFile(e.target.files[0])}
            />
            <label htmlFor="csv-seat-file-input" className="cursor-pointer space-y-2 block">
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
              floor, zone, bay, seat_number, status
            </code>
            <p className="mt-2 text-xs text-slate-400">
              * Note: Status values can be <code className="font-mono text-cyan-400 bg-slate-950 px-1 rounded">Available</code>, <code className="font-mono text-cyan-400 bg-slate-950 px-1 rounded">Reserved</code>, or <code className="font-mono text-cyan-400 bg-slate-950 px-1 rounded">Maintenance</code>. Duplicate seat identifiers will be rejected.
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
