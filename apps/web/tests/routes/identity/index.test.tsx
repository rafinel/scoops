import { expect, test } from '@playwright/test'

test('renders the Scoops landing route', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveURL('/')
  await expect(page.getByRole('heading', { name: 'Welcome to Scoops' })).toBeVisible()
})
