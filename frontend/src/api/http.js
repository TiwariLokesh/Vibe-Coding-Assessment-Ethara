import axios from 'axios'

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
})

http.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error?.response?.data?.detail || error?.message || 'Request failed'
    return Promise.reject(new Error(message))
  },
)

export default http
