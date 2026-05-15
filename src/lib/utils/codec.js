export async function compress(data) {
  const bytes = new TextEncoder().encode(JSON.stringify(data))
  const stream = new ReadableStream({
    start(c) {
      c.enqueue(bytes)
      c.close()
    }
  }).pipeThrough(new CompressionStream('deflate-raw'))
  const buf = await new Response(stream).arrayBuffer()
  let binary = ''
  for (const b of new Uint8Array(buf)) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

export async function decompress(encoded) {
  const b64 = encoded.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  const stream = new ReadableStream({
    start(c) {
      c.enqueue(bytes)
      c.close()
    }
  }).pipeThrough(new DecompressionStream('deflate-raw'))
  return JSON.parse(await new Response(stream).text())
}
