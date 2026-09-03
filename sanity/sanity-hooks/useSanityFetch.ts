import { API_VERSION } from '@shared/config/sanity-constants'
import { useCallback, useEffect, useRef, useState } from 'react'
import { type QueryParams, useClient } from 'sanity'

/** Custom hook to fetch data from Sanity. */
export const useSanityFetch = <T>(query: string, params?: QueryParams) => {
  const client = useClient({ apiVersion: API_VERSION })
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | null>(null)

  // Using refs to track query and params
  const queryRef = useRef(query)
  const paramsRef = useRef(params)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await client.fetch<T>(
        queryRef.current,
        paramsRef.current ?? {}
      )
      setData(result)
    } catch (err) {
      // biome-ignore lint/suspicious/noConsole: <Used for tontineLog>
      console.error('[useSanityFetch] Failed to fetch data:', err)
      setError(err as Error)
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [client])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Update refs when query or params change
  useEffect(() => {
    queryRef.current = query
    paramsRef.current = params
  }, [query, params])

  // Manually trigger a refetch
  const refetch = useCallback(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch }
}
