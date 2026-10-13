import { expect, test } from '@playwright/test'
import { addTransaction, createUser, signIn } from './helpers.js'

test('hapus transaksi langsung lalu batalkan memulihkannya', async ({ page, request }) => {
  const user = await createUser(request, { openingBalance: 0 })
  await addTransaction(request, user, { amount: 30000, description: 'Bakso' })
  await signIn(page, user)
  await page.goto('/transactions')

  const row = page.getByRole('row', { name: /Bakso/ })
  await expect(row).toBeVisible()
  await page.getByRole('button', { name: 'Hapus transaksi Bakso' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(row).toHaveCount(0)

  await page.getByRole('button', { name: 'Batalkan' }).click()
  await expect(page.getByRole('row', { name: /Bakso/ })).toBeVisible()
})

test('form transaksi: nominal bulat, detail lain tersembunyi, simpan & tambah lagi', async ({ page, request }) => {
  const user = await createUser(request, { openingBalance: 0 })
  await signIn(page, user)
  await page.goto('/transactions')
  await page.getByRole('button', { name: 'Tambah Transaksi' }).click()
  const dialog = page.getByRole('dialog', { name: 'Tambah Transaksi' })

  const amount = dialog.getByLabel('Nominal')
  await expect(amount).toHaveAttribute('inputmode', 'numeric')
  await amount.fill('1500,75')
  await expect(amount).toHaveValue('150.075')
  await expect(dialog.getByLabel('Metode pembayaran')).toBeHidden()

  await amount.fill('12000')
  await dialog.getByLabel('Kategori').selectOption({ label: 'Transportasi' })
  await dialog.getByRole('button', { name: 'Simpan & tambah lagi' }).click()
  await expect(dialog).toBeVisible()
  await expect(amount).toHaveValue('')
  await dialog.getByRole('button', { name: 'Batal' }).click()

  await expect(page.getByRole('row', { name: /Transportasi/ })).toBeVisible()
})
