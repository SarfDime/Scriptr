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
    PostgrestVersion: '14.17'
  }
  public: {
    Tables: {
      achievement_definitions: {
        Row: {
          created_at: string
          description: string | null
          entity_type: string
          id: string
          metric: string
          rarity: string
          study_id: string | null
          threshold: number
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          entity_type: string
          id: string
          metric: string
          rarity?: string
          study_id?: string | null
          threshold: number
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          entity_type?: string
          id?: string
          metric?: string
          rarity?: string
          study_id?: string | null
          threshold?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: 'achievement_definitions_study_id_fkey'
            columns: ['study_id']
            isOneToOne: false
            referencedRelation: 'studies'
            referencedColumns: ['id']
          },
        ]
      }
      comment_likes: {
        Row: {
          comment_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'comment_likes_comment_id_fkey'
            columns: ['comment_id']
            isOneToOne: false
            referencedRelation: 'comments'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'comment_likes_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      comment_reactions: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          reaction_type: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'comment_reactions_comment_id_fkey'
            columns: ['comment_id']
            isOneToOne: false
            referencedRelation: 'comments'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'comment_reactions_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      comments: {
        Row: {
          author_id: string
          content: Json
          created_at: string
          edited: boolean
          id: string
          is_flagged: boolean
          parent_id: string | null
          professor_id: string | null
          script_id: string | null
          updated_at: string
        }
        Insert: {
          author_id: string
          content: Json
          created_at?: string
          edited?: boolean
          id?: string
          is_flagged?: boolean
          parent_id?: string | null
          professor_id?: string | null
          script_id?: string | null
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: Json
          created_at?: string
          edited?: boolean
          id?: string
          is_flagged?: boolean
          parent_id?: string | null
          professor_id?: string | null
          script_id?: string | null
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
            foreignKeyName: 'comments_parent_id_fkey'
            columns: ['parent_id']
            isOneToOne: false
            referencedRelation: 'comments'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'comments_professor_id_fkey'
            columns: ['professor_id']
            isOneToOne: false
            referencedRelation: 'professors'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'comments_script_id_fkey'
            columns: ['script_id']
            isOneToOne: false
            referencedRelation: 'scripts'
            referencedColumns: ['id']
          },
        ]
      }
      download_events: {
        Row: {
          created_at: string
          device_id: string | null
          id: string
          identity_key: string
          ip_address: string | null
          script_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          device_id?: string | null
          id?: string
          identity_key: string
          ip_address?: string | null
          script_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          device_id?: string | null
          id?: string
          identity_key?: string
          ip_address?: string | null
          script_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'download_events_script_id_fkey'
            columns: ['script_id']
            isOneToOne: false
            referencedRelation: 'scripts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'download_events_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      faculties: {
        Row: {
          created_at: string
          id: string
          name: string
          sanity_id: string | null
          university_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          sanity_id?: string | null
          university_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          sanity_id?: string | null
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
          study_id: string | null
          target_comment_id: string | null
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
          study_id?: string | null
          target_comment_id?: string | null
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
          study_id?: string | null
          target_comment_id?: string | null
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
            foreignKeyName: 'flags_study_id_fkey'
            columns: ['study_id']
            isOneToOne: false
            referencedRelation: 'studies'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'flags_target_comment_id_fkey'
            columns: ['target_comment_id']
            isOneToOne: false
            referencedRelation: 'comments'
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
      notifications: {
        Row: {
          body: string | null
          created_at: string
          data: Json | null
          id: string
          is_read: boolean
          profile_id: string
          study_id: string | null
          title: string
          type: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          profile_id: string
          study_id?: string | null
          title: string
          type: string
        }
        Update: {
          body?: string | null
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          profile_id?: string
          study_id?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: 'notifications_profile_id_fkey'
            columns: ['profile_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'notifications_study_id_fkey'
            columns: ['study_id']
            isOneToOne: false
            referencedRelation: 'studies'
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
      professor_ratings: {
        Row: {
          created_at: string
          id: string
          professor_id: string
          rating_type_id: string
          score: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          professor_id: string
          rating_type_id: string
          score: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          professor_id?: string
          rating_type_id?: string
          score?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'professor_ratings_professor_id_fkey'
            columns: ['professor_id']
            isOneToOne: false
            referencedRelation: 'professors'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'professor_ratings_rating_type_id_fkey'
            columns: ['rating_type_id']
            isOneToOne: false
            referencedRelation: 'rating_types'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'professor_ratings_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      professor_studies: {
        Row: {
          created_at: string
          professor_id: string
          study_id: string
        }
        Insert: {
          created_at?: string
          professor_id: string
          study_id: string
        }
        Update: {
          created_at?: string
          professor_id?: string
          study_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'professor_studies_professor_id_fkey'
            columns: ['professor_id']
            isOneToOne: false
            referencedRelation: 'professors'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'professor_studies_study_id_fkey'
            columns: ['study_id']
            isOneToOne: false
            referencedRelation: 'studies'
            referencedColumns: ['id']
          },
        ]
      }
      professors: {
        Row: {
          created_at: string
          id: string
          name: string
          sanity_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          sanity_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          sanity_id?: string | null
        }
        Relationships: []
      }
      profile_achievements: {
        Row: {
          achievement_id: string
          earned_at: string
          id: string
          profile_id: string
        }
        Insert: {
          achievement_id: string
          earned_at?: string
          id?: string
          profile_id: string
        }
        Update: {
          achievement_id?: string
          earned_at?: string
          id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'profile_achievements_achievement_id_fkey'
            columns: ['achievement_id']
            isOneToOne: false
            referencedRelation: 'achievement_definitions'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'profile_achievements_profile_id_fkey'
            columns: ['profile_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      profile_calendar_notes: {
        Row: {
          body: string | null
          day: string
          deleted: boolean
          note_id: string
          profile_id: string
          synced_at: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          body?: string | null
          day: string
          deleted?: boolean
          note_id: string
          profile_id: string
          synced_at?: string
          title: string
          type?: string
          updated_at: string
        }
        Update: {
          body?: string | null
          day?: string
          deleted?: boolean
          note_id?: string
          profile_id?: string
          synced_at?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'profile_calendar_notes_profile_id_fkey'
            columns: ['profile_id']
            isOneToOne: false
            referencedRelation: 'profiles'
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
      profile_preferences: {
        Row: {
          preferences: Json
          profile_id: string
          updated_at: string
        }
        Insert: {
          preferences?: Json
          profile_id: string
          updated_at?: string
        }
        Update: {
          preferences?: Json
          profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'profile_preferences_profile_id_fkey'
            columns: ['profile_id']
            isOneToOne: true
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      profile_restriction_history: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          lifted_early_at: string | null
          profile_id: string
          reason: string
          restricted_by: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          lifted_early_at?: string | null
          profile_id: string
          reason: string
          restricted_by: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          lifted_early_at?: string | null
          profile_id?: string
          reason?: string
          restricted_by?: string
        }
        Relationships: [
          {
            foreignKeyName: 'profile_restriction_history_profile_id_fkey'
            columns: ['profile_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'profile_restriction_history_restricted_by_fkey'
            columns: ['restricted_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      profile_restrictions: {
        Row: {
          created_at: string
          expires_at: string | null
          profile_id: string
          reason: string
          restricted_by: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          profile_id: string
          reason: string
          restricted_by: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          profile_id?: string
          reason?: string
          restricted_by?: string
        }
        Relationships: [
          {
            foreignKeyName: 'profile_restrictions_profile_id_fkey'
            columns: ['profile_id']
            isOneToOne: true
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'profile_restrictions_restricted_by_fkey'
            columns: ['restricted_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      profile_studies: {
        Row: {
          created_at: string
          display_name: string | null
          headline: string | null
          is_primary: boolean
          is_public: boolean
          profile_id: string
          study_id: string
          updated_at: string
          year: number | null
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          headline?: string | null
          is_primary?: boolean
          is_public?: boolean
          profile_id: string
          study_id: string
          updated_at?: string
          year?: number | null
        }
        Update: {
          created_at?: string
          display_name?: string | null
          headline?: string | null
          is_primary?: boolean
          is_public?: boolean
          profile_id?: string
          study_id?: string
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'profile_studies_profile_id_fkey'
            columns: ['profile_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'profile_studies_study_id_fkey'
            columns: ['study_id']
            isOneToOne: false
            referencedRelation: 'studies'
            referencedColumns: ['id']
          },
        ]
      }
      profile_subjects: {
        Row: {
          profile_id: string
          status: string
          subject_id: string
          updated_at: string
        }
        Insert: {
          profile_id: string
          status?: string
          subject_id: string
          updated_at?: string
        }
        Update: {
          profile_id?: string
          status?: string
          subject_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'profile_subjects_profile_id_fkey'
            columns: ['profile_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'profile_subjects_subject_id_fkey'
            columns: ['subject_id']
            isOneToOne: false
            referencedRelation: 'subjects'
            referencedColumns: ['id']
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          role: string
          updated_at: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          role?: string
          updated_at?: string
          username: string
        }
        Update: {
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
      rating_types: {
        Row: {
          created_at: string
          id: string
          label: string | null
          labels: Json
          target_type: string
        }
        Insert: {
          created_at?: string
          id: string
          label?: string | null
          labels: Json
          target_type: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string | null
          labels?: Json
          target_type?: string
        }
        Relationships: []
      }
      script_favorites: {
        Row: {
          created_at: string
          script_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          script_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          script_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'script_favorites_script_id_fkey'
            columns: ['script_id']
            isOneToOne: false
            referencedRelation: 'scripts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'script_favorites_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      script_files: {
        Row: {
          bucket: string
          created_at: string
          file_name: string | null
          file_size_bytes: number
          file_type: string
          file_url: string
          id: string
          position: number
          script_id: string
        }
        Insert: {
          bucket: string
          created_at?: string
          file_name?: string | null
          file_size_bytes: number
          file_type: string
          file_url: string
          id?: string
          position?: number
          script_id: string
        }
        Update: {
          bucket?: string
          created_at?: string
          file_name?: string | null
          file_size_bytes?: number
          file_type?: string
          file_url?: string
          id?: string
          position?: number
          script_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'script_files_script_id_fkey'
            columns: ['script_id']
            isOneToOne: false
            referencedRelation: 'scripts'
            referencedColumns: ['id']
          },
        ]
      }
      scripts: {
        Row: {
          additional_reading: string[]
          author_id: string
          created_at: string
          description: Json | null
          download_count: number
          exam_session: string | null
          exam_year: number | null
          id: string
          is_flagged: boolean
          professor_id: string
          slug: string
          study_id: string
          subject_id: string
          title: Json
          updated_at: string
          vote_score: number
        }
        Insert: {
          additional_reading?: string[]
          author_id: string
          created_at?: string
          description?: Json | null
          download_count?: number
          exam_session?: string | null
          exam_year?: number | null
          id?: string
          is_flagged?: boolean
          professor_id: string
          slug: string
          study_id: string
          subject_id: string
          title: Json
          updated_at?: string
          vote_score?: number
        }
        Update: {
          additional_reading?: string[]
          author_id?: string
          created_at?: string
          description?: Json | null
          download_count?: number
          exam_session?: string | null
          exam_year?: number | null
          id?: string
          is_flagged?: boolean
          professor_id?: string
          slug?: string
          study_id?: string
          subject_id?: string
          title?: Json
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
            foreignKeyName: 'scripts_study_id_fkey'
            columns: ['study_id']
            isOneToOne: false
            referencedRelation: 'studies'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'scripts_subject_professor_fkey'
            columns: ['subject_id', 'professor_id']
            isOneToOne: false
            referencedRelation: 'subject_professors'
            referencedColumns: ['subject_id', 'professor_id']
          },
          {
            foreignKeyName: 'scripts_subject_study_fkey'
            columns: ['subject_id', 'study_id']
            isOneToOne: false
            referencedRelation: 'subjects'
            referencedColumns: ['id', 'study_id']
          },
        ]
      }
      studies: {
        Row: {
          created_at: string
          faculty_id: string
          id: string
          name: string
          r2_bucket_id: string | null
          sanity_id: string | null
          site_slug: string | null
        }
        Insert: {
          created_at?: string
          faculty_id: string
          id?: string
          name: string
          r2_bucket_id?: string | null
          sanity_id?: string | null
          site_slug?: string | null
        }
        Update: {
          created_at?: string
          faculty_id?: string
          id?: string
          name?: string
          r2_bucket_id?: string | null
          sanity_id?: string | null
          site_slug?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'studies_faculty_id_fkey'
            columns: ['faculty_id']
            isOneToOne: false
            referencedRelation: 'faculties'
            referencedColumns: ['id']
          },
        ]
      }
      study_roles: {
        Row: {
          created_at: string
          granted_by: string | null
          profile_id: string
          role: string
          study_id: string
        }
        Insert: {
          created_at?: string
          granted_by?: string | null
          profile_id: string
          role: string
          study_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string | null
          profile_id?: string
          role?: string
          study_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'study_roles_granted_by_fkey'
            columns: ['granted_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'study_roles_profile_id_fkey'
            columns: ['profile_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'study_roles_study_id_fkey'
            columns: ['study_id']
            isOneToOne: false
            referencedRelation: 'studies'
            referencedColumns: ['id']
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
      subject_ratings: {
        Row: {
          created_at: string
          id: string
          rating_type_id: string
          score: number
          subject_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          rating_type_id: string
          score: number
          subject_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          rating_type_id?: string
          score?: number
          subject_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'subject_ratings_rating_type_id_fkey'
            columns: ['rating_type_id']
            isOneToOne: false
            referencedRelation: 'rating_types'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'subject_ratings_subject_id_fkey'
            columns: ['subject_id']
            isOneToOne: false
            referencedRelation: 'subjects'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'subject_ratings_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      subjects: {
        Row: {
          created_at: string
          id: string
          name: string
          sanity_id: string | null
          study_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          sanity_id?: string | null
          study_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          sanity_id?: string | null
          study_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'subjects_study_id_fkey'
            columns: ['study_id']
            isOneToOne: false
            referencedRelation: 'studies'
            referencedColumns: ['id']
          },
        ]
      }
      universities: {
        Row: {
          created_at: string
          id: string
          name: string
          r2_bucket_id: string | null
          sanity_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          r2_bucket_id?: string | null
          sanity_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          r2_bucket_id?: string | null
          sanity_id?: string | null
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
      flag_study_id: {
        Args: { target_comment: string; target_script: string }
        Returns: string
      }
      get_script_comment_counts: {
        Args: { p_script_ids: string[] }
        Returns: {
          comment_count: number
          script_id: string
        }[]
      }
      get_top_comment_ids: {
        Args: {
          p_author_id: string
          p_limit: number
          p_offset: number
          p_professor_id: string
          p_script_id: string
        }
        Returns: {
          comment_id: string
        }[]
      }
      has_study_role: {
        Args: { need: string; study: string; uid: string }
        Returns: boolean
      }
      increment_script_download_count: {
        Args: { p_script_id: string }
        Returns: number
      }
      is_moderator: { Args: { uid: string }; Returns: boolean }
      is_owner: { Args: { uid: string }; Returns: boolean }
      is_restricted: { Args: { uid: string }; Returns: boolean }
      toggle_vote: {
        Args: { p_script_id: string }
        Returns: {
          vote_score: number
          voted: boolean
        }[]
      }
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
