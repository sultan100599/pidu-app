import { expect, test } from '@playwright/test'
import { createUser, signIn } from './helpers.js'

test('ganti password lalu masuk dengan password baru', async ({ page, request }) => {
  const user = await createUser(request, { openingBalance: 0 })
  await signIn(page, user)
  await page.goto('/')
  await page.getByRole('button', { name: 'Menu pengguna' }).click()
  await page.getByRole('link', { name: 'Akun & password' }).click()
  await expect(page).toHaveURL(/\/account$/)

  await page.getByLabel('Password lama').fill('salah1234')
  await page.getByLabel('Password baru').fill('barubaru1')
  await page.getByRole('button', { name: 'Ganti password' }).click()
  await expect(page.getByText('Password lama salah.')).toBeVisible()

  await page.getByLabel('Password lama').fill(user.password)
  await page.getByRole('button', { name: 'Ganti password' }).click()
  await expect(page.getByText('Password berhasil diganti.')).toBeVisible()

  await page.getByRole('button', { name: 'Menu pengguna' }).click()
  await page.getByRole('button', { name: 'Keluar' }).click()
  await expect(page).toHaveURL(/\/login$/)
  await page.getByLabel('Email').fill(user.email)
  await page.getByLabel('Password', { exact: true }).fill('barubaru1')
  await page.getByRole('button', { name: 'Masuk' }).click()
  await expect(page).toHaveURL(/\/$/)
})

test('lupa password menampilkan konfirmasi tanpa membocorkan email', async ({ page }) => {
  await page.goto('/login')
  await page.getByRole('link', { name: 'Lupa password?' }).click()
  await page.getByLabel('Email').fill('tidak-terdaftar@pidu.test')
  await page.getByRole('button', { name: 'Kirim link' }).click()
  await expect(page.getByRole('status')).toContainText('Jika email itu terdaftar')
})
