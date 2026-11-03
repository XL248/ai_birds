const base = (import.meta.env.VITE_API_BASE || '').replace(/\/+$/, '')

export async function request(path, options = {}) {
  const headers = new Headers(options.headers || {})
  headers.set('Accept', 'application/json')
  if (options.body !== undefined) headers.set('Content-Type', 'application/json')

  let response
  try {
    response = await fetch(base + path, {
      ...options,
      headers,
      credentials: 'include',
      body: options.body === undefined ? undefined : JSON.stringify(options.body)
    })
  } catch (cause) {
    const error = new Error('无法连接后端，请确认后端已启动。')
    error.network = true
    error.cause = cause
    throw error
  }

  const contentType = response.headers.get('content-type') || ''
  const data = contentType.includes('application/json') ? await response.json() : await response.text()
  if (!response.ok) {
    const error = new Error(data?.message || `请求失败 (${response.status})`)
    error.status = response.status
    error.payload = data
    error.unauthorized = response.status === 401
    throw error
  }
  return data
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  delete: (path, body) => request(path, { method: 'DELETE', body })
}
