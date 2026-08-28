import { useEffect, useMemo, useRef, useState } from 'react'

import { HTTP_STATUS_CODE } from '@scoops/core/shared/constants'
import type {
  Cart,
  CartLineInput,
  OrderDetails,
  OrderPreviewInput,
  OrderRegistrationInput,
  OrderRegistrationResult,
  SalesCatalogProduct,
} from '@scoops/core/pdv/domain/structures'
import type { RestResponse } from '@scoops/core/shared/responses/rest-response'

import { useActiveSalesChannelsQuery } from '@/ui/pdv/hooks/use-active-sales-channels-query'
import { usePreviewOrderAction } from '@/ui/pdv/hooks/use-preview-order-action'
import { useRegisterOrderAction } from '@/ui/pdv/hooks/use-register-order-action'
import { useAuthContext } from '@/ui/shared/hooks/use-auth-context'

import { newSaleCartStorage } from './new-sale-cart-storage'
type RegistrationFeedback = 'invalid-token' | 'rollback' | 'verification' | undefined

export function useNewSalePage() {
  const { account } = useAuthContext()
  const establishmentId = account?.establishmentId
  const [lineInputs, setLineInputs] = useState<readonly CartLineInput[]>([])
  const [productsById, setProductsById] = useState<Record<string, SalesCatalogProduct>>(
    {},
  )
  const [selectedProduct, setSelectedProduct] = useState<SalesCatalogProduct>()
  const [editingLine, setEditingLine] = useState<CartLineInput>()
  const [channelId, setChannelId] = useState<string>()
  const [previewCart, setPreviewCart] = useState<Cart>()
  const [previewToken, setPreviewToken] = useState<string>()
  const [idempotencyKey, setIdempotencyKey] = useState<string>()
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false)
  const [registrationResult, setRegistrationResult] = useState<OrderRegistrationResult>()
  const [registeredOrder, setRegisteredOrder] = useState<OrderDetails>()
  const [registrationFeedback, setRegistrationFeedback] = useState<RegistrationFeedback>()
  const [previewError, setPreviewError] = useState<string>()
  const [registrationError, setRegistrationError] = useState<string>()
  const [refreshNonce, setRefreshNonce] = useState(0)
  const restoredCartEstablishmentRef = useRef<string | undefined>(undefined)
  const registrationRequestRef = useRef<OrderRegistrationInput | undefined>(undefined)
  const replayAttemptedRef = useRef(false)
  const {
    activeSalesChannels,
    isActiveSalesChannelsError,
    isLoadingActiveSalesChannels,
  } = useActiveSalesChannelsQuery()
  const previewAction = usePreviewOrderAction()
  const registrationAction = useRegisterOrderAction()
  const catalogProducts = useMemo(() => Object.values(productsById), [productsById])
  const previewRequest = useMemo(
    () => ({
      request: {
        ...(channelId ? { channelId } : {}),
        lines: toPreviewLines(lineInputs),
      },
      version: refreshNonce,
    }),
    [channelId, lineInputs, refreshNonce],
  )

  useEffect(() => {
    if (restoredCartEstablishmentRef.current !== establishmentId) return
    if (lineInputs.length === 0) return

    newSaleCartStorage.save(establishmentId, {
      version: 1,
      lineInputs,
      products: Object.values(productsById),
      ...(channelId ? { channelId } : {}),
    })
  }, [channelId, establishmentId, lineInputs, productsById])

  useEffect(() => {
    if (!establishmentId) {
      restoredCartEstablishmentRef.current = undefined
      setLineInputs([])
      setProductsById({})
      setChannelId(undefined)
      return
    }

    const storedCart = newSaleCartStorage.load(establishmentId)
    restoredCartEstablishmentRef.current = establishmentId
    setLineInputs(storedCart?.lineInputs ?? [])
    setProductsById(
      Object.fromEntries(
        (storedCart?.products ?? []).map((product) => [product.productId, product]),
      ),
    )
    setChannelId(storedCart?.channelId)
  }, [establishmentId])

  useEffect(() => {
    if (lineInputs.length === 0) {
      setPreviewCart(undefined)
      setPreviewToken(undefined)
      setPreviewError(undefined)
      return
    }

    let isCancelled = false
    const request = previewRequest.request
    setPreviewCart(undefined)
    setPreviewToken(undefined)
    setPreviewError(undefined)

    async function refreshPreview() {
      try {
        const result = await previewAction.previewOrder(request)
        if (isCancelled) return
        if (result.response.isFailure) {
          setPreviewError(
            getResponseMessage(
              result.response,
              'Não foi possível atualizar os valores do pedido.',
            ),
          )
          return
        }
        setPreviewCart(result.response.body.cart)
        setPreviewToken(result.response.body.previewToken)
      } catch (caught) {
        if (isCancelled) return
        setPreviewError(
          caught instanceof Error
            ? caught.message
            : 'Não foi possível atualizar os valores do pedido.',
        )
      }
    }

    void refreshPreview()
    return () => {
      isCancelled = true
    }
  }, [lineInputs, previewAction.previewOrder, previewRequest])

  function handleSelectProduct(product: SalesCatalogProduct) {
    setProductsById((currentProducts) => ({
      ...currentProducts,
      [product.productId]: product,
    }))
    setSelectedProduct(product)
    setEditingLine(undefined)
  }

  function handleEditLine(line: CartLineInput, product: SalesCatalogProduct | undefined) {
    if (!product) return
    setProductsById((currentProducts) => ({
      ...currentProducts,
      [product.productId]: product,
    }))
    setSelectedProduct(product)
    setEditingLine(line)
  }

  function handleDialogOpenChange(open: boolean) {
    if (!open) {
      setSelectedProduct(undefined)
      setEditingLine(undefined)
    }
  }

  function handleSaveLine(line: CartLineInput) {
    setLineInputs((currentLines) => {
      const existingLine = currentLines.some(
        (currentLine) => currentLine.productId === line.productId,
      )
      if (!existingLine) return [...currentLines, line]
      return currentLines.map((currentLine) =>
        currentLine.productId === line.productId ? line : currentLine,
      )
    })
    startNewRegistrationRequest()
    setSelectedProduct(undefined)
    setEditingLine(undefined)
  }

  function handleRemoveLine(productId: string) {
    if (lineInputs.length === 1 && lineInputs[0]?.productId === productId) {
      newSaleCartStorage.clear(establishmentId)
    }
    setLineInputs((currentLines) =>
      currentLines.filter((line) => line.productId !== productId),
    )
    startNewRegistrationRequest()
    setRegistrationResult(undefined)
  }

  function handleQuantityChange(productId: string, quantity: number) {
    if (quantity < 1 || quantity > 999) return
    setLineInputs((currentLines) =>
      currentLines.map((line) =>
        line.productId === productId ? { ...line, quantity } : line,
      ),
    )
    startNewRegistrationRequest()
    setRegistrationResult(undefined)
  }

  function handleClear() {
    newSaleCartStorage.clear(establishmentId)
    setLineInputs([])
    setPreviewCart(undefined)
    setPreviewToken(undefined)
    setIdempotencyKey(undefined)
    registrationRequestRef.current = undefined
    setRegistrationResult(undefined)
    setPreviewError(undefined)
  }

  function handleChannelChange(nextChannelId: string | undefined) {
    setChannelId(nextChannelId)
    startNewRegistrationRequest()
  }

  function handleRegister() {
    if (!previewCart || !previewToken || lineInputs.length === 0) return
    setRegistrationError(undefined)
    setRegistrationFeedback(undefined)
    setIsRegistrationOpen(true)
  }

  async function handleConfirmRegistration() {
    const request = createRegistrationRequest()
    if (!request) return
    registrationRequestRef.current = request
    replayAttemptedRef.current = false
    setRegistrationError(undefined)
    try {
      const result = await registrationAction.registerOrder(request)
      await handleRegistrationResponse(result.response, request)
    } catch (caught) {
      setIsRegistrationOpen(false)
      setRegistrationError(
        caught instanceof Error
          ? caught.message
          : 'Não foi possível registrar o pedido. Tente novamente.',
      )
    }
  }

  async function replayRegistration(request: OrderRegistrationInput) {
    try {
      const result = await registrationAction.registerOrder(request)
      await handleRegistrationResponse(result.response, request)
    } catch (caught) {
      setRegistrationFeedback(undefined)
      setRegistrationError(
        caught instanceof Error
          ? caught.message
          : 'Não foi possível confirmar o registro. Tente novamente.',
      )
    }
  }

  async function handleRegistrationResponse(
    response: RestResponse<OrderRegistrationResult>,
    request: OrderRegistrationInput,
  ) {
    if (!response.statusCode) {
      setIsRegistrationOpen(false)
      setRegistrationFeedback('verification')
      if (!replayAttemptedRef.current) {
        replayAttemptedRef.current = true
        await replayRegistration(request)
      }
      return
    }

    if (
      response.statusCode >= HTTP_STATUS_CODE.internalServerError &&
      response.statusCode <= HTTP_STATUS_CODE.networkAuthenticationRequired
    ) {
      setIsRegistrationOpen(false)
      setRegistrationFeedback('rollback')
      return
    }

    if (response.statusCode === HTTP_STATUS_CODE.badRequest) {
      setIsRegistrationOpen(false)
      setRegistrationFeedback('invalid-token')
      setPreviewToken(undefined)
      return
    }

    if (response.statusCode === HTTP_STATUS_CODE.conflict) {
      const result = readResponseBody(response)
      if (result && result.kind !== 'registered') {
        if (result.kind === 'repriced') {
          setLineInputs(result.recalculatedCart.lines.map(toCartLineInput))
          setPreviewCart(result.recalculatedCart)
          setPreviewToken(result.previewToken)
          startNewRegistrationRequest()
        }
        setIsRegistrationOpen(false)
        setRegistrationResult(result)
        setRegistrationFeedback(undefined)
        return
      }
    }

    if (response.isFailure) {
      setIsRegistrationOpen(false)
      setRegistrationError(
        getResponseMessage(response, 'Não foi possível registrar o pedido.'),
      )
      return
    }

    const result = response.body
    if (result.kind === 'registered') {
      newSaleCartStorage.clear(establishmentId)
      setRegisteredOrder(result.order)
      setRegistrationResult(undefined)
      setIsRegistrationOpen(false)
      setLineInputs([])
      setPreviewCart(undefined)
      setPreviewToken(undefined)
      setIdempotencyKey(undefined)
      setRegistrationFeedback(undefined)
      return
    }

    if (result.kind === 'repriced') {
      setLineInputs(result.recalculatedCart.lines.map(toCartLineInput))
      setPreviewCart(result.recalculatedCart)
      setPreviewToken(result.previewToken)
      startNewRegistrationRequest()
    }
    setIsRegistrationOpen(false)
    setRegistrationResult(result)
    setRegistrationFeedback(undefined)
  }

  function createRegistrationRequest(): OrderRegistrationInput | undefined {
    if (!previewToken || lineInputs.length === 0) return undefined
    const key = idempotencyKey ?? createIdempotencyKey()
    setIdempotencyKey(key)
    return {
      ...(channelId ? { channelId } : {}),
      idempotencyKey: key,
      lines: toPreviewLines(lineInputs),
      previewToken,
    }
  }

  function handleFeedbackAction() {
    const shouldReconfirm = registrationResult?.kind === 'repriced'
    setRegistrationResult(undefined)
    setRegistrationFeedback(undefined)
    setIsRegistrationOpen(shouldReconfirm)
  }

  function handleRefreshPreview() {
    setRegistrationFeedback(undefined)
    setPreviewError(undefined)
    startNewRegistrationRequest()
    setRefreshNonce((currentNonce) => currentNonce + 1)
  }

  function handleRetryRegistration() {
    const request = registrationRequestRef.current
    if (!request) return
    setRegistrationError(undefined)
    setRegistrationFeedback('verification')
    void replayRegistration(request)
  }

  function handleNewSale() {
    setRegisteredOrder(undefined)
    handleClear()
  }

  function startNewRegistrationRequest() {
    registrationRequestRef.current = undefined
    setIdempotencyKey(createIdempotencyKey())
  }

  return {
    activeSalesChannels,
    catalogProducts,
    channelId,
    editingLine,
    handleChannelChange,
    handleClear,
    handleConfirmRegistration,
    handleDialogOpenChange,
    handleEditLine,
    handleFeedbackAction,
    handleNewSale,
    handleRefreshPreview,
    handleRegister,
    handleRemoveLine,
    handleQuantityChange,
    handleRetryRegistration,
    handleSaveLine,
    handleSelectProduct,
    idempotencyKey,
    isActiveSalesChannelsError,
    isLoadingActiveSalesChannels,
    isPreviewPending: previewAction.isPending,
    isRegistrationOpen,
    isRegistrationPending: registrationAction.isPending,
    isVerification: registrationFeedback === 'verification',
    lineInputs,
    previewCart,
    previewError,
    previewToken,
    registeredOrder,
    registrationError,
    registrationResult,
    registrationFeedback,
    selectedProduct,
  }
}

