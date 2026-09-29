import { client } from './client'

// Unduh file dari API (tetap memakai Bearer token lewat axios), lalu simpan lewat <a download>.
// Nama file diambil dari Content-Disposition. Mengembalikan nama file.
export async function download(path, params) {
  let response
  try {
    response = await client.get(path, { params, responseType: 'blob' })
  } catch (err) {
    throw await normalizeBlobError(err)
  }

  const disposition = response.headers['content-disposition'] ?? ''
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition)
  const filename = match ? decodeURIComponent(match[1]) : 'pidu-export'

  const url = URL.createObjectURL(response.data)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  // Beri waktu browser memulai unduhan sebelum URL dilepas.
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
  return filename
}

// Dengan responseType 'blob', body error (JSON) juga berupa Blob → ubah kembali ke objek
// supaya getErrorMessage/getFieldErrors tetap bekerja.
async function normalizeBlobError(err) {
  const data = err.response?.data
  if (data instanceof Blob && data.type.includes('json')) {
    try {
      err.response.data = JSON.parse(await data.text())
    } catch {
      // biarkan apa adanya
    }
  }
  return err
}
