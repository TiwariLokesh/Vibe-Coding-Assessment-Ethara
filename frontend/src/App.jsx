import {Route, Routes } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import DashboardPage from './pages/DashboardPage'
import EmployeesPage from './pages/EmployeesPage'
import ProjectsPage from './pages/ProjectsPage'
import SeatsPage from './pages/SeatsPage'
import AllocationPage from './pages/AllocationPage'
import SearchPage from './pages/SearchPage'
import AiAssistantPage from './pages/AiAssistantPage'
import NotFoundPage from './pages/NotFoundPage'

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/employees" element={<EmployeesPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/seats" element={<SeatsPage />} />
        <Route path="/allocation" element={<AllocationPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/ai" element={<AiAssistantPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
