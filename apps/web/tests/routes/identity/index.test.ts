import { expect, test } from '@playwright/test'

import { mockAnonymousProvider } from './test-helpers'

test('renders the Scoops landing route', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveURL('/')
  await expect(page.getByRole('heading', { name: 'Welcome to Scoops' })).toBeVisible()
  await expect(
    page.getByText('The operational platform for managing your store'),
  ).toBeVisible()
})

test('redirects expired recovery links to the reset-password route', async ({ page }) => {
  await mockAnonymousProvider(page)

  await page.goto(
    '/#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired',
  )

  await expect(page).toHaveURL(/\/reset-password\/?$/)
  await expect(page.getByRole('alert')).toContainText('expirou ou não é válido')
})
