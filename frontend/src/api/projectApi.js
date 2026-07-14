import http from './http'

export async function fetchProjects() {
  const response = await http.get('/projects')
  return response.data
}

export async function fetchProject(projectId) {
  const response = await http.get(`/projects/${projectId}`)
  return response.data
}

export async function fetchProjectEmployees(projectId) {
  const response = await http.get(`/projects/${projectId}/employees`)
  return response.data
}

export async function createProject(payload) {
  const response = await http.post('/projects', payload)
  return response.data
}

export async function updateProject(projectId, payload) {
  const response = await http.put(`/projects/${projectId}`, payload)
  return response.data
}

export async function deleteProject(projectId) {
  const response = await http.delete(`/projects/${projectId}`)
  return response.data
}
