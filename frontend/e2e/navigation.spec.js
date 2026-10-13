import { expect, test } from '@playwright/test'
import { createUser, signIn } from './helpers.js'

test('satu menu Laporan dengan tab, judul halaman di bar atas', async ({ page, request }) => {
  const user = await createUser(request, { openingBalance: 0 })
  await signIn(page, user)
  await page.goto('/')

  const sidebar = page.getByRole('complementary', { name: 'Menu navigasi' })
  await expect(sidebar.getByRole('link')).toHaveCount(7)
  await sidebar.getByRole('link', { name: 'Laporan' }).click()
  await expect(page).toHaveURL(/\/reports\/daily$/)

  const topbar = page.getByRole('banner')
  await expect(topbar.getByRole('heading', { level: 1 })).toHaveText('Rekap Harian')

  await page.getByRole('navigation', { name: 'Jenis laporan' }).getByRole('link', { name: 'Bulanan' }).click()
  await expect(page).toHaveURL(/\/reports\/monthly$/)
  await expect(topbar.getByRole('heading', { level: 1 })).toHaveText('Rekap Bulanan')
  await expect(sidebar.getByRole('link', { name: 'Laporan' })).toHaveClass(/active/)
})

test('sidebar diperkecil menampilkan logo dan bisa diperbesar lagi', async ({ page, request }) => {
  const user = await createUser(request, { openingBalance: 0 })
  await signIn(page, user)
  await page.goto('/')

  await page.getByRole('button', { name: 'Perkecil menu' }).click()
  const expand = page.getByRole('button', { name: 'Perbesar menu' })
  await expect(expand).toBeVisible()
  await expect(expand.locator('.bi-wallet2')).toBeVisible()
  await expand.click()
  await expect(page.getByRole('button', { name: 'Perkecil menu' })).toBeVisible()
})
