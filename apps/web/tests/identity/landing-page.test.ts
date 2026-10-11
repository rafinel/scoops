import { ROUTES } from '../../src/constants/routes'
import { expect, test } from '../playwright'

const HERO_HEADING = 'Sua sorveteria organizada. Do estoque à venda.'
const ORDER_PREVIEW = 'Prévia de um pedido no Scoops, com dados ilustrativos'

// Browser integration with mocked transport. This static public route has no
// data lifecycle, mutations or protected-access boundary; those belong to the
// destination suites. These cases exercise real route and navigation composition.
test.describe('LandingPage', () => {
  test('renders the public hero and a loaded illustrative order for anonymous visitors', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 1000 })
    await page.goto(ROUTES.root)

    await expect(page).toHaveURL(ROUTES.root)
    await expect(page.getByRole('heading', { name: HERO_HEADING })).toBeVisible()
    await expect(page.getByText('14 dias grátis. Sem cadastrar cartão.')).toBeVisible()
    await expect(
      page.getByRole('navigation', { name: 'Navegação principal' }),
    ).toHaveCount(0)
    const preview = page.getByRole('img', { name: ORDER_PREVIEW })
    await expect(preview).toBeVisible()
    await expect(preview).toHaveJSProperty('complete', true)
    expect(
      await preview.evaluate((image: HTMLImageElement) => image.naturalWidth),
    ).toBeGreaterThan(0)
  })

  test('explains the connected operation in order across desktop and narrow viewports', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(ROUTES.root)
    const section = page.getByRole('region', {
      name: 'Do ingrediente ao último pedido.',
    })
    const stages = section.getByRole('heading', { level: 3 })

    for (const width of [1440, 390, 320]) {
      await page.setViewportSize({ width, height: 900 })
      await section.scrollIntoViewIfNeeded()
      await expect(section).toBeVisible()
      await expect(stages).toHaveText(['Organize', 'Produza', 'Venda', 'Acompanhe'])
      await expect(section.getByText(/registre o consumo/)).toBeVisible()
      await expect(section.getByText(/estoque na confirmação/)).toBeVisible()
      await expect(section.getByText(/vendas e o que precisa de atenção/)).toBeVisible()
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(width)
    }
  })

  test('presents the three showcases in order and selects illustrative previews with the keyboard', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 1000 })
    await page.goto(ROUTES.root)
    await expect(
      page.getByRole('heading', {
        name: /^(Vendas no ritmo do balcão\.|Saiba o que pode produzir\.|Entenda os resultados\.)$/,
      }),
    ).toHaveText([
      'Vendas no ritmo do balcão.',
      'Saiba o que pode produzir.',
      'Entenda os resultados.',
    ])

    for (const [title, feature] of [
      ['Vendas no ritmo do balcão.', 'Combos automáticos'],
      ['Saiba o que pode produzir.', 'Capacidade com o estoque atual'],
      ['Entenda os resultados.', 'Margem bruta estimada'],
    ]) {
      const panel = page.getByRole('region', { name: title, exact: true })
      const selection = panel.getByRole('button', { name: new RegExp(`^${feature}`) })
      await selection.scrollIntoViewIfNeeded()
      await selection.focus()
      await page.keyboard.press('Enter')
      await expect(selection).toHaveAttribute('aria-pressed', 'true')
      await expect(
        panel.getByRole('figure', { name: `Prévia ilustrativa: ${feature}` }),
      ).toBeVisible()
      await expect(selection).toBeFocused()
      await panel.getByRole('button', { name: 'Pausar prévias', exact: true }).click()
      await expect(
        panel.getByRole('button', { name: 'Retomar prévias', exact: true }),
      ).toBeVisible()
    }
  })

  test('keeps reduced-motion showcases static while retaining manual selection on narrow screens', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(ROUTES.root)
    const panel = page.getByRole('region', {
      name: 'Vendas no ritmo do balcão.',
      exact: true,
    })
    for (const width of [390, 320]) {
      await page.setViewportSize({ width, height: 900 })
      const selection = panel.getByRole('button', { name: /^Combos automáticos/ })
      await selection.click()
      await expect(selection).toHaveAttribute('aria-pressed', 'true')
      await expect(
        panel.getByRole('button', { name: 'Movimento reduzido', exact: true }),
      ).toBeDisabled()
      await page.mouse.move(0, 0)
      await selection.evaluate((button: HTMLButtonElement) => button.blur())
      // Observe beyond the public eight-second rotation interval.
      await page.waitForTimeout(8500)
      await expect(
        panel.getByRole('figure', { name: 'Prévia ilustrativa: Combos automáticos' }),
      ).toBeVisible()
      await expect(selection).toHaveAttribute('aria-pressed', 'true')
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(width)
    }
  })

  test('keeps previews advancing during pointer interaction and pauses explicitly or for keyboard focus', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.setViewportSize({ width: 1440, height: 1000 })
    await page.goto(ROUTES.root)
    const panel = page.getByRole('region', {
      name: 'Vendas no ritmo do balcão.',
      exact: true,
    })
    // Start at the panel's scroll anchor, before later sticky panels cover it.
    await panel.evaluate((section) => {
      const anchor = section.previousElementSibling
      if (anchor) window.scrollTo(0, anchor.getBoundingClientRect().top + scrollY - 40)
    })
    await panel.getByRole('heading', { name: 'Vendas no ritmo do balcão.' }).hover()
    await expect(
      panel.getByRole('figure', { name: 'Prévia ilustrativa: Combos automáticos' }),
    ).toBeVisible({ timeout: 12000 })

    const firstFeature = panel.getByRole('button', {
      name: /^Tamanhos e acompanhamentos/,
    })
    await firstFeature.click()
    await expect(firstFeature).toHaveAttribute('aria-pressed', 'true')
    await expect(
      panel.getByRole('figure', {
        name: 'Prévia ilustrativa: Tamanhos e acompanhamentos',
      }),
    ).toBeVisible()

    await page.keyboard.press('Space')
    const progressFill = firstFeature.locator('span[aria-hidden="true"] > span')
    const keyboardProgress = await progressFill.evaluate(
      (fill) => getComputedStyle(fill).transform,
    )
    await page.waitForTimeout(600)
    await expect(firstFeature).toBeFocused()
    expect(await progressFill.evaluate((fill) => getComputedStyle(fill).transform)).toBe(
      keyboardProgress,
    )
    await firstFeature.click()
    await expect
      .poll(() => progressFill.evaluate((fill) => getComputedStyle(fill).transform))
      .not.toBe(keyboardProgress)
    await expect(
      panel.getByRole('figure', { name: 'Prévia ilustrativa: Combos automáticos' }),
    ).toBeVisible({ timeout: 12000 })

    await page.keyboard.press('Tab')
    const keyboardSelection = panel.getByRole('button', {
      name: /^Combos automáticos/,
    })
    await expect(keyboardSelection).toBeFocused()
    // A keyboard reader must retain the current preview beyond its rotation interval.
    await page.waitForTimeout(8500)
    await expect(
      panel.getByRole('figure', { name: 'Prévia ilustrativa: Combos automáticos' }),
    ).toBeVisible()

    const pause = panel.getByRole('button', { name: 'Pausar prévias', exact: true })
    await pause.click()
    await expect(
      panel.getByRole('button', { name: 'Retomar prévias', exact: true }),
    ).toBeVisible()
    // Pausing must preserve the selected preview beyond a full rotation interval.
    await page.waitForTimeout(8500)
    await expect(
      panel.getByRole('figure', { name: 'Prévia ilustrativa: Combos automáticos' }),
    ).toBeVisible()
    const resume = panel.getByRole('button', { name: 'Retomar prévias', exact: true })
    await resume.click()
    await expect(
      panel.getByRole('figure', { name: 'Prévia ilustrativa: Estoque conectado' }),
    ).toBeVisible({ timeout: 12000 })
  })

  test('presents team access after the showcases and updates the detail with pointer and keyboard selection', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 1000 })
    await page.goto(ROUTES.root)
    await expect(
      page.getByRole('heading', {
        level: 2,
        name: /^(Vendas no ritmo do balcão\.|Saiba o que pode produzir\.|Entenda os resultados\.|Sua equipe alinhada\. Cada um com seu acesso\.)$/,
      }),
    ).toHaveText([
      'Vendas no ritmo do balcão.',
      'Saiba o que pode produzir.',
      'Entenda os resultados.',
      /Sua equipe alinhada\.\s*Cada um com seu acesso\./,
    ])
    const team = page.getByRole('region', {
      name: 'Sua equipe alinhada. Cada um com seu acesso.',
      exact: true,
    })
    await team.scrollIntoViewIfNeeded()
    const manager = team.getByRole('button', { name: 'Explorar Gerente', exact: true })
    const operator = team.getByRole('button', { name: 'Explorar Operador', exact: true })
    const history = team.getByRole('button', { name: 'Explorar Histórico', exact: true })
    await manager.hover()
    await expect(manager).toHaveAttribute('aria-pressed', 'true')
    await expect(
      team.getByRole('heading', { name: 'Gerente', exact: true }),
    ).toBeVisible()
    await operator.click()
    await expect(operator).toHaveAttribute('aria-pressed', 'true')
    await expect(manager).toHaveAttribute('aria-pressed', 'false')
    await expect(
      team.getByRole('heading', { name: 'Operador', exact: true }),
    ).toBeVisible()

    await page.keyboard.press('Tab')
    await expect(history).toBeFocused()
    await expect(history).toHaveAttribute('aria-pressed', 'true')
    await expect(
      team.getByRole('heading', {
        name: 'Histórico de alterações da equipe',
        exact: true,
      }),
    ).toBeVisible()
    await expect(team.getByText('Exemplo ilustrativo', { exact: true })).toBeVisible()
    await expect(team.getByText('Marina promoveu Lucas a Gerente')).toBeVisible()
    await expect(page).toHaveURL(ROUTES.root)
  })

  test('retains team card selection with reduced motion on narrow screens', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(ROUTES.root)
    const team = page.getByRole('region', {
      name: 'Sua equipe alinhada. Cada um com seu acesso.',
      exact: true,
    })
    for (const width of [390, 320]) {
      await page.setViewportSize({ width, height: 900 })
      await team.scrollIntoViewIfNeeded()
      const manager = team.getByRole('button', { name: 'Explorar Gerente', exact: true })
      const operator = team.getByRole('button', {
        name: 'Explorar Operador',
        exact: true,
      })
      await manager.click()
      await expect(manager).toHaveAttribute('aria-pressed', 'true')
      await expect(
        team.getByRole('heading', { name: 'Gerente', exact: true }),
      ).toBeVisible()
      await page.keyboard.press('Tab')
      await expect(operator).toBeFocused()
      await expect(operator).toHaveAttribute('aria-pressed', 'true')
      await expect(
        team.getByRole('heading', { name: 'Operador', exact: true }),
      ).toBeVisible()
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(width)
    }
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.setViewportSize({ width: 320, height: 900 })
    await team.getByRole('button', { name: 'Explorar Gerente', exact: true }).click()
    await expect(
      team.getByRole('button', { name: 'Explorar Gerente', exact: true }),
    ).toHaveAttribute('aria-pressed', 'true')
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(320)
  })

  test('presents the complete monthly offer after team access and opens onboarding from its keyboard CTA', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(ROUTES.root)
    await expect(
      page.getByRole('heading', {
        level: 2,
        name: /^(Sua equipe alinhada\. Cada um com seu acesso\.|Um plano\. Sua sorveteria inteira conectada\.)$/,
      }),
    ).toHaveText([
      /Sua equipe alinhada\.\s*Cada um com seu acesso\./,
      /Um plano\.\s*Sua sorveteria inteira conectada\./,
    ])
    const pricing = page.getByRole('region', {
      name: 'Um plano. Sua sorveteria inteira conectada.',
      exact: true,
    })
    for (const width of [1440, 390, 320]) {
      await page.setViewportSize({ width, height: 900 })
      await pricing.scrollIntoViewIfNeeded()
      await expect(pricing.getByText('R$ 79,90', { exact: true })).toBeVisible()
      await expect(pricing.getByText('/mês', { exact: true })).toBeVisible()
      await expect(pricing.getByText('Impostos inclusos', { exact: true })).toBeVisible()
      await expect(
        pricing.getByText('Todos os recursos em um único plano', { exact: true }),
      ).toBeVisible()
      await expect(pricing.getByRole('listitem')).toHaveText([
        'Usuários ilimitados',
        'Produtos ilimitados',
        'Pedidos ilimitados',
        'Movimentações ilimitadas',
      ])
      await expect(
        pricing.getByText('14 dias grátis, sem cartão de crédito', { exact: true }),
      ).toBeVisible()
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(width)
    }
    const trial = pricing.getByRole('link', {
      name: 'Começar teste grátis',
      exact: true,
    })
    await expect(trial).toHaveAttribute('href', ROUTES.onboarding)
    await trial.focus()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(ROUTES.onboarding)
    await expect(page.getByRole('heading', { name: 'Crie sua sorveteria' })).toBeVisible()
  })

  for (const profile of ['manager', 'operator'] as const) {
    test(`keeps an authenticated ${profile} on the public home`, async ({
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
      await page.goto(ROUTES.root)

      await expect(page).toHaveURL(ROUTES.root)
      await expect(page.getByRole('heading', { name: HERO_HEADING })).toBeVisible()
      await expect(
        page.getByRole('heading', { name: 'Dashboard', exact: true }),
      ).toHaveCount(0)
    })
  }

  test('opens existing onboarding from the trial CTA and login from the header', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 1000 })
    await page.goto(ROUTES.root)
    const trial = page
      .getByRole('region', { name: HERO_HEADING, exact: true })
      .getByRole('link', { name: 'Começar teste grátis', exact: true })
    await expect(trial).toHaveAttribute('href', ROUTES.onboarding)
    await trial.focus()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(ROUTES.onboarding)
    await expect(page.getByRole('heading', { name: 'Crie sua sorveteria' })).toBeVisible()

    await page.goto(ROUTES.root)
    const headerTrial = page.getByRole('link', { name: 'Testar grátis', exact: true })
    await expect(headerTrial).toHaveAttribute('href', ROUTES.onboarding)
    await headerTrial.click()
    await expect(page).toHaveURL(ROUTES.onboarding)
    await expect(page.getByRole('heading', { name: 'Crie sua sorveteria' })).toBeVisible()

    await page.goto(ROUTES.root)
    const login = page
      .getByRole('navigation', { name: 'Navegação da landing', exact: true })
      .getByRole('link', { name: 'Entrar', exact: true })
    await expect(login).toHaveAttribute('href', ROUTES.login)
    await login.click()
    await expect(page).toHaveURL(ROUTES.login)
    await expect(page.getByRole('heading', { name: 'Entre no Scoops' })).toBeVisible()
  })

  test('keeps the mobile hero readable and returns keyboard focus after closing navigation', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(ROUTES.root)
    await expect(page.getByRole('heading', { name: HERO_HEADING })).toBeVisible()
    await expect(
      page
        .getByRole('region', { name: HERO_HEADING, exact: true })
        .getByRole('link', { name: 'Começar teste grátis', exact: true }),
    ).toBeVisible()
    const preview = page.getByRole('img', { name: ORDER_PREVIEW })
    await expect(preview).toBeVisible()
    await expect(preview).toHaveJSProperty('complete', true)
    expect(
      await preview.evaluate((image: HTMLImageElement) => image.naturalWidth),
    ).toBeGreaterThan(0)
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(390)

    const menuButton = page.getByRole('button', { name: 'Abrir navegação' })
    await menuButton.focus()
    await page.keyboard.press('Enter')
    const menu = page.getByRole('menu')
    await expect(menu).toBeVisible()
    await expect(
      menu.getByRole('menuitem', { name: 'Entrar', exact: true }),
    ).toHaveAttribute('href', ROUTES.login)
    await expect(
      menu.getByRole('menuitem', { name: 'Testar grátis', exact: true }),
    ).toHaveAttribute('href', ROUTES.onboarding)
    await page.keyboard.press('Escape')
    await expect(menu).toBeHidden()
    await expect(menuButton).toBeFocused()

    await page.keyboard.press('Enter')
    await menu.getByRole('menuitem', { name: 'Entrar', exact: true }).click()
    await expect(page).toHaveURL(ROUTES.login)
    await expect(page.getByRole('heading', { name: 'Entre no Scoops' })).toBeVisible()
  })

  test('fits the minimum viewport with reduced motion and navigates from the mobile trial link', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 720 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(ROUTES.root)
    await expect(page.getByRole('heading', { name: HERO_HEADING })).toBeVisible()
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(320)

    await page.getByRole('button', { name: 'Abrir navegação' }).click()
    await page
      .getByRole('menu')
      .getByRole('menuitem', { name: 'Testar grátis', exact: true })
      .click()
    await expect(page).toHaveURL(ROUTES.onboarding)
    await expect(page.getByRole('heading', { name: 'Crie sua sorveteria' })).toBeVisible()
  })
})

