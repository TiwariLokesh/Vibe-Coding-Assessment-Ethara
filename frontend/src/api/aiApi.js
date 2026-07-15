import http from './http'

export async function queryAiAssistant(query) {
  const response = await http.post('/ai/query', { query })
  return response.data
}
