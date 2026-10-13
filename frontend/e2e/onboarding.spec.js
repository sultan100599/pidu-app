import { expect, test } from '@playwright/test'
import { createUser, signIn } from './helpers.js'

test('daftar, isi saldo awal, catat pengeluaran pertama', async ({ page }) => {
  const email = `e2e-daftar-${Date.now()}@pidu.test`
  await page.goto('/register')
  await page.getByLabel('Nama').fill('Bu Sari')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password', { exact: true }).fill('rahasia123')
  await expect(page.getByLabel('Konfirmasi Password')).toHaveCount(0)
  await page.getByRole('button', { name: 'Daftar' }).click()

  const prompt = page.getByRole('region', { name: 'Berapa uang kamu sekarang?' })
  await expect(prompt).toBeVisible()
  await prompt.getByLabel('Saldo awal').fill('500000')
  await prompt.getByRole('button', { name: 'Simpan' }).click()
  await expect(prompt).toBeHidden()
  await expect(page.getByText('Termasuk saldo awal Rp 500.000')).toBeVisible()

  await page.getByRole('button', { name: 'Catat transaksi' }).click()
  const dialog = page.getByRole('dialog', { name: 'Tambah Transaksi' })
  await dialog.getByLabel('Nominal').fill('25000')
  await dialog.getByLabel('Kategori').selectOption({ label: 'Makanan' })
  await dialog.getByLabel('Deskripsi').fill('Nasi padang')
  await dialog.getByRole('button', { name: 'Simpan', exact: true }).click()
  await expect(dialog).toBeHidden()

  const wallet = page.locator('[data-summary="balance"]')
  await expect(wallet).toContainText('Uang kamu sekarang')
  await expect(wallet).toContainText('Rp 475.000')
})

test('pengguna yang melewati saldo awal mulai dari Rp 0 dan tidak ditanya lagi', async ({ page, request }) => {
  const user = await createUser(request)
  await signIn(page, user)
  await page.goto('/')
  await page.getByRole('button', { name: 'Mulai dari Rp 0' }).click()
  await expect(page.getByRole('region', { name: 'Berapa uang kamu sekarang?' })).toBeHidden()
  await page.reload()
  await expect(page.locator('[data-summary="balance"]')).toContainText('Rp 0')
  await expect(page.getByRole('region', { name: 'Berapa uang kamu sekarang?' })).toHaveCount(0)
})