// Static FAQ selection has no transport or mutation state. This route exercises
// the real question controller and its keyboard/accessibility relationships.
test.describe('LandingFAQ', () => {
  test('keeps every question visible while selecting exactly one answer with the keyboard', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 1000 })
    await page.goto(ROUTES.root)
    const faq = page.getByRole('region', { name: 'Antes de começar, tire suas dúvidas.' })
    await faq.scrollIntoViewIfNeeded()
    const questions = faq.getByRole('button')
    await expect(questions).toHaveCount(4)
    await expect(questions.first()).toHaveAttribute('aria-expanded', 'true')
    for (const [name, copy] of [
      ['Preciso de cartão para testar?', /14 dias/],
      ['O que está incluído nos R$ 79,90/mês?', /impostos inclusos/i],
      ['Posso cadastrar toda a minha equipe?', /Gerente e Operador/],
      ['Como estoque, produção e vendas se conectam?', /produção/],
    ] as const) {
      const question = faq.getByRole('button', { name, exact: true })
      await question.focus()
      await page.keyboard.press('Enter')
      await expect(question).toBeFocused()
      await expect(question).toHaveAttribute('aria-expanded', 'true')
      await expect(faq.locator('button[aria-expanded="true"]')).toHaveCount(1)
      await expect(faq.getByRole('region')).toHaveCount(1)
      const answer = faq.getByRole('region', { name, exact: true })
      await expect(answer).toBeVisible()
      await expect(answer).toContainText(copy)
      for (const visibleQuestion of await questions.all()) {
        await expect(visibleQuestion).toBeVisible()
      }
      await page.keyboard.press('Space')
      await expect(question).toHaveAttribute('aria-expanded', 'true')
    }
  })

  test('places one answer below its selected question on narrow viewports with reduced motion', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(ROUTES.root)
    const faq = page.getByRole('region', { name: 'Antes de começar, tire suas dúvidas.' })
    for (const width of [390, 320]) {
      await page.setViewportSize({ width, height: 844 })
      const plan = faq.getByRole('button', {
        name: 'O que está incluído nos R$ 79,90/mês?',
        exact: true,
      })
      await plan.click()
      const answer = faq.getByRole('region', {
        name: 'O que está incluído nos R$ 79,90/mês?',
      })
      await expect(answer).toContainText('79,90')
      await expect(answer).toContainText(/ilimitad/)
      const planBounds = await plan.boundingBox()
      const answerBounds = await answer.boundingBox()
      const nextBounds = await faq
        .getByRole('button', { name: 'Posso cadastrar toda a minha equipe?' })
        .boundingBox()
      if (!planBounds || !answerBounds || !nextBounds) {
        throw new Error('FAQ question or answer has no visible bounds')
      }
      expect(answerBounds.y).toBeGreaterThanOrEqual(planBounds.y + planBounds.height)
      expect(answerBounds.y + answerBounds.height).toBeLessThanOrEqual(nextBounds.y)
      await expect(faq.getByRole('button')).toHaveCount(4)
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(width)
    }
  })
})

