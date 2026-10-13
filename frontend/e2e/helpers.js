import { expect } from '@playwright/test'

const json = { Accept: 'application/json' }
let counter = 0

// Pengguna baru per tes supaya tiap tes berdiri sendiri.
export async function createUser(request, { openingBalance } = {}) {
  counter += 1
  const email = `e2e-${Date.now()}-${counter}@pidu.test`
  const password = 'rahasia123'
  const response = await request.post('/api/auth/register', { headers: json, data: { name: 'Bu Sari', email, password } })
  expect(response.ok()).toBeTruthy()
  const { token } = await response.json()
  const auth = { ...json, Authorization: `Bearer ${token}` }
  if (openingBalance != null) {
    expect((await request.put('/api/account', { headers: auth, data: { opening_balance: openingBalance } })).ok()).toBeTruthy()
  }
  return { email, password, token, auth }
}

export async function signIn(page, user) {
  await page.addInitScript((token) => localStorage.setItem('pidu_token', token), user.token)
}

export async function categoryId(request, user, name, type = 'expense') {
  const response = await request.get('/api/categories', { headers: user.auth })
  const { data } = await response.json()
  return data.find((c) => c.name === name && c.type === type).id
}

export async function addTransaction(request, user, { type = 'expense', category = 'Makanan', amount, description, date }) {
  const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' })
  const response = await request.post('/api/transactions', {
    headers: user.auth,
    data: {
      type,
      category_id: await categoryId(request, user, category, type),
      amount,
      description,
      transaction_date: date ?? today,
      payment_method: 'cash',
    },
  })
  expect(response.ok()).toBeTruthy()
}
