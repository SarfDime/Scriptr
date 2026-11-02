import type { Tables } from './database.types'

export type FlagStatus = 'pending' | 'reviewed' | 'dismissed'

export type AdminFlagTarget =
  | {
      kind: 'script'
      id: string
      label: string
      href: string
      author_id: string
    }
  | {
      kind: 'comment'
      id: string
      label: string
      href: string
      author_id: string
    }
  | {
      kind: 'user'
      id: string
      label: string
      href: string
      author_id: null
    }

export type AdminFlag = Omit<Tables<'flags'>, 'status'> & {
  status: FlagStatus
  reporter: Pick<Tables<'profiles'>, 'username' | 'full_name'> | null
  target: AdminFlagTarget | null
}

export type FlagListResponse = Array<AdminFlag>

export type FlagCreateResponse = {
  success: true
  flag: Tables<'flags'>
}

export type FlagMutationResponse = {
  success: true
  flag: AdminFlag
}
