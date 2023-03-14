import { describe, it } from 'mocha'
import { assert } from 'chai'
import { bodyP, queryP, cookiesP, headersP } from '../src/parser.js'
import { z } from 'zod'
import { isMiddlewareResponse } from './_util.js'
import {
  MiddlewareResponse,
  MiddlewareResult,
} from 'typera-common/middleware.js'

type ReqMock = { theKey: { foo: string } }
const getFoo = (req: ReqMock) => req.theKey

const errHandlerMock = () => 'test-error-text'

/* eslint-disable @typescript-eslint/no-explicit-any */
describe('advanced parser', () => {
  Object.entries({
    query: queryP,
    body: bodyP,
    headers: headersP,
    cookies: cookiesP,
  }).forEach(([methodName, method]) => {
    describe(methodName, () => {
      it(`should return Result when OK`, async () => {
        const schema = z.object({
          foo: z.literal('bar'),
        })
        const payload = { foo: 'bar' }
        const output = await (method as any)(getFoo)(errHandlerMock)(schema)({
          theKey: payload,
        })
        assert.isFalse(isMiddlewareResponse(output))
        const result = output as unknown as MiddlewareResult<ReqMock>
        assert.property(result, 'value')
        assert.property(result.value, methodName)
        assert.propertyVal((result.value as any)[methodName], 'foo', 'bar')
      })

      it(`should return BadRequest when KO`, async () => {
        const schema = z.object({
          foo: z.literal('bar'),
        })
        const payload = { foo: 'BAR' }
        const output = await (method as any)(getFoo)(errHandlerMock)(schema)({
          theKey: payload,
        })
        assert.isTrue(isMiddlewareResponse(output))
        const outputResponse = output as unknown as MiddlewareResponse<string>
        assert.propertyVal(outputResponse, 'response', 'test-error-text')
      })
    })
  })
})
/* eslint-enable @typescript-eslint/no-explicit-any */
