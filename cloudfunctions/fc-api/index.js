'use strict'

const http = require('node:http')
const { createApiHandler } = require('./lib/app')
const { createRuntime } = require('./lib/runtime')

const handler = createApiHandler(createRuntime())
const server = http.createServer((request, response) => {
  handler(request, response).catch((error) => {
    console.error(JSON.stringify({
      error: error instanceof Error ? error.message : String(error),
      message: 'unhandled fc-api request error',
    }))
    if (!response.headersSent) {
      response.writeHead(500, {
        'cache-control': 'no-store',
        'content-type': 'application/json; charset=utf-8',
      })
    }
    response.end(JSON.stringify({ ok: false, reason: 'server_error' }))
  })
})

server.listen(9000)
