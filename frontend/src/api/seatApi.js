import http from './http'

export async function fetchSeats(params = {}) {
  const response = await http.get('/seats', { params })
  return response.data
}

export async function fetchAvailableSeats(params = {}) {
  const response = await http.get('/seats/available', { params })
  return response.data
}

export async function fetchSeat(seatId) {
  const response = await http.get(`/seats/${seatId}`)
  return response.data
}

export async function createSeat(payload) {
  const response = await http.post('/seats', payload)
  return response.data
}

export async function updateSeat(seatId, payload) {
  const response = await http.put(`/seats/${seatId}`, payload)
  return response.data
}

export async function deleteSeat(seatId) {
  const response = await http.delete(`/seats/${seatId}`)
  return response.data
}

export async function uploadSeatsCsv(file) {
  const formData = new FormData()
  formData.append('file', file)
  const response = await http.post('/seats/upload-csv', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data
}
