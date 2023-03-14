import { Middleware, Response } from 'typera-common'
import { ZodError, ZodSchema } from 'zod'

export type ErrorHandler<ErrorResponse extends Response.Generic> = (
  errors: ZodError,
) => ErrorResponse

export const bodyP = <RequestBase>(getBody: GetInput<RequestBase>) =>
  genericP(getBody, 'body')

export const body = <RequestBase>(getBody: GetInput<RequestBase>) =>
  generic(getBody, 'body')

export const queryP = <RequestBase>(getQuery: GetInput<RequestBase>) =>
  genericP(getQuery, 'query')

export const query = <RequestBase>(getQuery: GetInput<RequestBase>) =>
  generic(getQuery, 'query')

export const headersP = <RequestBase>(
  getHeaders: GetInput<RequestBase>,
  cloneResult: boolean,
) => genericP(getHeaders, 'headers', cloneResult)

export const headers = <RequestBase>(
  getHeaders: GetInput<RequestBase>,
  cloneResult: boolean,
) => generic(getHeaders, 'headers', cloneResult)

export const cookiesP = <RequestBase>(getCookies: GetInput<RequestBase>) =>
  genericP(getCookies, 'cookies')

export const cookies = <RequestBase>(getCookies: GetInput<RequestBase>) =>
  generic(getCookies, 'cookies')

export type GetInput<RequestBase> = (req: RequestBase) => unknown

const genericP =
  <RequestBase, Key extends string>(
    input: GetInput<RequestBase>,
    key: Key,
    cloneResult = false,
  ) =>
  <ErrorResponse extends Response.Generic>(
    errorHandler: ErrorHandler<ErrorResponse>,
  ) =>
  <T>(
    codec: ZodSchema<T>,
  ): Middleware.Middleware<RequestBase, Record<Key, T>, ErrorResponse> =>
  (req: RequestBase) => {
    const parsed = codec.safeParse(input(req))

    if (!parsed.success) {
      return Middleware.stop(errorHandler(parsed.error))
    }

    /* eslint-disable @typescript-eslint/no-explicit-any */
    return Middleware.next({
      [key]: cloneResult ? { ...parsed.data } : parsed.data,
    } as any)
    /* eslint-enable @typescript-eslint/no-explicit-any */
  }

const generic =
  <RequestBase, Key extends string>(
    input: GetInput<RequestBase>,
    key: Key,
    cloneResult = false,
  ) =>
  <T>(
    codec: ZodSchema<T>,
  ): Middleware.Middleware<
    RequestBase,
    Record<Key, T>,
    Response.BadRequest<string>
  > =>
    genericP(
      input,
      key,
      cloneResult,
    )((err) => Response.badRequest(errorToString(key, err)))(codec)

const errorToString = <T>(key: string, err: ZodError<T>) => {
  return JSON.stringify({ type: key, error: err })
}
