/** biome-ignore-all lint/style/useNamingConvention: <Ignore> */
import type { PortableTextValue } from '@shared/types/portable-text.types'
import type { Database as GenDatabase } from './supabase'

export type FileType =
  | 'pdf'
  | 'jpg'
  | 'jpeg'
  | 'png'
  | 'webp'
  | 'md'
  | 'doc'
  | 'docx'
  | 'xls'
  | 'xlsx'

type Override<T, U> = Omit<T, keyof U> & U

type ScriptOverrides = {
  title: PortableTextValue
  description: PortableTextValue | null
}

type ScriptOverridesUpdate = {
  title?: PortableTextValue | null
  description?: PortableTextValue | null
}

type CommentOverrides = {
  content: PortableTextValue
}

type FileOverrides = {
  file_type: FileType
}

export type Database = Override<
  GenDatabase,
  {
    public: Override<
      GenDatabase['public'],
      {
        Functions: Override<
          GenDatabase['public']['Functions'],
          {
            get_top_comment_ids: {
              Args: {
                p_script_id: string | null
                p_professor_id: string | null
                p_author_id: string | null
                p_limit: number
                p_offset: number
              }
              Returns: Array<{ comment_id: string }>
            }
          }
        >
        Tables: Override<
          GenDatabase['public']['Tables'],
          {
            // Override the scripts table
            scripts: Override<
              GenDatabase['public']['Tables']['scripts'],
              {
                Row: Override<
                  GenDatabase['public']['Tables']['scripts']['Row'],
                  ScriptOverrides
                >
                Insert: Override<
                  GenDatabase['public']['Tables']['scripts']['Insert'],
                  ScriptOverrides
                >
                Update: Override<
                  GenDatabase['public']['Tables']['scripts']['Update'],
                  ScriptOverridesUpdate
                >
              }
            >

            comments: Override<
              GenDatabase['public']['Tables']['comments'],
              {
                Row: Override<
                  GenDatabase['public']['Tables']['comments']['Row'],
                  CommentOverrides
                >
                Insert: Override<
                  GenDatabase['public']['Tables']['comments']['Insert'],
                  CommentOverrides
                >
                Update: Override<
                  GenDatabase['public']['Tables']['comments']['Update'],
                  Partial<CommentOverrides>
                >
              }
            >

            // Override the script_files table
            script_files: Override<
              GenDatabase['public']['Tables']['script_files'],
              {
                Row: Override<
                  GenDatabase['public']['Tables']['script_files']['Row'],
                  FileOverrides
                >
                Insert: Override<
                  GenDatabase['public']['Tables']['script_files']['Insert'],
                  FileOverrides
                >
                Update: Override<
                  GenDatabase['public']['Tables']['script_files']['Update'],
                  FileOverrides
                >
              }
            >
          }
        >
      }
    >
  }
>
