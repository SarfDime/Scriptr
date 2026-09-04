'use client'

import Link from 'next/link'
import { useState } from 'react'

type EndpointKey =
  | 'health'
  | 'universities'
  | 'professors'
  | 'subjects'
  | 'scripts'
  | 'search'

type Endpoint = {
  label: string
  path: string
  method?: 'GET'
}

const endpoints: Record<EndpointKey, Endpoint> = {
  health: { label: 'Health check', path: '/' },
  universities: { label: 'Universities', path: '/api/universities' },
  professors: { label: 'Professors', path: '/api/professors' },
  subjects: { label: 'Subjects', path: '/api/subjects' },
  scripts: { label: 'Scripts', path: '/api/scripts' },
  search: { label: 'Search scripts', path: '/api/scripts/search' },
}

export function ApiTester() {
  const [selectedEndpoint, setSelectedEndpoint] =
    useState<EndpointKey>('health')
  const [search, setSearch] = useState('')
  const [response, setResponse] = useState<unknown>(null)
  const [status, setStatus] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const resourceLinks = [
    ['Universities', '/universities'],
    ['Faculties', '/faculties'],
    ['Professors', '/professors'],
    ['Subjects', '/subjects'],
    ['Scripts', '/scripts'],
    ['Search scripts', '/scripts/search'],
  ] as const

  const runRequest = async () => {
    const endpoint = endpoints[selectedEndpoint]
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787'
    const url = new URL(endpoint.path, baseUrl)

    if (selectedEndpoint === 'search') {
      if (!search.trim()) {
        setError('Enter a search term first.')
        return
      }
      url.searchParams.set('q', search.trim())
    }

    setLoading(true)
    setError('')
    setResponse(null)
    setStatus(null)

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
        <nav className='flex flex-wrap gap-4 text-sm'>
          <Link className='text-fg underline' href='/auth'>
            Auth
          </Link>
          {resourceLinks.map(([label, href]) => (
            <Link className='text-fg underline' href={href} key={href}>
              {label}
            </Link>
          ))}
        </nav>
        <header className='ui-stack gap-3'>
          <p className='text-fg text-sm uppercase tracking-widest'>
            Scriptr API
          </p>
          <h1 className='text-fg-700 text-4xl font-semibold'>
            API test console
          </h1>
          <p className='max-w-2xl text-fg leading-7'>
            Run public Hono requests and inspect the response directly from the
            Next app.
          </p>
        </header>

        <section className='ui-stack gap-4 rounded-xl border border-fg/20 bg-background-100 p-6'>
          <label className='ui-stack gap-2' htmlFor='endpoint'>
            <span className='text-fg-700 font-semibold'>Endpoint</span>
            <select
              className='rounded-lg border border-fg/30 bg-background-100 px-3 py-2 text-fg'
              id='endpoint'
              onChange={(event) => {
                setSelectedEndpoint(event.target.value as EndpointKey)
                setResponse(null)
                setError('')
              }}
              value={selectedEndpoint}
            >
              {Object.entries(endpoints).map(([key, endpoint]) => (
                <option key={key} value={key}>
                  {endpoint.label} ({endpoint.path})
                </option>
              ))}
            </select>
          </label>

          {selectedEndpoint === 'search' ? (
            <label className='ui-stack gap-2' htmlFor='search'>
              <span className='text-fg-700 font-semibold'>Search term</span>
              <input
                className='rounded-lg border border-fg/30 bg-background-100 px-3 py-2 text-fg'
                id='search'
                onChange={(event) => setSearch(event.target.value)}
                placeholder='e.g. calculus'
                value={search}
              />
            </label>
          ) : null}

          <button
            className='solid w-fit rounded-lg bg-brand px-5 py-3 font-semibold text-background-100 disabled:cursor-not-allowed disabled:opacity-60'
            disabled={loading}
            onClick={runRequest}
            type='button'
          >
            {loading ? 'Requesting...' : 'Run request'}
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
              ? 'Run a request to see the API response.'
              : JSON.stringify(response, null, 2)}
          </pre>
        </section>
      </div>
    </main>
  )
}
