import { useEffect, useState } from 'react'
import { Building2, CheckCircle2, ShieldCheck, Users, MapPinned, ChartSpline } from 'lucide-react'
import { fetchDashboardSummary, fetchFloorUtilization, fetchProjectUtilization, fetchZoneUtilization } from '../api/dashboardApi'
import Spinner from '../components/feedback/Spinner'
import ErrorState from '../components/feedback/ErrorState'
import EmptyState from '../components/feedback/EmptyState'

function StatCard({ label, value, hint, icon: Icon }) {
  return (
    <div className="rounded-4xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg shadow-slate-950/20">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <h3 className="mt-2 text-3xl font-semibold text-white">{value}</h3>
          <p className="mt-2 text-sm text-slate-500">{hint}</p>
        </div>
        <div className="rounded-2xl bg-cyan-400/10 p-3 text-cyan-300">
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  )
}

function MiniTable({ title, rows }) {
  return (
    <section className="rounded-4xl border border-slate-800 bg-slate-900/70 p-5">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <div className="mt-4 space-y-3">
        {rows?.length ? rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm">
            <span className="text-slate-300">{row.label}</span>
            <span className="font-semibold text-white">{row.value}</span>
          </div>
        )) : <EmptyState title="No data yet" description="Create projects, employees, and seats to see utilization here." />}
      </div>
    </section>
  )
}

export default function DashboardPage() {
  const [data, setData] = useState(null)
  const [projectUtilization, setProjectUtilization] = useState([])
  const [floorUtilization, setFloorUtilization] = useState([])
  const [zoneUtilization, setZoneUtilization] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    async function load() {
      try {
        setLoading(true)
        setError('')
        const [summary, projects, floors, zones] = await Promise.all([
          fetchDashboardSummary(),
          fetchProjectUtilization(),
          fetchFloorUtilization(),
          fetchZoneUtilization(),
        ])
        if (!active) return
        setData(summary?.data || summary)
        setProjectUtilization(projects?.data || projects || [])
        setFloorUtilization(floors?.data || floors || [])
        setZoneUtilization(zones?.data || zones || [])
      } catch (err) {
        if (active) setError(err.message)
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [])

  if (loading) return <Spinner label="Loading dashboard" />
  if (error) return <ErrorState title="Unable to load dashboard" description={error} />

  const summary = data || {}

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-6">
        <StatCard label="Total Employees" value={summary.totalEmployees ?? 0} hint="All active and inactive records" icon={Users} />
        <StatCard label="Allocated Employees" value={summary.allocatedEmployees ?? 0} hint="Mapped to a seat" icon={CheckCircle2} />
        <StatCard label="Available Seats" value={summary.availableSeats ?? 0} hint="Ready to assign" icon={MapPinned} />
        <StatCard label="Projects" value={summary.totalProjects ?? 0} hint="Tracked initiatives" icon={Building2} />
        <StatCard label="Utilization" value={`${summary.utilizationRate ?? 0}%`} hint="Overall occupancy" icon={ShieldCheck} />
        <StatCard label="Insights" value={summary.totalAllocations ?? 0} hint="Allocation history entries" icon={ChartSpline} />
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <MiniTable title="Project Utilization" rows={projectUtilization.map((item) => ({ label: item.name || item.projectName || 'Project', value: item.utilization ?? item.count ?? 0 }))} />
        <MiniTable title="Floor Utilization" rows={floorUtilization.map((item) => ({ label: item.floor || item.name || 'Floor', value: item.utilization ?? item.count ?? 0 }))} />
        <MiniTable title="Zone Utilization" rows={zoneUtilization.map((item) => ({ label: item.zone || item.name || 'Zone', value: item.utilization ?? item.count ?? 0 }))} />
      </section>
    </div>
  )
}
