import { HTTP_STATUS_CODE } from '#shared/constants/http-status-code.ts'
import {
  AppError,
  BadRequestError,
  ConflictError,
  NotFoundError,
} from '#shared/domain/errors/index.ts'

type RestResponseProps<Body> = {
  body?: Body
  statusCode?: number
  errorMessage?: string
  headers?: Record<string, string>
}

export class RestResponse<Body = unknown> {
  private readonly _body: Body | null
  private readonly _errorMessage: string | null
  readonly statusCode: number = HTTP_STATUS_CODE.ok
  readonly headers: Record<string, string> = {}

  constructor({ body, statusCode, errorMessage, headers }: RestResponseProps<Body> = {}) {
    this._body = body ?? null
    this._errorMessage = errorMessage ?? null
    if (statusCode !== undefined) this.statusCode = statusCode
    if (headers) this.headers = { ...headers }
  }

  throwError(): never {
    const message = this._errorMessage ?? 'Rest Response failed'

    if (this.statusCode === HTTP_STATUS_CODE.notFound) throw new NotFoundError(message)

    if (this.statusCode === HTTP_STATUS_CODE.conflict) throw new ConflictError(message)

    if (this.statusCode === HTTP_STATUS_CODE.badRequest)
      throw new BadRequestError(message)

    throw new AppError(message)
  }

  get isSuccessful() {
    return (
      this.statusCode >= HTTP_STATUS_CODE.ok &&
      this.statusCode < HTTP_STATUS_CODE.multipleChoices
    )
  }

  get isFailure() {
    return this.statusCode >= HTTP_STATUS_CODE.badRequest || Boolean(this._errorMessage)
  }

  get isValidationFailure() {
    return this.statusCode === HTTP_STATUS_CODE.badRequest
  }

  getHeader(key: string) {
    return this.headers[key] ?? null
  }

  get body(): Body {
    if (this._errorMessage) {
      throw new AppError('Rest Response failed')
    }

    return this._body as Body
  }

  get errorMessage(): string {
    if (!this._errorMessage) {
      throw new AppError('Rest Response has no error message')
    }

    return this._errorMessage
  }

  get isRedirecting() {
    return (
      this.statusCode >= HTTP_STATUS_CODE.multipleChoices &&
      this.statusCode < HTTP_STATUS_CODE.badRequest &&
      this.getHeader('location') !== null
    )
  }
}
