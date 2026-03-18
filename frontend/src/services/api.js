let csrfToken = null

async function request(url, options = {}) {
  const defaultOptions = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  }

  const response = await fetch(url, defaultOptions)

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }))
    throw new Error(errorData.error || `HTTP ${response.status}`)
  }

  return response.json()
}

export async function getCSRF() {
  const data = await request('/api/auth.php')
  csrfToken = data.csrf_token
  return data
}

export async function login(username, password) {
  if (!csrfToken) await getCSRF()
  const data = await request('/api/auth.php', {
    method: 'POST',
    body: JSON.stringify({ action: 'login', username, password, csrf_token: csrfToken }),
  })
  if (data.csrf_token) csrfToken = data.csrf_token
  return data
}

export async function logout() {
  const data = await request('/api/auth.php', {
    method: 'POST',
    body: JSON.stringify({ action: 'logout', csrf_token: csrfToken }),
  })
  csrfToken = null
  return data
}

export async function getClients() {
  return request('/api/clients.php?action=list')
}

export async function getClient(id) {
  return request(`/api/clients.php?action=detail&id=${id}`)
}

export async function getTemplates() {
  return request('/api/clients.php?action=templates')
}

export async function createClient(clientData) {
  if (!csrfToken) await getCSRF()
  return request('/api/clients.php', {
    method: 'POST',
    body: JSON.stringify({ action: 'create', ...clientData, csrf_token: csrfToken }),
  })
}

export async function updateStatus(id, status) {
  if (!csrfToken) await getCSRF()
  return request('/api/clients.php', {
    method: 'POST',
    body: JSON.stringify({ action: 'update_status', id, status, csrf_token: csrfToken }),
  })
}

export async function getFormSchema(token) {
  return request(`/api/form-schema.php?token=${token}`)
}

export async function submitForm(token, data) {
  return request('/api/submit.php', {
    method: 'POST',
    body: JSON.stringify({ token, data }),
  })
}

export async function uploadFile(token, fieldKey, file) {
  const formData = new FormData()
  formData.append('token', token)
  formData.append('field_key', fieldKey)
  formData.append('file', file)

  const response = await fetch('/api/upload.php', {
    method: 'POST',
    credentials: 'include',
    body: formData,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Erro no upload' }))
    throw new Error(errorData.error || `HTTP ${response.status}`)
  }

  return response.json()
}

export async function saveSiteData(id, siteData) {
  if (!csrfToken) await getCSRF()
  return request('/api/clients.php', {
    method: 'POST',
    body: JSON.stringify({ action: 'save_site_data', id, site_data: siteData, csrf_token: csrfToken }),
  })
}

export async function uploadSiteZip(id, file) {
  const formData = new FormData()
  formData.append('id', id)
  formData.append('site_zip', file)
  const response = await fetch('/api/upload-site.php', {
    method: 'POST',
    credentials: 'include',
    body: formData,
  })
  const text = await response.text()
  let data
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('Resposta inválida do servidor. O arquivo pode ser grande demais.')
  }
  if (!response.ok) {
    throw new Error(data.error || `HTTP ${response.status}`)
  }
  return data
}

export async function getTemplatesList() {
  return request('/api/templates')
}

export async function createTemplate({ name, niche, zipFile, thumbnail }) {
  const formData = new FormData()
  formData.append('name', name)
  formData.append('niche', niche || '')
  formData.append('zip_file', zipFile)
  if (thumbnail) formData.append('thumbnail', thumbnail)

  const response = await fetch('/api/templates', {
    method: 'POST',
    credentials: 'include',
    body: formData,
  })

  const data = await response.json().catch(() => { throw new Error('Resposta inválida do servidor') })
  if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`)
  return data
}

export async function updateTemplate(id, { name, niche, thumbnail }) {
  const formData = new FormData()
  formData.append('name', name)
  formData.append('niche', niche || '')
  if (thumbnail) formData.append('thumbnail', thumbnail)

  const response = await fetch(`/api/templates/${id}`, {
    method: 'PUT',
    credentials: 'include',
    body: formData,
  })

  const data = await response.json().catch(() => { throw new Error('Resposta inválida do servidor') })
  if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`)
  return data
}

export async function deleteTemplate(id) {
  return request(`/api/templates/${id}`, { method: 'DELETE' })
}

export async function deleteClient(id) {
  return request(`/api/clients.php/${id}`, { method: 'DELETE' })
}

export async function approveReview(token, action, message = '') {
  return request('/api/approve.php', {
    method: 'POST',
    body: JSON.stringify({ token, action, message }),
  })
}

export function getPreviewUrl(token) {
  return `/api/preview.php?token=${token}`
}

export function getFormUrl(token) {
  return `http://localhost:5173/preencher/${token}`
}

export function getReviewUrl(reviewToken) {
  return `http://localhost:5173/aprovar/${reviewToken}`
}
