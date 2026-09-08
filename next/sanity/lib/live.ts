import { defineLive } from 'next-sanity/live'
import { sanityAuthToken } from '../env'
import { client } from './client'

export const { sanityFetch, SanityLive } = defineLive({
  client,
  browserToken: sanityAuthToken,
  serverToken: sanityAuthToken,
})