test.describe('LandingClosing', () => {
  test('keeps the final invitation readable and opens onboarding from the keyboard', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(ROUTES.root)
    const closing = page.getByRole('region', {
      name: 'Sua próxima venda pode ser mais organizada.',
      exact: true,
    })
    for (const width of [1440, 390, 320]) {
      await page.setViewportSize({ width, height: 900 })
      await closing.scrollIntoViewIfNeeded()
      if (width < 768) {
        await page.emulateMedia({ reducedMotion: 'no-preference' })
        await expect(closing).toHaveAttribute('data-animating', 'false')
        const stars = closing.locator('[data-closing-star-layer]').first()
        const pausedTransform = await stars.evaluate(
          (element) => getComputedStyle(element).transform,
        )
        await page.waitForTimeout(350)
        await expect(stars).toHaveCSS('transform', pausedTransform)
      }
      await expect(closing.getByRole('heading', { level: 2 })).toBeVisible()
      await expect(
        closing.getByText('14 dias grátis, sem cartão de crédito.'),
      ).toBeVisible()
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(width)
    }
    const trial = closing.getByRole('link', { name: 'Começar teste grátis', exact: true })
    await expect(trial).toHaveAttribute('href', ROUTES.onboarding)
    await trial.focus()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(ROUTES.onboarding)
    await expect(page.getByRole('heading', { name: 'Crie sua sorveteria' })).toBeVisible()
  })

  test('navigates to price and login and exposes the legal document routes', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(ROUTES.root)
    const footer = page.getByRole('contentinfo')
    await footer.scrollIntoViewIfNeeded()
    await expect(footer.getByRole('link')).toHaveCount(5)
    await expect(footer.getByRole('link', { name: 'Termos de uso' })).toHaveAttribute(
      'href',
      ROUTES.termsOfUse,
    )
    await expect(footer.getByRole('link', { name: 'Privacidade' })).toHaveAttribute(
      'href',
      ROUTES.privacyPolicy,
    )
    await footer.getByRole('link', { name: 'Preço', exact: true }).click()
    await expect(page).toHaveURL(/#landing-pricing-title$/)
    await expect(
      page.getByRole('heading', {
        name: 'Um plano. Sua sorveteria inteira conectada.',
        exact: true,
      }),
    ).toBeInViewport()
    await footer.getByRole('link', { name: 'Entrar', exact: true }).click()
    await expect(page).toHaveURL(ROUTES.login)
    await expect(page.getByRole('heading', { name: 'Entre no Scoops' })).toBeVisible()
  })
})
