import { useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { ChevronRight, LayoutDashboard, Search, Users, BriefcaseBusiness, MapPinned, Workflow, BarChart3, Menu, X } from 'lucide-react'

const navigation = [
  { label: 'Dashboard', to: '/', icon: LayoutDashboard },
  { label: 'Employees', to: '/employees', icon: Users },
  { label: 'Projects', to: '/projects', icon: BriefcaseBusiness },
  { label: 'Seats', to: '/seats', icon: MapPinned },
  { label: 'Seat Allocation', to: '/allocation', icon: Workflow },
  { label: 'Search', to: '/search', icon: Search },
  { label: '404', to: '/missing', icon: BarChart3 },
]

function buildBreadcrumbs(pathname) {
  const segments = pathname.split('/').filter(Boolean)
  if (!segments.length) return [{ label: 'Dashboard', href: '/' }]
  const crumbs = [{ label: 'Dashboard', href: '/' }]
  let accumulated = ''
  segments.forEach((segment) => {
    accumulated += `/${segment}`
    crumbs.push({ label: segment.replace(/-/g, ' '), href: accumulated })
  })
  return crumbs
}

export default function AppShell() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const location = useLocation()
  const breadcrumbs = useMemo(() => buildBreadcrumbs(location.pathname), [location.pathname])

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.18),_transparent_26%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.15),_transparent_22%),linear-gradient(180deg,_#020617_0%,_#0f172a_100%)]" />
      <div className="mx-auto flex min-h-screen max-w-[1800px] flex-col lg:flex-row">
        <aside className={`fixed inset-y-0 left-0 z-40 w-80 border-r border-slate-800 bg-slate-950/95 p-5 backdrop-blur transition-transform lg:static lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
          <div className="flex items-center justify-between lg:justify-start gap-3 rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-4">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-cyan-200/70">Ethara</p>
              <h1 className="text-xl font-semibold text-white">Seat Allocation</h1>
            </div>
            <button className="lg:hidden" onClick={() => setIsSidebarOpen(false)} aria-label="Close sidebar">
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="mt-8 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${isActive ? 'bg-cyan-400 text-slate-950' : 'text-slate-300 hover:bg-slate-900 hover:text-white'}`
                  }
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </NavLink>
              )
            })}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3">
                <button
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 p-3 text-slate-200 lg:hidden"
                  onClick={() => setIsSidebarOpen(true)}
                  aria-label="Open sidebar"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div>
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    {breadcrumbs.map((crumb, index) => (
                      <span key={crumb.href} className="flex items-center gap-2">
                        {index > 0 ? <ChevronRight className="h-3 w-3" /> : null}
                        <NavLink to={crumb.href} className="hover:text-cyan-300">
                          {crumb.label}
                        </NavLink>
                      </span>
                    ))}
                  </div>
                  <h2 className="mt-1 text-xl font-semibold text-white">Ethara Seat Allocation & Project Mapping</h2>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-400">
                <Search className="h-4 w-4 text-cyan-300" />
                Global search, filters, and actions
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
