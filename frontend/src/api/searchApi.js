import http from './http'

export async function searchWorkspace(query) {
  const response = await http.get('/search', { params: { q: query } })
  return response.data
}
