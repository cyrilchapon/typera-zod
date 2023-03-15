import { Middleware } from 'typera-common'

export const isMiddlewareResponse = <Result, Response>(
  v: Middleware.MiddlewareOutput<Result, Response>,
): v is Middleware.MiddlewareResponse<Response> => {
  return (
    Object.prototype.hasOwnProperty.call(v, 'response') &&
    !Object.prototype.hasOwnProperty.call(v, 'value')
  )
}
