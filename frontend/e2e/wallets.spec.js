import { expect, test } from '@playwright/test'
import { addTransaction, createUser, signIn } from './helpers.js'

const today = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' })

test('dompet usaha, pindah uang, lalu saringan Usaha di dashboard', async ({ page, request }) => {
  const user = await createUser(request, { openingBalance: 100000 })
  await signIn(page, user)

  await page.goto('/wallets')
  await expect(page.getByRole('article', { name: 'Dompet Utama' })).toContainText('Rp 100.000')
  await page.getByRole('button', { name: 'Tambah dompet' }).click()
  const form = page.getByRole('dialog', { name: 'Tambah dompet' })
  await form.getByLabel('Nama').fill('Kas Warung')
  await form.getByText('Usaha', { exact: true }).click()
  await form.getByLabel('Saldo awal').fill('500000')
  await form.getByRole('button', { name: 'Simpan' }).click()
  await expect(form).toBeHidden()
  await expect(page.getByRole('article', { name: 'Kas Warung' })).toContainText('Rp 500.000')

  await page.getByRole('button', { name: 'Pindah uang dari Kas Warung' }).click()
  const transfer = page.getByRole('dialog', { name: 'Pindah uang' })
  await transfer.getByLabel('Ke').selectOption({ label: 'Dompet Utama (Rp 100.000)' })
  await transfer.getByLabel('Nominal').fill('150000')
  await transfer.getByRole('button', { name: 'Pindahkan' }).click()
  await expect(transfer).toBeHidden()
  await expect(page.getByRole('article', { name: 'Dompet Utama' })).toContainText('Rp 250.000')
  await expect(page.getByRole('article', { name: 'Kas Warung' })).toContainText('Rp 350.000')
  await expect(page.getByRole('region', { name: 'Riwayat pindah uang' })).toContainText('Rp 150.000')

  await page.goto('/')
  await expect(page.locator('[data-summary="balance"]')).toContainText('Rp 600.000')
  await page.getByRole('group', { name: 'Tampilkan dompet' }).getByRole('button', { name: 'Usaha' }).click()
  await expect(page).toHaveURL(/purpose=business/)
  await expect(page.locator('[data-summary="balance"]')).toContainText('Rp 350.000')
})

test('catat dengan "Ulangi tiap bulan" membuat transaksi rutin', async ({ page, request }) => {
  const user = await createUser(request, { openingBalance: 0 })
  await signIn(page, user)
  await page.goto('/transactions')

  await page.getByRole('button', { name: 'Tambah Transaksi' }).click()
  const dialog = page.getByRole('dialog', { name: 'Tambah Transaksi' })
  await dialog.getByLabel('Nominal').fill('175000')
  await dialog.getByLabel('Kategori').selectOption({ label: 'Listrik' })
  await dialog.getByLabel('Deskripsi').fill('Listrik PLN')
  await dialog.getByText('Detail lain').click()
  await dialog.getByLabel('Ulangi otomatis').selectOption({ label: 'Tiap bulan' })
  await dialog.getByRole('button', { name: 'Simpan', exact: true }).click()
  await expect(dialog).toBeHidden()
  await expect(page.getByText('1 transaksi sudah dicatat')).toBeVisible()
  await expect(page.getByRole('img', { name: 'Transaksi rutin' }).first()).toBeVisible()

  await page.getByRole('link', { name: 'Rutin' }).click()
  await expect(page).toHaveURL(/\/recurring$/)
  await expect(page.getByText('Listrik PLN')).toBeVisible()
  await expect(page.getByText(`Tiap tanggal ${Number(today().slice(8))}`)).toBeVisible()
})

test('pengingat sore muncul saat belum ada catatan dan bisa ditutup sampai besok', async ({ page, request }) => {
  const user = await createUser(request, { openingBalance: 0 })
  await addTransaction(request, user, { amount: 5000, date: '2026-01-02' })
  await page.clock.setFixedTime(new Date(`${today()}T18:30:00+07:00`))
  await signIn(page, user)
  await page.goto('/')

  const reminder = page.getByText('Belum ada catatan hari ini.')
  await expect(reminder).toBeVisible()
  await page.getByRole('button', { name: 'Nanti saja' }).click()
  await expect(reminder).toBeHidden()
  await page.reload()
  await expect(page.getByText('Selamat malam')).toBeVisible()
  await expect(reminder).toBeHidden()
})
