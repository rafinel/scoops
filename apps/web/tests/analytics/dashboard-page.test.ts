import { expect, test } from '../playwright'
import { mockAnalytics } from '../fixtures/analytics-module-fixture'

test.describe('DashboardPage', () => {
  test('renders the Manager dashboard and changes the period', async ({
    page,
    identityFixture,
  }) => {
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()
    await mockAnalytics(page)
    await page.setViewportSize({ width: 1481, height: 1232 })
    await page.goto('/')

    await expect(
      page.getByRole('heading', { name: 'Dashboard', exact: true }),
    ).toBeVisible()
    await expect(page.getByText('15 de ago.–13 de set.', { exact: true })).toBeVisible()
    const updatedAt = await page.evaluate(() =>
      new Intl.DateTimeFormat('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date('2026-09-13T13:00:00.000Z')),
    )
    await expect(page.getByText(`Atualizado em ${updatedAt}`, { exact: true })).toBeVisible()
    await expect(page.getByText('R$ 1.250,00', { exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Estoque agora' })).toBeVisible()
    await expect(page.getByRole('listitem').locator('svg')).toHaveCount(1)
    await page.getByRole('button', { name: 'Detalhes da cobertura' }).click()
    const coverageDialog = page.getByRole('dialog', {
      name: 'Detalhes da cobertura de custos',
    })
    await expect(
      coverageDialog.getByText('Custo dos produtos vendidos (CMV)'),
    ).toBeVisible()
    await expect(coverageDialog.getByText('R$ 480,00')).toBeVisible()
    await coverageDialog
      .getByRole('button', { name: 'Fechar detalhes da cobertura' })
      .click()
    await page.getByRole('button', { name: 'Ver dados em tabela' }).click()
    const salesTableDialog = page.getByRole('dialog', {
      name: 'Dados da evolução das vendas',
    })
    await expect(salesTableDialog).toBeVisible()
    await expect(salesTableDialog.getByRole('table')).toBeVisible()
    await expect(salesTableDialog.getByText('13/09')).toBeVisible()
    await salesTableDialog.getByRole('button', { name: 'Fechar tabela' }).click()
    await expect(salesTableDialog).toBeHidden()
    await page.getByRole('button', { name: '7 dias' }).click()
    await expect(page.getByRole('button', { name: '7 dias' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await page.screenshot({
      path: 'test-results/dashboard-page-desktop.png',
      fullPage: true,
    })
  })

  test('redirects an anonymous visitor to login', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/login\?returnTo=%2F/)
  })

  test('keeps dashboard controls readable at a narrow viewport', async ({
    page,
    identityFixture,
  }) => {
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()
    await mockAnalytics(page)
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')

    await expect(
      page.getByRole('heading', { name: 'Dashboard', exact: true }),
    ).toBeVisible()
    await expect(page.getByRole('button', { name: 'Valor', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Qtd.', exact: true })).toBeVisible()
    await expect(
      page.getByRole('combobox', { name: 'Período do dashboard' }),
    ).toBeVisible()
    await expect(page.getByRole('textbox', { name: 'Buscar no Scoops' })).toBeVisible()
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(390)
    await page.screenshot({
      path: 'test-results/dashboard-page-narrow.png',
      fullPage: true,
    })
    await page.setViewportSize({ width: 320, height: 720 })
    await page.waitForFunction(() => document.documentElement.scrollWidth <= 320)
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(320)
    await page.screenshot({
      path: 'test-results/dashboard-page-minimum.png',
      fullPage: true,
    })
  })

  test('refetches dashboard data after a page reload', async ({
    page,
    identityFixture,
  }) => {
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()
    await mockAnalytics(page)

    let salesRequests = 0
    let stockRequests = 0
    page.on('request', (request) => {
      if (request.url().includes('/analytics/sales?period=')) salesRequests += 1
      if (request.url().endsWith('/analytics/stock-attention')) stockRequests += 1
    })

    await page.goto('/')
    await expect(
      page.getByRole('heading', { name: 'Dashboard', exact: true }),
    ).toBeVisible()
    await page.reload()
    await expect(
      page.getByRole('heading', { name: 'Dashboard', exact: true }),
    ).toBeVisible()

    expect(salesRequests).toBeGreaterThanOrEqual(1)
    expect(stockRequests).toBeGreaterThanOrEqual(1)
  })
})
