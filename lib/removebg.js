import axios from 'axios'
import FormData from 'form-data'
import fs from 'fs'


const KEY_FILE = './apikey_removebg.json'

export function getRemoveBgKey() {
  try {
    return JSON.parse(fs.readFileSync(KEY_FILE, 'utf-8')).key || null
  } catch {
    return null
  }
}

export function setRemoveBgKey(key) {
  fs.writeFileSync(KEY_FILE, JSON.stringify({ key }), 'utf-8')
}

function logErr(tag, e) {
  const status = e?.response?.status
  let body = e?.response?.data
  if (Buffer.isBuffer(body)) body = body.toString('utf-8')
  console.error(`[removebg:${tag}]`, e?.code || '', e?.message || e,
    status ? `| status=${status}` : '',
    body ? `| body=${String(typeof body === 'string' ? body : JSON.stringify(body)).slice(0, 300)}` : '')
}


export async function removeBgApi(buffer, key) {
  try {
    const form = new FormData()
    form.append('image_file', buffer, { filename: 'image.jpg', contentType: 'image/jpeg' })
    form.append('size', 'auto')
    
    const res = await axios.post('https://api.remove.bg/v1.0/removebg', form, {
      headers: { ...form.getHeaders(), 'X-Api-Key': key },
      responseType: 'arraybuffer',
      timeout: 60000,
      maxBodyLength: Infinity,
      maxContentLength: Infinity
    })
    return { buffer: Buffer.from(res.data), error: null }
  } catch (e) {
    logErr('api', e)
    const s = e?.response?.status
    let error = 'Gagal menghubungi API remove.bg.'
    if (s === 401 || s === 403) error = 'API key remove.bg tidak valid.'
    else if (s === 402) error = 'Kredit/kuota API remove.bg sudah habis.'
    else if (s === 429) error = 'Terlalu banyak request ke remove.bg, coba lagi sebentar.'
    else if (e?.code === 'ETIMEDOUT' || e?.code === 'ENOTFOUND' || e?.code === 'ECONNABORTED') error = 'Koneksi ke remove.bg gagal (jaringan/timeout).'
    return { buffer: null, error }
  }
}

export async function removeBgLocal(buffer) {
  try {
    const { removeBackground } = await import('@imgly/background-removal-node')
    const blob = await removeBackground(new Blob([buffer], { type: 'image/jpeg' }), {
      model: 'small',
      output: { format: 'image/png' }
    })
    return { buffer: Buffer.from(await blob.arrayBuffer()), error: null }
  } catch (e) {
    logErr('local', e)
    const notInstalled = e?.code === 'ERR_MODULE_NOT_FOUND'
    return { buffer: null, error: notInstalled ? 'Library lokal belum terpasang.' : 'Pemrosesan lokal gagal.' }
  }
}

export async function removeBg(buffer) {
  const key = getRemoveBgKey()
  const errors = []

  if (key) {
    const r = await removeBgApi(buffer, key)
    if (r.buffer) return { buffer: r.buffer, source: 'api', errors }
    errors.push(r.error)
  } else {
    errors.push('API key remove.bg belum diatur.')
  }

  const l = await removeBgLocal(buffer)
  if (l.buffer) return { buffer: l.buffer, source: 'local', errors }
  errors.push(l.error)

  return { buffer: null, source: null, errors }
}