function createIdempotencyKey() {
  return globalThis.crypto?.randomUUID?.() ?? '00000000-0000-4000-8000-000000000001'
}

function toCartLineInput(line: Cart['lines'][number]): CartLineInput {
  return {
    accompanimentIds: line.accompanimentIds,
    ...(line.brandId ? { brandId: line.brandId } : {}),
    kind: line.kind,
    productId: line.productId,
    quantity: line.quantity,
    ...(line.sizeId ? { sizeId: line.sizeId } : {}),
  }
}

function toPreviewLines(lines: readonly CartLineInput[]): OrderPreviewInput['lines'] {
  return lines.map((line) =>
    line.kind === 'portion'
      ? {
          accompanimentIds: line.accompanimentIds,
          kind: 'portion',
          productId: line.productId,
          quantity: line.quantity,
          sizeId: line.sizeId ?? '',
        }
      : {
          ...(line.brandId ? { brandId: line.brandId } : {}),
          kind: 'resale',
          productId: line.productId,
          quantity: line.quantity,
        },
  )
}

function getResponseMessage<ResponseBody>(
  response: RestResponse<ResponseBody>,
  fallback: string,
) {
  try {
    return response.errorMessage || fallback
  } catch {
    return fallback
  }
}

function readResponseBody(
  response: RestResponse<OrderRegistrationResult>,
): OrderRegistrationResult | undefined {
  try {
    return response.body
  } catch {
    const privateResponse = response as unknown as {
      _body?: OrderRegistrationResult
    }
    return privateResponse._body
  }
}
