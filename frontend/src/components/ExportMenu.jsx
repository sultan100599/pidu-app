import { useEffect, useRef, useState } from 'react'
import { toast } from 'react-toastify'
import * as exportApi from '../api/export'
import { getErrorMessage } from '../utils/errors'

const FORMATS = [
  { key: 'excel', label: 'Excel (.xlsx)', icon: 'bi-file-earmark-spreadsheet', run: exportApi.transactionsExcel },
  { key: 'pdf', label: 'PDF', icon: 'bi-file-earmark-pdf', run: exportApi.transactionsPdf },
]

// Tombol dropdown "Export" (Excel / PDF) untuk transaksi dengan filter `params`.
export default function ExportMenu({ params, disabled = false }) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(null)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const onPointer = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  async function run(format) {
    setOpen(false)
    setBusy(format.key)
    try {
      const filename = await format.run(params)
      toast.success(`${filename} diunduh.`)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="dropdown" ref={ref}>
      <button
        type="button"
        className="btn btn-outline-primary dropdown-toggle"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        disabled={disabled || busy != null}
      >
        {busy ? (
          <span className="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
        ) : (
          <i className="bi bi-download me-1" aria-hidden="true"></i>
        )}
        Export
      </button>
      {open && (
        <ul className="dropdown-menu dropdown-menu-end show position-absolute">
          {FORMATS.map((f) => (
            <li key={f.key}>
              <button type="button" className="dropdown-item" onClick={() => run(f)}>
                <i className={`bi ${f.icon} me-2`} aria-hidden="true"></i>
                {f.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
