export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.5'
  }
  public: {
    Tables: {
      comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          edited: boolean
          id: string
          professor_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          edited?: boolean
          id?: string
          professor_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          edited?: boolean
          id?: string
          professor_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'comments_author_id_fkey'
            columns: ['author_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'comments_professor_id_fkey'
            columns: ['professor_id']
            isOneToOne: false
            referencedRelation: 'professors'
            referencedColumns: ['id']
          },
        ]
      }
      faculties: {
        Row: {
          created_at: string
          id: string
          name: string
          university_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          university_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          university_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'faculties_university_id_fkey'
            columns: ['university_id']
            isOneToOne: false
            referencedRelation: 'universities'
            referencedColumns: ['id']
          },
        ]
      }
      flags: {
        Row: {
          created_at: string
          id: string
          reason: string
          reporter_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          target_script_id: string | null
          target_user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          reason: string
          reporter_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          target_script_id?: string | null
          target_user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string
          reporter_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          target_script_id?: string | null
          target_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'flags_reporter_id_fkey'
            columns: ['reporter_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'flags_reviewed_by_fkey'
            columns: ['reviewed_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'flags_target_script_id_fkey'
            columns: ['target_script_id']
            isOneToOne: false
            referencedRelation: 'scripts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'flags_target_user_id_fkey'
            columns: ['target_user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      professor_faculties: {
        Row: {
          created_at: string
          faculty_id: string
          professor_id: string
        }
        Insert: {
          created_at?: string
          faculty_id: string
          professor_id: string
        }
        Update: {
          created_at?: string
          faculty_id?: string
          professor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'professor_faculties_faculty_id_fkey'
            columns: ['faculty_id']
            isOneToOne: false
            referencedRelation: 'faculties'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'professor_faculties_professor_id_fkey'
            columns: ['professor_id']
            isOneToOne: false
            referencedRelation: 'professors'
            referencedColumns: ['id']
          },
        ]
      }
      professors: {
        Row: {
          bio: string | null
          created_at: string
          id: string
          name: string
          picture_url: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string
          id?: string
          name: string
          picture_url?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string
          id?: string
          name?: string
          picture_url?: string | null
        }
        Relationships: []
      }
      profile_completed_subjects: {
        Row: {
          passed_at: string
          profile_id: string
          subject_id: string
        }
        Insert: {
          passed_at?: string
          profile_id: string
          subject_id: string
        }
        Update: {
          passed_at?: string
          profile_id?: string
          subject_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'profile_completed_subjects_profile_id_fkey'
            columns: ['profile_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'profile_completed_subjects_subject_id_fkey'
            columns: ['subject_id']
            isOneToOne: false
            referencedRelation: 'subjects'
            referencedColumns: ['id']
          },
        ]
      }
      profile_faculties: {
        Row: {
          created_at: string
          faculty_id: string
          profile_id: string
        }
        Insert: {
          created_at?: string
          faculty_id: string
          profile_id: string
        }
        Update: {
          created_at?: string
          faculty_id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'profile_faculties_faculty_id_fkey'
            columns: ['faculty_id']
            isOneToOne: false
            referencedRelation: 'faculties'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'profile_faculties_profile_id_fkey'
            columns: ['profile_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      profiles: {
        Row: {
          achievements: Json
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          role: string
          updated_at: string
          username: string
        }
        Insert: {
          achievements?: Json
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          role?: string
          updated_at?: string
          username: string
        }
        Update: {
          achievements?: Json
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          role?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      scripts: {
        Row: {
          author_id: string
          created_at: string
          description: string | null
          download_count: number
          faculty_id: string | null
          file_type: string
          file_url: string
          id: string
          is_flagged: boolean
          professor_id: string
          subject_id: string
          title: string
          updated_at: string
          vote_score: number
        }
        Insert: {
          author_id: string
          created_at?: string
          description?: string | null
          download_count?: number
          faculty_id?: string | null
          file_type: string
          file_url: string
          id?: string
          is_flagged?: boolean
          professor_id: string
          subject_id: string
          title: string
          updated_at?: string
          vote_score?: number
        }
        Update: {
          author_id?: string
          created_at?: string
          description?: string | null
          download_count?: number
          faculty_id?: string | null
          file_type?: string
          file_url?: string
          id?: string
          is_flagged?: boolean
          professor_id?: string
          subject_id?: string
          title?: string
          updated_at?: string
          vote_score?: number
        }
        Relationships: [
          {
            foreignKeyName: 'scripts_author_id_fkey'
            columns: ['author_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'scripts_faculty_id_fkey'
            columns: ['faculty_id']
            isOneToOne: false
            referencedRelation: 'faculties'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'scripts_subject_id_fkey'
            columns: ['subject_id']
            isOneToOne: false
            referencedRelation: 'subjects'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'scripts_subject_professor_fkey'
            columns: ['subject_id', 'professor_id']
            isOneToOne: false
            referencedRelation: 'subject_professors'
            referencedColumns: ['subject_id', 'professor_id']
          },
        ]
      }
      subject_professors: {
        Row: {
          professor_id: string
          subject_id: string
        }
        Insert: {
          professor_id: string
          subject_id: string
        }
        Update: {
          professor_id?: string
          subject_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'subject_professors_professor_id_fkey'
            columns: ['professor_id']
            isOneToOne: false
            referencedRelation: 'professors'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'subject_professors_subject_id_fkey'
            columns: ['subject_id']
            isOneToOne: false
            referencedRelation: 'subjects'
            referencedColumns: ['id']
          },
        ]
      }
      subjects: {
        Row: {
          created_at: string
          description: string | null
          exam_session: string
          faculty_id: string | null
          id: string
          name: string
          year: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          exam_session: string
          faculty_id?: string | null
          id?: string
          name: string
          year: number
        }
        Update: {
          created_at?: string
          description?: string | null
          exam_session?: string
          faculty_id?: string | null
          id?: string
          name?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: 'subjects_faculty_id_fkey'
            columns: ['faculty_id']
            isOneToOne: false
            referencedRelation: 'faculties'
            referencedColumns: ['id']
          },
        ]
      }
      universities: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      votes: {
        Row: {
          created_at: string
          id: string
          script_id: string
          user_id: string
          value: number
        }
        Insert: {
          created_at?: string
          id?: string
          script_id: string
          user_id: string
          value: number
        }
        Update: {
          created_at?: string
          id?: string
          script_id?: string
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: 'votes_script_id_fkey'
            columns: ['script_id']
            isOneToOne: false
            referencedRelation: 'scripts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'votes_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_download_count: {
        Args: { p_script_id: string }
        Returns: undefined
      }
      is_moderator: { Args: { uid: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
