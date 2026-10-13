import { createContext, useContext } from 'react'

// Elemen tujuan di topbar untuk judul & aksi halaman (desktop). Diisi Topbar lewat ref,
// dibaca PageHeader untuk portal.
export const TopbarSlotsContext = createContext({ slots: {}, register: () => {} })

export function useTopbarSlots() {
  return useContext(TopbarSlotsContext)
}
