'use strict'

const process = require('node:process')
const cloudbase = require('@cloudbase/node-sdk')
const {
  ServerSessionService,
  deriveSessionCsrfToken,
  verifySessionCsrfToken,
} = require('@yunlefun/server-session')
const { CloudBaseSessionStore } = require('@yunlefun/server-session-cloudbase')
const { SsoIdentityProofError, verifySsoIdentityProof } = require('@yunlefun/sso/server')
const { createFcRepository } = require('./repository')

const CLOUDBASE_ENV_ID = process.env.CLOUDBASE_ENV_ID || 'yunlefun-8g7ybcxc7345c490'
const SESSION_CSRF_SCOPE = 'fc-web'

function requiredSecret(name) {
  const value = process.env[name]
  if (!value || value.length < 32)
    throw new Error(`${name} must contain at least 32 characters`)
  return value
}

function positiveInteger(raw, fallback) {
  const value = Number(raw)
  return Number.isSafeInteger(value) && value > 0 ? value : fallback
}

function allowedOrigins() {
  const origins = (process.env.FC_ALLOWED_ORIGINS || 'https://fc.elpsy.cn')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean)
  if (!origins.length || origins.some((origin) => {
    try {
      return new URL(origin).origin !== origin
    }
    catch {
      return true
    }
  })) {
    throw new Error('FC_ALLOWED_ORIGINS must contain exact origins')
  }
  return Object.freeze(origins)
}

function createRuntime() {
  const database = cloudbase.init({ env: cloudbase.SYMBOL_CURRENT_ENV }).database()
  const csrfSecret = requiredSecret('FC_SESSION_CSRF_SECRET')
  const maximumSaves = positiveInteger(process.env.FC_MAX_CLOUD_SAVES, 20)
  const sessions = new ServerSessionService({
    store: new CloudBaseSessionStore({ database }),
    policy: {
      absoluteTtlMs: 30 * 24 * 60 * 60 * 1000,
      idleTtlMs: 7 * 24 * 60 * 60 * 1000,
      maxSessions: 5,
      rotationIntervalMs: 24 * 60 * 60 * 1000,
      touchIntervalMs: 15 * 60 * 1000,
    },
  })

  return {
    allowedOrigins: allowedOrigins(),
    deriveCsrfToken: token => deriveSessionCsrfToken(token, csrfSecret, SESSION_CSRF_SCOPE),
    maximumSaves,
    repository: createFcRepository(database, maximumSaves),
    sessions,
    verifyCsrfToken: (csrfToken, sessionToken) => verifySessionCsrfToken(
      csrfToken,
      sessionToken,
      csrfSecret,
      SESSION_CSRF_SCOPE,
    ),
    verifyIdentity: proof => verifySsoIdentityProof(proof, {
      appId: 'fc',
      clientId: 'fc-web',
      cloudbaseEnvId: CLOUDBASE_ENV_ID,
      issuer: 'https://www.yunle.fun',
      jwksUrl: 'https://api.yunle.fun/sso-ticket',
      requiredScope: 'identity:bootstrap',
    }),
    identityError: SsoIdentityProofError,
  }
}

module.exports = { createRuntime }
