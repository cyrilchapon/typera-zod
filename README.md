# @chimanos/typera-zod

**[Zod]** parser plugin for **[Typera]**.

— Just like native [`Parser`], but with *[Zod]* (instead of *io-ts*).

## Installation

The plugin is declined in its [Express] flavour only for now.

```shell
yarn add @chimanos/typera-express-zod
# or
npm install @chimanos/typera-express-zod
```

## Usage

```typescript
import { Parser, Response, Route, URL, route } from 'typera-express'
import { z, ZodSchema } from 'zod'
import { ZodParser } from '@chimanos/typera-express-zod'

interface User {
  id: number
  name: string
  age: number
}

// Partial User schema { name: string, age: number }
const userBodySchema = z.object({
    name: z.string(),
    age: z.number()
}).strict()

const updateUser: Route<
  Response.Ok<User> | Response.NotFound | Response.BadRequest<string>
> = route
  .put('/user/:id(int)')
  // Use userBodySchema to parse request body
  .use(ZodParser.body(userBodySchema))
  .handler(async (request) => {
    const user = await updateUserInDatabase(
      request.routeParams.id,
      // Fully typed from userBodySchema output !
      request.body
    )

    if (user === null) {
      return Response.notFound()
    }

    return Response.ok(user)
  })
```
## API Reference

### Classic parsers

`ZodParser` provides the 4 methods

- `query(schema)`
- `body(schema)`
- `headers(schema)`
- `cookies(schema)`

Each of them will
- validate the respective against a given [Zod Schema],
- and either
  - if OK return it through the relative `request.XXXX` key;
  - if KO early return a `400 Bad Request` error response

#### `query(schema)`

```typescript
ZodParser.query(schema)
```

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `T` | `Generic Type` | **Optional(inferred)**. The return type |
| `schema` | `ZodSchema<T>` | **Required**. The zod schema to validate against |

<details>
  <summary>Details</summary>
  Validate the query string according to the given [Zod] schema. Respond with `400 Bad Request` if the validation fails. The result will be available as `request.query` in the route handler.

  The input for this parser will be the query string parsed as `Record<string, string>`, i.e. all parameter values will be strings. If you want to convert them to other types, you will probably find the [`coerce`] method from Zod useful (e.g. `z.coerce.number()`, etc.)
</details>

#### `body(schema)`

```typescript
ZodParser.body(schema)
```

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `T` | `Generic Type` | **Optional(inferred)**. The return type |
| `schema` | `ZodSchema<T>` | **Required**. The zod schema to validate against |

<details>
  <summary>Details</summary>
  Validate the request body according to the given [Zod](https://github.com/colinhacks/zod) schema. Respond with `400 Bad Request` if the validation fails. The result will be available as `request.query` in the route handler.

  The input for this parser will be the request body, parsed with the body parser
of your choice. With [Express] you probably want to use [body-parser], and with
[Koa] the most common choice is [koa-bodyparser]. Note that these are native
[Express] or [Koa] middleware, so you must attach them directly to the [Express]
or [Koa] app rather than use them as typera middleware.
</details>

    ⚠️ You must use a Express or Koa body parsing middleware for
    `Parser.body` to work.

#### `headers(schema)`

```typescript
ZodParser.headers(schema)
```

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `T` | `Generic Type` | **Optional(inferred)**. The return type |
| `schema` | `ZodSchema<T>` | **Required**. The zod schema to validate against |

<details>
  <summary>Details</summary>
  Validate the request headers according to the given [Zod] schema. Respond with `400 Bad Request` if the validation fails. The result will be available as `request.query` in the route handler.

  Header matching is case-insensitive, so using e.g. `X-API-KEY`, `x-api-key` and
`X-Api-Key` in the codec will all read the same header. However, the parse
_result_ will of course be case sensitive. That is, the field in
`request.headers` will have the name you specify in the [io-ts] codec you pass
to `Parser.headers`, with case preserved.

  The input for this parser will be the headers parsed as `Record<string, string>`, i.e. all parameter values will be strings. If you want to convert them to other types, you will probably find the [`coerce`] method from Zod useful (e.g. `z.coerce.number()`, etc.)
  </details>

#### `cookies(schema)`

```typescript
ZodParser.cookies(schema)
```

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `T` | `Generic Type` | **Optional(inferred)**. The return type |
| `schema` | `ZodSchema<T>` | **Required**. The zod schema to validate against |

<details>
  <summary>Details</summary>
  Validate the request cookies according to the given [Zod] schema. Respond with `400 Bad Request` if the validation fails. The result will be available as `request.query` in the route handler.

  The input for this parser will be the cookies parsed as `Record<string, string>`, i.e. all parameter values will be strings. If you want to convert them to other types, you will probably find the [`coerce`] method from Zod useful (e.g. `z.coerce.number()`, etc.)
</details>

### Advanced parsers

Each of the above functions also have a `P` flavor that allows the user to override error handling. In addition to a [zod] schema, these functions take an error handler function that receives a `ZodError` and produces an `ErrorResponse`.

⚠️ Unlike native [typera] [`Parser`], those functions are **curryfied**, taking the error handler first, then the schema

#### `queryP(schema)`

```typescript
ZodParser.queryP(errorHandler)(schema)
```

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `T` | `Generic Type` | **Optional(inferred)**. The return type |
| `errorHandler` | `(ZodError) => ErrorResponse` | **Required(inferred)**. Error handler |
| `schema` | `ZodSchema<T>` | **Required**. The zod schema to validate against |

#### `bodyP(schema)`

```typescript
ZodParser.bodyP(errorHandler)(schema)
```

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `T` | `Generic Type` | **Optional(inferred)**. The return type |
| `errorHandler` | `(ZodError) => ErrorResponse` | **Required(inferred)**. Error handler |
| `schema` | `ZodSchema<T>` | **Required**. The zod schema to validate against |

#### `headersP(schema)`

```typescript
ZodParser.headersP(errorHandler)(schema)
```

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `T` | `Generic Type` | **Optional(inferred)**. The return type |
| `errorHandler` | `(ZodError) => ErrorResponse` | **Required(inferred)**. Error handler |
| `schema` | `ZodSchema<T>` | **Required**. The zod schema to validate against |

#### `cookiesP(schema)`

```typescript
ZodParser.cookiesP(errorHandler)(schema)
```

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `T` | `Generic Type` | **Optional(inferred)**. The return type |
| `errorHandler` | `(ZodError) => ErrorResponse` | **Required(inferred)**. Error handler |
| `schema` | `ZodSchema<T>` | **Required**. The zod schema to validate against |

[body-parser]: https://github.com/expressjs/body-parser
[express]: https://expressjs.com/
[koa]: https://koajs.com/
[koa-bodyparser]: https://github.com/koajs/bodyparser
[koa-mount]: https://github.com/koajs/mount
[Zod]: https://github.com/colinhacks/zod
[`coerce`]: https://github.com/colinhacks/zod#coercion-for-primitives
[Zod Schema]: https://github.com/colinhacks/zod#basic-usage
[Typera]: https://github.com/akheron/typera
[`Parser`]: https://akheron.github.io/typera/apiref/#request-parsers
