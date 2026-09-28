import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'

// Modal controlled murni React (tanpa JS Bootstrap): portal ke body, backdrop,
// tutup via Esc / tombol × / klik backdrop, scroll body dikunci, fokus ke
// elemen pertama saat dibuka, fullscreen di bawah breakpoint sm.
export default function Modal({ show, onClose, title, children, footer, busy = false }) {
  const titleId = useId()
  const dialogRef = useRef(null)
  // onClose disimpan di ref supaya effect tidak jalan ulang tiap render
  // (parent sering mengirim fungsi inline) — kalau jalan ulang, fokus akan
  // melompat ke input pertama setiap kali user mengetik.
  const onCloseRef = useRef(onClose)
  const busyRef = useRef(busy)
  useEffect(() => {
    onCloseRef.current = onClose
    busyRef.current = busy
  })

  useEffect(() => {
    if (!show) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function handleKeyDown(event) {
      if (event.key === 'Escape' && !busyRef.current) onCloseRef.current()
    }
    document.addEventListener('keydown', handleKeyDown)

    // Fokus ke field pertama di body dialog; kalau tidak ada, ke tombol pertama.
    const timer = setTimeout(() => {
      const dialog = dialogRef.current
      const first =
        dialog?.querySelector(
          '.modal-body input:not([type="hidden"]):not([disabled]), .modal-body select:not([disabled]), .modal-body textarea:not([disabled])',
        ) ?? dialog?.querySelector('.modal-body button:not([disabled]), .modal-footer button:not([disabled])')
      first?.focus()
    }, 0)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
      clearTimeout(timer)
    }
  }, [show])

  if (!show) return null

  return createPortal(
    <>
      <div
        className="modal fade show d-block"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        ref={dialogRef}
        onMouseDown={(event) => {
          // .modal menutupi layar di atas backdrop: klik di luar dialog jatuh di sini.
          if (event.target === event.currentTarget && !busy) onClose()
        }}
      >
        <div className="modal-dialog modal-fullscreen-sm-down modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id={titleId}>
                {title}
              </h5>
              <button type="button" className="btn-close" aria-label="Tutup" onClick={onClose} disabled={busy}></button>
            </div>
            <div className="modal-body">{children}</div>
            {footer && <div className="modal-footer">{footer}</div>}
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show"></div>
    </>,
    document.body,
  )
}
