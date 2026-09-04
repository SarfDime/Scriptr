'use client'

import Link from 'next/link'
import { useState } from 'react'

type ApiResourcePageProps = {
  title: string
  endpoint: string
  description: string
  search?: boolean
}

export function ApiResourcePage({
  title,
  endpoint,
  description,
  search = false,
}: ApiResourcePageProps) {
  const [query, setQuery] = useState('')
  const [response, setResponse] = useState<unknown>(null)
  const [status, setStatus] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const loadResource = async () => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787'
    const url = new URL(endpoint, baseUrl)

    if (search) {
      if (!query.trim()) {
        setError('Enter a search term first.')
        return
      }
      url.searchParams.set('q', query.trim())
    }

    setLoading(true)
    setError('')

    try {
      const result = await fetch(url)
      const contentType = result.headers.get('content-type') ?? ''
      const body = contentType.includes('application/json')
        ? await result.json()
        : await result.text()

      setStatus(result.status)
      setResponse(body)

      if (!result.ok) {
        setError(`Request failed with ${result.status}.`)
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to reach the API.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className='ui-section min-h-screen'>
      <div className='ui-container ui-stack gap-8'>
        <nav className='flex gap-4 text-sm'>
          <Link className='text-fg underline' href='/api-test'>
            API console
          </Link>
          <Link className='text-fg underline' href='/'>
            Home
          </Link>
        </nav>

        <header className='ui-stack gap-3'>
          <p className='text-fg text-sm uppercase tracking-widest'>Hono API</p>
          <h1 className='text-fg-700 text-4xl font-semibold'>{title}</h1>
          <p className='max-w-2xl text-fg leading-7'>{description}</p>
          <code className='text-fg'>GET {endpoint}</code>
        </header>

        <section className='ui-stack gap-4 rounded-xl border border-fg/20 bg-background-100 p-6'>
          {search ? (
            <label className='ui-stack gap-2' htmlFor='query'>
              <span className='text-fg-700 font-semibold'>Search term</span>
              <input
                className='rounded-lg border border-fg/30 bg-background-100 px-3 py-2 text-fg'
                id='query'
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') loadResource()
                }}
                placeholder='e.g. calculus'
                value={query}
              />
            </label>
          ) : null}
          <button
            className='solid w-fit rounded-lg bg-brand px-5 py-3 font-semibold text-background-100 disabled:cursor-not-allowed disabled:opacity-60'
            disabled={loading}
            onClick={loadResource}
            type='button'
          >
            {loading ? 'Loading...' : 'Load data'}
          </button>
        </section>

        <section className='ui-stack gap-3' aria-live='polite'>
          <div className='flex items-center gap-3'>
            <h2 className='text-fg-700 text-2xl font-semibold'>Response</h2>
            {status !== null ? (
              <span className='rounded-full border border-fg/20 px-3 py-1 text-sm text-fg'>
                HTTP {status}
              </span>
            ) : null}
          </div>
          {error ? <p className='text-error-red'>{error}</p> : null}
          <pre className='min-h-48 overflow-auto rounded-xl border border-fg/20 bg-fg-700 p-5 text-background-100 text-sm leading-6'>
            {response === null
              ? 'Load data to see the API response.'
              : JSON.stringify(response, null, 2)}
          </pre>
        </section>
      </div>
    </main>
  )
}
