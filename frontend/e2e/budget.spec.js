import { expect, test } from '@playwright/test'
import { addTransaction, createUser, signIn } from './helpers.js'

test('budget baru: tanpa salin bulan lalu, lalu terlampaui', async ({ page, request }) => {
  const user = await createUser(request, { openingBalance: 0 })
  await addTransaction(request, user, { amount: 25000, description: 'Makan siang' })
  await signIn(page, user)
  await page.goto('/budgets')

  await expect(page.getByRole('heading', { name: /Belum ada budget untuk/ })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Salin bulan lalu' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Tambah Budget' })).toHaveCount(1)

  await page.getByRole('button', { name: 'Tambah Budget' }).click()
  const dialog = page.getByRole('dialog', { name: 'Tambah Budget' })
  await expect(dialog.getByLabel('Bulan')).toHaveCount(0)
  await dialog.getByLabel('Kategori pengeluaran').selectOption({ label: 'Makanan' })
  await dialog.getByLabel('Batas pengeluaran').fill('20000')
  await dialog.getByRole('button', { name: 'Simpan' }).click()

  await expect(page.getByText('Terlampaui').first()).toBeVisible()
  await expect(page.getByText('lebih Rp 5.000').first()).toBeVisible()
})
