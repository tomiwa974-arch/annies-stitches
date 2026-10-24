import env from '#start/env'

export function browser() {
  const cookies = new Map<string, { name: string; value: string; path: string }>()
  let version: string | undefined
  const base = `http://${env.get('HOST')}:${env.get('PORT')}`
  return async (path: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers)
    if (headers.has('X-Inertia') && version) headers.set('X-Inertia-Version', version)
    const requestPath = path.split('?')[0]
    const applicable = [...cookies.values()]
      .filter(
        (cookie) =>
          requestPath === cookie.path ||
          requestPath.startsWith(cookie.path.endsWith('/') ? cookie.path : cookie.path + '/')
      )
      .sort((a, b) => b.path.length - a.path.length)
    headers.set('Cookie', applicable.map((cookie) => cookie.name + '=' + cookie.value).join('; '))
    headers.set('Referer', base + '/admin')
    const csrf = applicable.find((cookie) => cookie.name === 'XSRF-TOKEN')
    if (csrf) headers.set('X-XSRF-TOKEN', decodeURIComponent(csrf.value))
    const response = await fetch(base + path, { ...options, headers, redirect: 'manual' })
    for (const cookie of response.headers.getSetCookie()) {
      const first = cookie.split(';')[0],
        equals = first.indexOf('=')
      const name = first.slice(0, equals),
        cookiePath = cookie.match(/;\s*path=([^;]+)/i)?.[1] || '/'
      cookies.set(name + ':' + cookiePath, {
        name,
        value: first.slice(equals + 1),
        path: cookiePath,
      })
    }
    if (response.headers.get('Content-Type')?.includes('text/html')) {
      const html = await response.clone().text()
      version = html.match(/&quot;version&quot;:&quot;([^&]+)&quot;/)?.[1] || version
    }
    return response
  }
}
export function json(method: string, data: unknown, api = false): RequestInit {
  return {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Accept': api ? 'application/json' : 'text/html',
    },
    body: JSON.stringify(data),
  }
}
export async function page(client: ReturnType<typeof browser>, path: string) {
  const response = await client(path, {
    headers: { 'X-Inertia': 'true', 'Accept': 'application/json' },
  })
  if (response.status !== 200)
    throw new Error(
      `Expected ${path} to render; got ${response.status}: ${(await response.text()).slice(0, 300)}`
    )
  return (await response.json()) as { component: string; props: Record<string, any> }
}
