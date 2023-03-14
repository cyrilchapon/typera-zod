import { ZodParser as CommonZodParser } from '@chimanos/typera-common-zod'
import { Response } from 'typera-common'
import { RequestBase } from 'typera-express'

export type ErrorHandler<ErrorResponse extends Response.Generic> =
  CommonZodParser.ErrorHandler<ErrorResponse>

const getBody: CommonZodParser.GetInput<RequestBase> = (e) => {
  return e.req.body
}
export const bodyP = CommonZodParser.bodyP(getBody)
export const body = CommonZodParser.body(getBody)

const getQuery: CommonZodParser.GetInput<RequestBase> = (e) => {
  return e.req.query
}
export const queryP = CommonZodParser.queryP(getQuery)
export const query = CommonZodParser.query(getQuery)

const getHeaders: CommonZodParser.GetInput<RequestBase> = (e) => {
  const keys: Set<string> = new Set()
  return new Proxy(e.req, {
    get: (target, field) => {
      if (typeof field === 'string') {
        const value = target.get(field)
        if (value !== undefined) keys.add(field)
        return value
      }
      return undefined
    },
    getOwnPropertyDescriptor() {
      return {
        enumerable: true,
        configurable: true,
      }
    },
    ownKeys: () => [...keys],
  })
}
export const headersP = CommonZodParser.headersP(getHeaders, true)
export const headers = CommonZodParser.headers(getHeaders, true)

const getCookies: CommonZodParser.GetInput<RequestBase> = (e) => {
  return e.req.cookies
}
export const cookiesP = CommonZodParser.cookiesP(getCookies)
export const cookies = CommonZodParser.cookies(getCookies)
