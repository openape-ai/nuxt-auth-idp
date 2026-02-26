import { defineNitroPlugin, useRuntimeConfig, useStorage } from 'nitropack/runtime'
import { getStoragePrefix } from '../utils/storage'

export default defineNitroPlugin(async () => {
  const config = useRuntimeConfig()
  const driver = (config.openapeIdp?.storageDriver || '').trim()

  if (driver === 's3' && config.openapeIdp?.s3?.accessKeyId) {
    try {
      const { default: s3Driver } = await import('unstorage/drivers/s3')
      const storage = useStorage()
      const s3 = config.openapeIdp.s3
      storage.mount('db', s3Driver({
        accessKeyId: s3.accessKeyId,
        secretAccessKey: s3.secretAccessKey,
        bucket: s3.bucket,
        endpoint: s3.endpoint,
        region: s3.region,
        prefix: s3.prefix,
      }))
      // eslint-disable-next-line no-console
      console.log('[openape-idp] Storage: S3 mounted')
    }
    catch (e) {
      console.error('[openape-idp] CRITICAL: Failed to mount S3 storage:', e)
      console.error('[openape-idp] Falling back to filesystem storage. WARNING: Data will be lost on serverless platforms!')
      const { default: fsDriver } = await import('unstorage/drivers/fs-lite')
      const storage = useStorage()
      const basePath = config.openapeIdp?.storagePath || './.data/openape-idp-db'
      storage.mount('db', fsDriver({ base: basePath }))
    }
  }
  else if (!import.meta.dev) {
    // Production without S3 config → fsLite (e.g. VPS deployment)
    const { default: fsDriver } = await import('unstorage/drivers/fs-lite')
    const storage = useStorage()
    const basePath = config.openapeIdp?.storagePath || './.data/openape-idp-db'
    storage.mount('db', fsDriver({ base: basePath }))
    // eslint-disable-next-line no-console
    console.log('[openape-idp] Storage: fsLite (default)')
  }
  else {
    // Dev mode: devStorage already mounted 'db' via module config
    // eslint-disable-next-line no-console
    console.log('[openape-idp] Storage: devStorage (local filesystem)')
  }

  // eslint-disable-next-line no-console
  console.log(`[openape-idp] Storage prefix: ${getStoragePrefix()}`)
})
