export class ApiError extends Error {
  constructor(
    message: string,
    public fields: Record<string, string> = {}
  ) {
    super(message)
  }
}
export async function api<T>(
  url: string,
  method = 'GET',
  data?: unknown,
  headers: Record<string, string> = {}
): Promise<T> {
  const token = document.cookie
    .split('; ')
    .find((item) => item.startsWith('XSRF-TOKEN='))
    ?.slice(11)
  const response = await fetch(url, {
    method,
    credentials: 'same-origin',
    headers: {
      ...headers,
      Accept: 'application/json',
      ...(data === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { 'X-XSRF-TOKEN': decodeURIComponent(token) } : {}),
    },
    body: data === undefined ? undefined : JSON.stringify(data),
  })
  const result = await response.json().catch(() => ({}))
  if (!response.ok) {
    const fields: Record<string, string> = {}
    if (Array.isArray(result.errors))
      for (const error of result.errors) fields[error.field] = error.message
    throw new ApiError(
      result.error || result.message || 'The request could not be completed. Please try again.',
      fields
    )
  }
  return result as T
}
