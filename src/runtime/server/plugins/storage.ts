import { defineNitroPlugin, useRuntimeConfig, useStorage } from 'nitropack/runtime'

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
        bucket: s3.bucket || 'dnsid',
        endpoint: s3.endpoint || 'https://sos-at-vie-2.exo.io',
        region: s3.region || 'at-vie-2',
        prefix: s3.prefix || 'openape-idp/',
      }))
      // eslint-disable-next-line no-console
      console.log('[openape-idp] Storage: S3 mounted')
    }
    catch (e) {
      console.error('[openape-idp] Failed to mount S3 storage:', e)
    }
  }
  else {
    const { default: fsDriver } = await import('unstorage/drivers/fs-lite')
    const storage = useStorage()
    const basePath = config.openapeIdp?.storagePath || './.data/openape-idp-db'
    storage.mount('db', fsDriver({ base: basePath }))
    // eslint-disable-next-line no-console
    console.log('[openape-idp] Storage: fsLite (default)')
  }
})
