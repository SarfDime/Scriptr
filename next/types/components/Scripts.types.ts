import type { ComponentColorPalettes } from '../component.types'

type Script = {
  id: number
  title: string
  subject: string
  professor: string
  author: string
  year: string
  updated: string
  tag: string
  color: ComponentColorPalettes
  likes: number
  comments: number
  saved: boolean
  liked: boolean
}

type Subject = {
  name: string
  code: string
  next: string
  progress: number
  color: ComponentColorPalettes
}

export type { Script, Subject }
