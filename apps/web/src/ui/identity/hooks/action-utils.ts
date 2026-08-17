import { HTTP_STATUS_CODE } from '@scoops/core/shared/constants'
import type { RestResponse } from '@scoops/core/shared/responses/rest-response'

export const useActionUtils = () => {
  function ensureSuccessfulResponse<ResponseBody>(
    response: RestResponse<ResponseBody>,
  ): ResponseBody {
    if (
      response.statusCode < HTTP_STATUS_CODE.ok ||
      response.statusCode >= HTTP_STATUS_CODE.multipleChoices ||
      response.isFailure
    ) {
      response.throwError()
    }

    return response.body
  }

  function toActionError(error: unknown, fallback: string): Error {
    return error instanceof Error ? error : new Error(fallback)
  }

  return { ensureSuccessfulResponse, toActionError }
}
