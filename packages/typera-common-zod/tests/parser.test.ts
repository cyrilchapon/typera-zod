import { describe, it } from 'mocha'
import { assert } from 'chai'
import { body, query, cookies, headers } from '../src/parser.js'
import { z } from 'zod'
import { isMiddlewareResponse } from './_util.js'
import {
  MiddlewareResponse,
  MiddlewareResult,
} from 'typera-common/middleware.js'
import { Response } from 'typera-common'

type ReqMock = { theKey: { foo: string } }
const getFoo = (req: ReqMock) => req.theKey

/* eslint-disable @typescript-eslint/no-explicit-any */
describe('parser', () => {
  Object.entries({ query, body, headers, cookies }).forEach(
    ([methodName, method]) => {
      describe(methodName, () => {
        it(`should return Result when OK`, async () => {
          const schema = z.object({
            foo: z.literal('bar'),
          })
          const payload = { foo: 'bar' }
          const output = await (method as any)(getFoo)(schema)({
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
          const output = await (method as any)(getFoo)(schema)({
            theKey: payload,
          })
          assert.isTrue(isMiddlewareResponse(output))
          const outputResponse =
            output as unknown as MiddlewareResponse<Response.BadRequest>
          assert.property(outputResponse, 'response')
          assert.propertyVal(outputResponse.response, 'status', 400)
        })
      })
    },
  )
})
/* eslint-enable @typescript-eslint/no-explicit-any */
