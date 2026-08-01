import { proxyRequest } from './_proxy.js'

export function onRequest(context) {
  return proxyRequest(context)
}
