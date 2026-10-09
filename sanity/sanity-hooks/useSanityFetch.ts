import { API_VERSION } from '@shared/config/sanity-constants'
import { useCallback, useEffect, useState } from 'react'
import { type QueryParams, useClient } from 'sanity'

// 1. EXTRACT OUTSIDE THE HOOK
// By defining this outside, the object reference never changes.
// This ensures `useClient` returns a stable client instance,
// breaking the infinite network-request loop.
const clientConfig = { apiVersion: API_VERSION }

/** Custom hook to fetch data from Sanity. */
export const useSanityFetch = <T>(query: string, params?: QueryParams) => {
  const client = useClient(clientConfig)

  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | null>(null)
  const [tick, setTick] = useState(0)

  // 2. STABLE PRIMITIVE DEPENDENCY
  // React compares strings by value, not reference. If a parent component
  // passes an inline object like `params={{ id: doc._id }}` every render,
  // this string stays identical, preventing the useEffect from firing unnecessarily.
  const paramsString = params ? JSON.stringify(params) : ''

  // biome-ignore lint/correctness/useExhaustiveDependencies: <Needed maybe>
  useEffect(() => {
    let ignore = false

    const fetchData = async () => {
      setLoading(true)
      setError(null)

      try {
        const parsedParams = paramsString ? JSON.parse(paramsString) : {}
        const result = await client.fetch<T>(query, parsedParams)

        if (!ignore) {
          setData(result)
        }
      } catch (err) {
        if (!ignore) {
          // biome-ignore lint/suspicious/noConsole: <Used for logging>
          console.error('[useSanityFetch] Failed to fetch data:', err)
          setError(err as Error)
          setData(null)
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      ignore = true
    }
  }, [client, query, paramsString, tick])

  // Refetch is perfectly stable
  const refetch = useCallback(() => {
    setTick((t) => t + 1)
  }, [])

  return { data, loading, error, refetch }
}
