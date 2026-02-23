import { defineNuxtModule, createResolver, addServerHandler, addImportsDir, addServerImportsDir, addServerPlugin, extendPages } from '@nuxt/kit'
import { defu } from 'defu'

export interface ModuleOptions {
  sessionSecret: string
  managementToken: string
  adminEmails: string
  storageDriver: string
  storagePath: string
  issuer: string
  s3: {
    accessKeyId: string
    secretAccessKey: string
    bucket: string
    endpoint: string
    region: string
    prefix: string
  }
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: '@openape/nuxt-auth-idp',
    configKey: 'openapeIdp',
  },
  defaults: {
    sessionSecret: 'change-me-to-a-real-secret-at-least-32-chars',
    managementToken: '',
    adminEmails: '',
    storageDriver: '',
    storagePath: './.data/openape-idp-db',
    issuer: '',
    s3: {
      accessKeyId: '',
      secretAccessKey: '',
      bucket: 'dnsid',
      endpoint: 'https://sos-at-vie-2.exo.io',
      region: 'at-vie-2',
      prefix: 'openape-idp/',
    },
  },
  setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url)

    // Inject runtime config
    nuxt.options.runtimeConfig.openapeIdp = defu(
      nuxt.options.runtimeConfig.openapeIdp as Record<string, unknown> || {},
      options,
    )

    // Register server plugin (storage mount)
    addServerPlugin(resolve('./runtime/server/plugins/storage'))

    // Register server utils (auto-imported by Nitro)
    addServerImportsDir(resolve('./runtime/server/utils'))

    // Register composables (auto-imported by Vue)
    addImportsDir(resolve('./runtime/composables'))

    // CORS rules
    nuxt.options.routeRules = defu(nuxt.options.routeRules || {}, {
      '/.well-known/**': { cors: true },
      '/token': { cors: true },
    })

    // Pages (overridable by the consuming app)
    extendPages((pages) => {
      // Only add module pages if the app doesn't already define them
      const hasLogin = pages.some(p => p.path === '/login')
      if (!hasLogin) {
        pages.push({
          name: 'openape-login',
          path: '/login',
          file: resolve('./runtime/pages/login.vue'),
        })
      }

      const hasAdmin = pages.some(p => p.path === '/admin')
      if (!hasAdmin) {
        pages.push({
          name: 'openape-admin',
          path: '/admin',
          file: resolve('./runtime/pages/admin.vue'),
        })
      }
    })

    // Server route handlers — Auth
    addServerHandler({ route: '/api/login', method: 'post', handler: resolve('./runtime/server/api/login.post') })
    addServerHandler({ route: '/api/logout', method: 'post', handler: resolve('./runtime/server/api/logout.post') })
    addServerHandler({ route: '/api/me', handler: resolve('./runtime/server/api/me.get') })

    // Server route handlers — OAuth
    addServerHandler({ route: '/authorize', handler: resolve('./runtime/server/routes/authorize.get') })
    addServerHandler({ route: '/token', method: 'post', handler: resolve('./runtime/server/routes/token.post') })
    addServerHandler({ route: '/.well-known/jwks.json', handler: resolve('./runtime/server/routes/well-known/jwks.json.get') })

    // Server route handlers — Admin Users
    addServerHandler({ route: '/api/admin/users', handler: resolve('./runtime/server/api/admin/users/index.get') })
    addServerHandler({ route: '/api/admin/users', method: 'post', handler: resolve('./runtime/server/api/admin/users/index.post') })
    addServerHandler({ route: '/api/admin/users/:email', method: 'delete', handler: resolve('./runtime/server/api/admin/users/[email].delete') })

    // Server route handlers — Admin Agents
    addServerHandler({ route: '/api/admin/agents', handler: resolve('./runtime/server/api/admin/agents/index.get') })
    addServerHandler({ route: '/api/admin/agents', method: 'post', handler: resolve('./runtime/server/api/admin/agents/index.post') })
    addServerHandler({ route: '/api/admin/agents/:id', handler: resolve('./runtime/server/api/admin/agents/[id].get') })
    addServerHandler({ route: '/api/admin/agents/:id', method: 'put', handler: resolve('./runtime/server/api/admin/agents/[id].put') })
    addServerHandler({ route: '/api/admin/agents/:id', method: 'delete', handler: resolve('./runtime/server/api/admin/agents/[id].delete') })
  },
})
