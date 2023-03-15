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

### Basic

```typescript
import { Parser, Response, Route, URL, route } from 'typera-express'
import { z, ZodSchema, ZodFormattedError } from 'zod'
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
  | Response.Ok<User>
  | Response.NotFound
  | Response.BadRequest<ZodFormattedError<User>>
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

Just like your usual native [Typera].[`Parser`], but with a [Zod] schema — instead of io-ts codec.

### Extended Zod features

#### Coercion

`ZodParser` is compatible with most [Zod] features, including [`coerce`] and extended methods (like `min(n)` or `email()` for example).

— Particularly useful when decoding query strings

```typescript
const querySchema = z.object({
  limit: z.coerce.number().min(0).max(50)
  skip: z.coerce.number().min(0).optional()
})

route
// ...
  .use(ZodParser.query(querySchema))
// ...
```

#### DTO Typings

If you want to extract your payloads typings for external usage, just use [Zod] [`z.infer`] method.

```typescript
const userBodySchema = z.object({
    name: z.string(),
    age: z.number()
}).strict()

type UserBodyPayload = z.infer<typeof userBodySchema>

// ...
```

#### Error handling

By default, when encountering an validation error, ZodParser produces a response of type :
```typescript
Response.BadRequest<ZodFormattedError<T>>
```
— with T being the the underlying type of the given schema (`ZodSchema<T>`) and `ZodFormattedError` being the return type of [`zodError.format()`].

If you'd prefer to [`zodError.flatten()`] errors, you can do so by instanciating a custom parser, like so :

```typescript
// FlattenedError Type
import { typeToFlattenedError } from 'zod'

const userBodySchema = z.object({
    name: z.string(),
    age: z.number()
}).strict()

const updateUser: Route<
  // ...
  | Response.BadRequest<typeToFlattenedError<User>>
> = route
  // ...
  .use(ZodParser.bodyP(
    userBodySchema,
    // Flatten error and return it into 400
    (err) => Response.BadRequest(err.flatten())
  ))
  // ...
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

#### `queryP(schema, errorHandler)`

```typescript
ZodParser.queryP(schema, errorHandler)
```

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `T` | `Generic Type` | **Optional(inferred)**. The return type |
| `ErrorT` | `Generic Type` | **Optional(inferred)**. The generated error type |
| `errorHandler` | `(ZodError) => Response<number, ErrorT>` | **Required(inferred)**. Error handler |
| `schema` | `ZodSchema<T>` | **Required**. The zod schema to validate against |

#### `bodyP(schema, errorHandler)`

```typescript
ZodParser.bodyP(schema, errorHandler)
```

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `T` | `Generic Type` | **Optional(inferred)**. The return type |
| `ErrorT` | `Generic Type` | **Optional(inferred)**. The generated error type |
| `errorHandler` | `(ZodError) => Response<number, ErrorT>` | **Required(inferred)**. Error handler |
| `schema` | `ZodSchema<T>` | **Required**. The zod schema to validate against |

#### `headersP(schema, errorHandler)`

```typescript
ZodParser.headersP(schema, errorHandler)
```

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `T` | `Generic Type` | **Optional(inferred)**. The return type |
| `ErrorT` | `Generic Type` | **Optional(inferred)**. The generated error type |
| `errorHandler` | `(ZodError) => Response<number, ErrorT>` | **Required(inferred)**. Error handler |
| `schema` | `ZodSchema<T>` | **Required**. The zod schema to validate against |

#### `cookiesP(schema, errorHandler)`

```typescript
ZodParser.cookiesP(schema, errorHandler)
```

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `T` | `Generic Type` | **Optional(inferred)**. The return type |
| `ErrorT` | `Generic Type` | **Optional(inferred)**. The generated error type |
| `errorHandler` | `(ZodError) => Response<number, ErrorT>` | **Required(inferred)**. Error handler |
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
[`zodError.format()`]: https://zod.dev/ERROR_HANDLING?id=formatting-errors
[`zodError.flatten()`]: https://zod.dev/ERROR_HANDLING?id=flattening-errors
