import { describe, it } from 'mocha'
import { assert } from 'chai'
import { body, query, cookies, headers } from '../src/parser'
import { z } from 'zod'
import { isMiddlewareResponse } from './_util'
import { MiddlewareResponse, MiddlewareResult } from 'typera-common/middleware'
import { Response } from 'typera-common'
import { RequestBase } from 'typera-express'

type ReqPayloadMock = { foo: string }
type ReqMock<K extends string> = { [Key in K]: ReqPayloadMock }

/* eslint-disable @typescript-eslint/no-explicit-any */
describe('parser', () => {
  Object.entries({ query, body, cookies }).forEach(([methodName, method]) => {
    describe(methodName, () => {
      it(`should return Result when OK`, async () => {
        const schema = z.object({
          foo: z.literal('bar'),
        })
        const payload = { foo: 'bar' }
        const output = await (method as any)(schema)({
          req: { [methodName]: payload },
        })
        assert.isFalse(isMiddlewareResponse(output))
        const result = output as MiddlewareResult<ReqMock<typeof methodName>>
        assert.property(result, 'value')
        assert.property(result.value, methodName)
        assert.propertyVal(result.value[methodName], 'foo', 'bar')
      })

      it(`should return BadRequest when KO`, async () => {
        const schema = z.object({
          foo: z.literal('bar'),
        })
        const payload = { foo: 'BAR' }
        const output = await (method as any)(schema)({
          req: { [methodName]: payload },
        })
        assert.isTrue(isMiddlewareResponse(output))
        const outputResponse =
          output as unknown as MiddlewareResponse<Response.BadRequest>
        assert.property(outputResponse, 'response')
        assert.propertyVal(outputResponse.response, 'status', 400)
      })
    })
  })

  describe('headers', () => {
    it(`should return Result when OK`, async () => {
      const schema = z.object({
        foo: z.literal('bar'),
      })
      const payloadGetter = { get: () => 'bar' }
      const output = await headers<{ foo: string }>(schema)({
        req: payloadGetter,
      } as unknown as RequestBase)
      assert.isFalse(isMiddlewareResponse(output))
      const result = output as MiddlewareResult<ReqMock<'headers'>>
      assert.property(result, 'value')
      assert.property(result.value, 'headers')
      assert.propertyVal((result.value as any).headers, 'foo', 'bar')
    })

    it(`should return BadRequest when KO`, async () => {
      const schema = z.object({
        foo: z.literal('bar'),
      })
      const payloadGetter = { get: () => 'BAR' }
      const output = await headers<{ foo: string }>(schema)({
        req: payloadGetter,
      } as unknown as RequestBase)
      assert.isTrue(isMiddlewareResponse(output))
      const outputResponse =
        output as unknown as MiddlewareResponse<Response.BadRequest>
      assert.property(outputResponse, 'response')
      assert.propertyVal(outputResponse.response, 'status', 400)
    })
  })
})
/* eslint-enable @typescript-eslint/no-explicit-any */
