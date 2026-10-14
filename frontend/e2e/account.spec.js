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
  await page.getByRole('button', { name: 'Keluar', exact: true }).click()
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

test('jam pengingat diatur di Akun, lalu akun dihapus dengan password', async ({ page, request }) => {
  const user = await createUser(request, { openingBalance: 0 })
  await signIn(page, user)
  await page.goto('/account')

  await page.getByLabel('Mulai jam').selectOption({ label: 'Mati' })
  await expect(page.getByText('Pengingat dimatikan.')).toBeVisible()
  await page.getByLabel('Mulai jam').selectOption({ label: '12.00' })
  await expect(page.getByText('Pengingat muncul mulai pukul 12.00.')).toBeVisible()

  await page.getByRole('button', { name: 'Hapus akun' }).click()
  const dialog = page.getByRole('dialog', { name: 'Hapus akun ini?' })
  await dialog.getByLabel('Password').fill('salah1234')
  await dialog.getByRole('button', { name: 'Hapus akun' }).click()
  await expect(dialog.getByText('Password lama salah.')).toBeVisible()
  await dialog.getByLabel('Password').fill(user.password)
  await dialog.getByRole('button', { name: 'Hapus akun' }).click()
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByText('Akun dan semua datamu sudah dihapus.')).toBeVisible()

  await page.getByLabel('Email').fill(user.email)
  await page.getByLabel('Password', { exact: true }).fill(user.password)
  await page.getByRole('button', { name: 'Masuk' }).click()
  await expect(page).toHaveURL(/\/login$/)
})

test('keluar dari semua perangkat membuat token lain tidak berlaku', async ({ page, request }) => {
  const user = await createUser(request, { openingBalance: 0 })
  await signIn(page, user)
  await page.goto('/account')
  await page.getByRole('button', { name: 'Keluar dari semua perangkat' }).click()
  await page.getByRole('dialog', { name: 'Keluar dari semua perangkat?' }).getByRole('button', { name: 'Keluar semua' }).click()
  await expect(page).toHaveURL(/\/login$/)
  const me = await request.get('/api/auth/me', { headers: user.auth })
  expect(me.status()).toBe(401)
})

test('dialog hapus akun bisa dipakai dengan keyboard saja', async ({ page, request }) => {
  const user = await createUser(request, { openingBalance: 0 })
  await signIn(page, user)
  await page.goto('/account')
  const open = page.getByRole('button', { name: 'Hapus akun' })
  await open.focus()
  await page.keyboard.press('Enter')
  const dialog = page.getByRole('dialog', { name: 'Hapus akun ini?' })
  await expect(dialog).toBeVisible()
  await expect(dialog.locator(':focus')).toHaveCount(1)
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(open).toBeFocused()
})
