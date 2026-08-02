const GZIP_PREFIX = 'fc:gzip:v1:'

function bytesToBase64(bytes: Uint8Array): string {
  const chunkSize = 0x8000
  let binary = ''
  for (let offset = 0; offset < bytes.length; offset += chunkSize)
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize))
  return btoa(binary)
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index++)
    bytes[index] = binary.charCodeAt(index)
  return bytes
}

/**
 * 压缩云存档状态，避免大型 jsnes JSON 触发边缘网关请求体限制。
 * fflate 仅在用户首次上传云存档时加载，不进入首屏主包。
 */
export async function encodeCloudSaveState(state: string): Promise<string> {
  const { gzipSync, strToU8 } = await import('fflate')
  const encoded = `${GZIP_PREFIX}${bytesToBase64(gzipSync(strToU8(state), { level: 6 }))}`
  return encoded.length < state.length ? encoded : state
}

/** 解码新版压缩存档；无前缀时保持兼容已有明文 JSON 存档。 */
export async function decodeCloudSaveState(state: string): Promise<string> {
  if (!state.startsWith(GZIP_PREFIX))
    return state
  const { gunzipSync, strFromU8 } = await import('fflate')
  return strFromU8(gunzipSync(base64ToBytes(state.slice(GZIP_PREFIX.length))))
}
