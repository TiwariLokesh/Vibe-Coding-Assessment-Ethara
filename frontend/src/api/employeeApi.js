import http from './http'

export async function fetchEmployees(params = {}) {
  const response = await http.get('/employees', { params })
  return response.data
}

export async function fetchEmployee(employeeId) {
  const response = await http.get(`/employees/${employeeId}`)
  return response.data
}

export async function createEmployee(payload) {
  const response = await http.post('/employees', payload)
  return response.data
}

export async function updateEmployee(employeeId, payload) {
  const response = await http.put(`/employees/${employeeId}`, payload)
  return response.data
}

export async function deleteEmployee(employeeId) {
  const response = await http.delete(`/employees/${employeeId}`)
  return response.data
}

export async function uploadEmployeesCsv(file) {
  const formData = new FormData()
  formData.append('file', file)
  const response = await http.post('/employees/upload-csv', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data
}
