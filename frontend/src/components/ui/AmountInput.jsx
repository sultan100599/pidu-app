import { useEffect, useLayoutEffect, useRef, useState } from 'react'

// Input nominal dengan format Indonesia: pemisah ribuan titik, koma untuk
// desimal (maks 2 digit). Nilai ke parent = number (mis. "1.500,50" → 1500.5)
// atau null saat kosong. Posisi kursor dipertahankan berdasar jumlah digit di
// depannya supaya tidak melompat saat mengetik/menghapus di tengah angka.

function sanitize(raw) {
  let out = ''
  let hasComma = false
  for (const ch of raw) {
    if (ch >= '0' && ch <= '9') {
      out += ch
    } else if (ch === ',' && !hasComma) {
      hasComma = true
      out += ','
    }
    // karakter lain (termasuk '.' pemisah ribuan) dibuang
  }
  const commaIdx = out.indexOf(',')
  if (commaIdx >= 0) out = out.slice(0, commaIdx + 3)
  return out
}

function toDisplay(sanitized) {
  if (!sanitized) return ''
  const [intPart, decPart] = sanitized.split(',')
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return decPart !== undefined ? `${grouped},${decPart}` : grouped
}

function toNumber(sanitized) {
  if (!sanitized) return null
  return Number(sanitized.replace(',', '.'))
}

function formatNumberValue(value) {
  if (value == null || value === '') return ''
  return toDisplay(sanitize(String(value).replace('.', ',')))
}

// Karakter "bermakna" = digit dan koma desimal (titik ribuan diabaikan).
// Koma harus ikut dihitung; kalau tidak, kursor kembali ke depan koma setelah
// koma diketik dan digit desimal masuk ke bagian bilangan bulat.
const isSignificant = (ch) => (ch >= '0' && ch <= '9') || ch === ','

function countSignificant(text) {
  let count = 0
  for (const ch of text) {
    if (isSignificant(ch)) count += 1
  }
  return count
}

function cursorAfterSignificant(text, n) {
  if (n <= 0) return 0
  let count = 0
  for (let i = 0; i < text.length; i += 1) {
    if (isSignificant(text[i])) {
      count += 1
      if (count === n) return i + 1
    }
  }
  return text.length
}

export default function AmountInput({ value, onChange, id, invalid = false, disabled = false, ...rest }) {
  const [display, setDisplay] = useState(() => formatNumberValue(value))
  const lastEmitted = useRef(value)
  const inputRef = useRef(null)
  const pendingCursor = useRef(null)

  // Pasang kursor setelah DOM di-update (sinkron, sebelum ketikan berikutnya).
  useLayoutEffect(() => {
    if (pendingCursor.current != null && document.activeElement === inputRef.current) {
      inputRef.current.setSelectionRange(pendingCursor.current, pendingCursor.current)
    }
    pendingCursor.current = null
  })

  // Sinkron dari luar (mis. form di-reset) hanya bila value benar-benar berubah,
  // bukan karena echo balik dari onChange.
  useEffect(() => {
    if (value !== lastEmitted.current) {
      lastEmitted.current = value
      setDisplay(formatNumberValue(value))
    }
  }, [value])

  function handleChange(event) {
    const input = event.target
    const cursor = input.selectionStart ?? input.value.length
    const before = countSignificant(sanitize(input.value.slice(0, cursor)))

    const sanitized = sanitize(input.value)
    const nextDisplay = toDisplay(sanitized)
    const nextValue = toNumber(sanitized)

    pendingCursor.current = cursorAfterSignificant(nextDisplay, before)
    lastEmitted.current = nextValue
    setDisplay(nextDisplay)
    onChange(nextValue)
  }

  return (
    <div className="input-group has-validation">
      <span className="input-group-text" aria-hidden="true">
        Rp
      </span>
      <input
        {...rest}
        type="text"
        inputMode="decimal"
        id={id}
        ref={inputRef}
        className={`form-control ${invalid ? 'is-invalid' : ''}`}
        value={display}
        onChange={handleChange}
        disabled={disabled}
        placeholder="0"
        autoComplete="off"
      />
    </div>
  )
}
