import { expect, test } from '@playwright/test'
import { addTransaction, createUser, signIn } from './helpers.js'

test('HP: tidak ada geser ke samping, Catat membuka form, bahasa bisa diganti', async ({ page, request }) => {
  const user = await createUser(request, { openingBalance: 100000 })
  await addTransaction(request, user, { amount: 15000, description: 'Pulsa', category: 'Pulsa' })
  await signIn(page, user)

  for (const path of ['/', '/transactions', '/reports/daily', '/budgets', '/categories', '/export', '/account']) {
    await page.goto(path)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
    expect(overflow, `geser ke samping di ${path}`).toBe(false)
  }

  await page.goto('/transactions')
  await expect(page.getByRole('button', { name: 'Edit transaksi Pulsa' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Tambah Transaksi' })).toBeHidden()
  await page.getByRole('navigation', { name: 'Navigasi utama' }).getByRole('button', { name: 'Catat' }).click()
  await expect(page.getByRole('dialog', { name: 'Tambah Transaksi' })).toBeVisible()
  await page.getByRole('button', { name: 'Batal' }).click()

  await page.goto('/')
  await page.getByRole('button', { name: /Bahasa: Bahasa Indonesia/ }).click()
  await expect(page.locator('[data-summary="balance"]')).toContainText('Your money now')
  await expect(page.locator('[data-summary="balance"]')).toContainText('Rp 85.000')
})
