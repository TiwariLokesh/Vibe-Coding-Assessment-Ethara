import http from './http'

export async function allocateSeat(payload) {
  const response = await http.post('/seats/allocate', payload)
  return response.data
}

export async function releaseSeat(payload) {
  const response = await http.post('/seats/release', payload)
  return response.data
}
