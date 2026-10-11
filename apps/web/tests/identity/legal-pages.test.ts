import { ROUTES } from '../../src/constants/routes'
import { expect, test } from '../playwright'

// Browser integration with mocked session transport. These public, static documents
// have no protected actions, data queries, forms, mutations or recovery states.
// Their contract covers direct access, document navigation, keyboard and layout.
const DOCUMENTS = [
  { route: ROUTES.termsOfUse, title: 'Termos de Uso', navigation: 'Termos de uso' },
  {
    route: ROUTES.privacyPolicy,
    title: 'Política de Privacidade',
    navigation: 'Privacidade',
  },
] as const

test.describe('LegalDocumentPage', () => {
  for (const document of DOCUMENTS) {
    test(`opens ${document.title} directly without authentication`, async ({ page }) => {
      await page.goto(document.route)
      await expect(page).toHaveURL(document.route)
      await expect(page).toHaveTitle(`${document.title} — Scoops`)
      await expect(
        page.getByRole('heading', { level: 1, name: document.title, exact: true }),
      ).toBeVisible()
      await expect(page.getByText('Minuta para revisão', { exact: true })).toBeVisible()
      await expect(page.getByRole('article')).toContainText('CNPJ 66.779.955/0001-05')
      const contactLinks = page.getByRole('link', {
        name: 'scoops.app.team@gmail.com',
        exact: true,
      })
      await expect(contactLinks).toHaveCount(2)
      for (const link of await contactLinks.all()) {
        await expect(link).toHaveAttribute('href', 'mailto:scoops.app.team@gmail.com')
      }
      await expect(
        page
          .getByRole('navigation', { name: 'Documentos legais' })
          .getByRole('link', { name: document.navigation, exact: true }),
      ).toHaveAttribute('aria-current', 'page')
      await page.reload()
      await expect(page.getByRole('article', { name: document.title })).toBeVisible()
    })

    test(`navigates ${document.title} by keyboard and preserves fragment links`, async ({
      page,
    }) => {
      await page.goto(document.route)
      const skip = page.getByRole('link', { name: 'Ir para o documento' })
      await page.getByRole('heading', { level: 1, name: document.title }).waitFor()
      await skip.focus()
      await expect(skip).toBeFocused()
      await page.keyboard.press('Enter')
      await expect(page.getByRole('main')).toBeFocused()
      await expect(page).toHaveURL(`${document.route}#documento`)

      const contents = page.getByRole('navigation', { name: 'Nesta página' })
      const contact = contents.getByRole('link', { name: 'Responsável e contato' })
      await contact.focus()
      await page.keyboard.press('Enter')
      await expect(page).toHaveURL(`${document.route}#responsavel`)
      await expect(
        page.getByRole('heading', { name: 'Responsável e contato', exact: true }),
      ).toBeInViewport()
      await page.reload()
      await expect(page).toHaveURL(`${document.route}#responsavel`)
      await expect(
        page.getByRole('heading', { name: 'Responsável e contato', exact: true }),
      ).toBeInViewport()
    })

    test(`keeps ${document.title} readable at narrow widths`, async ({ page }) => {
      await page.goto(document.route)
      for (const width of [390, 320]) {
        await page.setViewportSize({ width, height: 844 })
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
        await expect(page.getByRole('navigation', { name: 'Nesta página' })).toBeVisible()
        expect(
          await page.evaluate(() => globalThis.document.documentElement.scrollWidth),
        ).toBeLessThanOrEqual(width)
        await page.getByRole('link', { name: 'Voltar ao início', exact: true }).focus()
        await page.keyboard.press('Enter')
        await expect(page).toHaveURL(ROUTES.root)
        await page.goto(document.route)
      }
    })
  }

  test('opens both documents from the landing footer and moves between them', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(ROUTES.root)
    const footer = page.getByRole('contentinfo')
    await footer.getByRole('link', { name: 'Termos de uso', exact: true }).click()
    await expect(page).toHaveURL(ROUTES.termsOfUse)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Termos de Uso')
    await expect(page.getByRole('article')).toContainText(/R\$\s*79,90/)
    await page
      .getByRole('link', { name: 'Leia também a Política de Privacidade' })
      .click()
    await expect(page).toHaveURL(ROUTES.privacyPolicy)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Política de Privacidade',
    )
    await page.getByRole('link', { name: 'Leia também os Termos de Uso' }).click()
    await expect(page).toHaveURL(ROUTES.termsOfUse)
    await page.getByRole('link', { name: 'Scoops — início' }).click()
    await expect(page).toHaveURL(ROUTES.root)
    await footer.getByRole('link', { name: 'Privacidade', exact: true }).click()
    await expect(page).toHaveURL(ROUTES.privacyPolicy)
  })

  for (const profile of ['manager', 'operator'] as const) {
    test(`keeps the legal documents public for an authenticated ${profile}`, async ({
      page,
      identityFixture,
    }) => {
      if (profile === 'manager') {
        await identityFixture.mockManagerSession()
        await identityFixture.mockManagerAccount()
      } else {
        await identityFixture.mockOperatorSession()
        await identityFixture.mockOperatorAccount()
      }
      for (const document of DOCUMENTS) {
        await page.goto(document.route)
        await expect(page).toHaveURL(document.route)
        await expect(page.getByRole('heading', { level: 1 })).toHaveText(document.title)
      }
    })
  }
})
