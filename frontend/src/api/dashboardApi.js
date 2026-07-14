import http from './http'

export async function fetchDashboardSummary() {
  const response = await http.get('/dashboard/summary')
  return response.data
}

export async function fetchProjectUtilization() {
  const response = await http.get('/dashboard/project-utilization')
  return response.data
}

export async function fetchFloorUtilization() {
  const response = await http.get('/dashboard/floor-utilization')
  return response.data
}

export async function fetchZoneUtilization() {
  const response = await http.get('/dashboard/zone-utilization')
  return response.data
}
