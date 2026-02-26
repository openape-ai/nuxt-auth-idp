import { useRuntimeConfig, useStorage } from 'nitropack/runtime'

export function getStoragePrefix(): string {
  const config = useRuntimeConfig()
  const idpConfig = config.openapeIdp as {
    storagePrefix?: string
    issuer?: string
  } | undefined

  if (idpConfig?.storagePrefix?.trim()) {
    return idpConfig.storagePrefix.trim()
  }

  const issuerStr = idpConfig?.issuer?.trim()
    || process.env.NUXT_PUBLIC_SITE_URL?.trim()
    || ''

  if (issuerStr) {
    try {
      return new URL(issuerStr).hostname
    }
    catch {
      // malformed URL → fallback
    }
  }

  return 'localhost'
}

export const useAppStorage = () => useStorage(`db:${getStoragePrefix()}`)
