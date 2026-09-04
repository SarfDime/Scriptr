'use client'

import Link from 'next/link'
import { useState } from 'react'

type AuthResponse = unknown

const defaultScriptId = '98e8bcc7-86ef-4a4e-8440-7139e9456c8e'
const defaultProfessorId = '9775ee05-547d-5f4a-a8bc-a9e48364a1e7'

export function AuthTester() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [fullName, setFullName] = useState('')
  const [scriptId, setScriptId] = useState(defaultScriptId)
  const [professorId, setProfessorId] = useState(defaultProfessorId)
  const [comment, setComment] = useState('Testing an authenticated comment.')
  const [response, setResponse] = useState<AuthResponse>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const request = async (
    path: string,
    body?: Record<string, string | number>,
    method = 'POST'
  ) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787'

    setLoading(true)
    setError('')

    try {
      const result = await fetch(new URL(path, baseUrl), {
        body: body ? JSON.stringify(body) : undefined,
        credentials: 'include',
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        method,
      })
      const contentType = result.headers.get('content-type') ?? ''
      const resultBody = contentType.includes('application/json')
        ? await result.json()
        : await result.text()

      setResponse(resultBody)

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
          <h1 className='text-fg-700 text-4xl font-semibold'>Authentication</h1>
          <p className='max-w-2xl text-fg leading-7'>
            Test registration, login, and cookie-based logout.
          </p>
        </header>

        <div className='grid gap-6 md:grid-cols-2'>
          <section className='ui-stack gap-4 rounded-xl border border-fg/20 bg-background-100 p-6'>
            <h2 className='text-fg-700 text-2xl font-semibold'>Register</h2>
            <input
              aria-label='Full name'
              className='rounded-lg border border-fg/30 bg-background-100 px-3 py-2 text-fg'
              onChange={(event) => setFullName(event.target.value)}
              placeholder='Full name'
              value={fullName}
            />
            <input
              aria-label='Username'
              className='rounded-lg border border-fg/30 bg-background-100 px-3 py-2 text-fg'
              onChange={(event) => setUsername(event.target.value)}
              placeholder='Username'
              value={username}
            />
            <input
              aria-label='Email'
              className='rounded-lg border border-fg/30 bg-background-100 px-3 py-2 text-fg'
              onChange={(event) => setEmail(event.target.value)}
              placeholder='Email'
              type='email'
              value={email}
            />
            <input
              aria-label='Password'
              className='rounded-lg border border-fg/30 bg-background-100 px-3 py-2 text-fg'
              onChange={(event) => setPassword(event.target.value)}
              placeholder='Password'
              type='password'
              value={password}
            />
            <button
              className='solid w-fit rounded-lg bg-brand px-5 py-3 font-semibold text-background-100 disabled:opacity-60'
              disabled={loading}
              onClick={() =>
                request('/api/auth/register', {
                  email,
                  full_name: fullName,
                  password,
                  username,
                })
              }
              type='button'
            >
              Register
            </button>
          </section>

          <section className='ui-stack gap-4 rounded-xl border border-fg/20 bg-background-100 p-6'>
            <h2 className='text-fg-700 text-2xl font-semibold'>Login</h2>
            <input
              aria-label='Login email'
              className='rounded-lg border border-fg/30 bg-background-100 px-3 py-2 text-fg'
              onChange={(event) => setEmail(event.target.value)}
              placeholder='Email'
              type='email'
              value={email}
            />
            <input
              aria-label='Login password'
              className='rounded-lg border border-fg/30 bg-background-100 px-3 py-2 text-fg'
              onChange={(event) => setPassword(event.target.value)}
              placeholder='Password'
              type='password'
              value={password}
            />
            <button
              className='solid w-fit rounded-lg bg-brand px-5 py-3 font-semibold text-background-100 disabled:opacity-60'
              disabled={loading}
              onClick={() => request('/api/auth/login', { email, password })}
              type='button'
            >
              Login
            </button>
            <button
              className='w-fit rounded-lg border border-fg/30 px-5 py-3 font-semibold text-fg disabled:opacity-60'
              disabled={loading}
              onClick={() => request('/api/auth/logout')}
              type='button'
            >
              Logout
            </button>
          </section>
        </div>

        <section className='ui-stack gap-4 rounded-xl border border-fg/20 bg-background-100 p-6'>
          <h2 className='text-fg-700 text-2xl font-semibold'>
            Protected actions
          </h2>
          <p className='text-fg'>
            Login first, then use these actions with the saved session cookie.
          </p>
          <button
            className='w-fit rounded-lg border border-fg/30 px-5 py-3 font-semibold text-fg disabled:opacity-60'
            disabled={loading}
            onClick={() => request('/api/auth/session', undefined, 'GET')}
            type='button'
          >
            Check session
          </button>
          <div className='grid gap-4 md:grid-cols-2'>
            <label className='ui-stack gap-2' htmlFor='script-id'>
              <span className='text-fg-700 font-semibold'>Script ID</span>
              <input
                className='rounded-lg border border-fg/30 bg-background-100 px-3 py-2 text-fg'
                id='script-id'
                onChange={(event) => setScriptId(event.target.value)}
                value={scriptId}
              />
            </label>
            <label className='ui-stack gap-2' htmlFor='professor-id'>
              <span className='text-fg-700 font-semibold'>Professor ID</span>
              <input
                className='rounded-lg border border-fg/30 bg-background-100 px-3 py-2 text-fg'
                id='professor-id'
                onChange={(event) => setProfessorId(event.target.value)}
                value={professorId}
              />
            </label>
          </div>
          <div className='flex flex-wrap gap-3'>
            <button
              className='solid w-fit rounded-lg bg-brand px-5 py-3 font-semibold text-background-100 disabled:opacity-60'
              disabled={loading}
              onClick={() => request(`/api/votes/${scriptId}`)}
              type='button'
            >
              Toggle vote
            </button>
          </div>
          <label className='ui-stack gap-2' htmlFor='comment'>
            <span className='text-fg-700 font-semibold'>Comment</span>
            <textarea
              className='rounded-lg border border-fg/30 bg-background-100 px-3 py-2 text-fg'
              id='comment'
              onChange={(event) => setComment(event.target.value)}
              rows={3}
              value={comment}
            />
          </label>
          <button
            className='solid w-fit rounded-lg bg-brand px-5 py-3 font-semibold text-background-100 disabled:opacity-60'
            disabled={loading}
            onClick={() =>
              request('/api/comments', {
                content: comment,
                professor_id: professorId,
              })
            }
            type='button'
          >
            Post comment
          </button>
        </section>

        <section className='ui-stack gap-3' aria-live='polite'>
          <h2 className='text-fg-700 text-2xl font-semibold'>Response</h2>
          {error ? <p className='text-error-red'>{error}</p> : null}
          <pre className='min-h-48 overflow-auto rounded-xl border border-fg/20 bg-fg-700 p-5 text-background-100 text-sm leading-6'>
            {response === null
              ? 'Run an auth request to see the API response.'
              : JSON.stringify(response, null, 2)}
          </pre>
        </section>
      </div>
    </main>
  )
}
