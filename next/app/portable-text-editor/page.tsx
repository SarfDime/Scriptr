'use client'

import { PT_STRINGS } from '@shared/config/pt-strings'
import type { PortableTextValue } from '@shared/types/portable-text.types'
import dynamic from 'next/dynamic'
import { useState } from 'react'
import { Button } from '@/components/common/Button'
import { PortableTextContent } from '@/components/typography/PortableTextContent'

const PortableTextEditorSection = dynamic(
  () =>
    import(
      '@/components/typography/portable-text/PortableTextEditorSection'
    ).then((module) => module.PortableTextEditorSection),
  { ssr: false }
)

const initialContent: PortableTextValue = [
  {
    _type: 'block',
    _key: 'editor-demo-heading',
    style: 'h2',
    markDefs: [],
    children: [
      {
        _type: 'span',
        _key: 'editor-demo-heading-span',
        text: 'Try the Portable Text editor',
        marks: ['strong'],
      },
    ],
  },
  {
    _type: 'block',
    _key: 'editor-demo-body',
    style: 'normal',
    markDefs: [],
    children: [
      {
        _type: 'span',
        _key: 'editor-demo-body-span',
        text: 'Select this text and experiment with the toolbar. Changes are saved in local page state.',
      },
    ],
  },
]

export default function PortableTextEditorDemoPage() {
  const [savedContent, setSavedContent] = useState(initialContent)
  const [draftContent, setDraftContent] = useState(initialContent)
  const [mode, setMode] = useState<'editing' | 'preview'>('editing')

  const saveContent = async (nextContent: PortableTextValue) => {
    setSavedContent(nextContent)
    setDraftContent(nextContent)
  }

  const previewContent = () => {
    setMode('preview')
  }

  const previewValue = draftContent

  return (
    <main className='mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10'>
      <div className='flex flex-col gap-2'>
        <p className='text-grey text-sm uppercase tracking-wide'>
          {PT_STRINGS.demo.eyebrow}
        </p>
        <h1 className='font-bold text-3xl text-fg'>{PT_STRINGS.demo.title}</h1>
        <p className='text-grey'>{PT_STRINGS.demo.description}</p>
      </div>

      {mode === 'editing' ? (
        <PortableTextEditorSection
          initialContent={savedContent}
          onSave={saveContent}
          onChange={setDraftContent}
          onPreview={previewContent}
          onCancel={() => setMode('preview')}
          onSaveSuccess={() => setMode('preview')}
        />
      ) : (
        <Button
          type='button'
          onClick={() => setMode('editing')}
          className='button solid self-start rounded-sm px-3 py-2 text-sm'
        >
          {PT_STRINGS.demo.editContent}
        </Button>
      )}

      <section className='rounded-md border border-grey-200 bg-background p-4'>
        <h2 className='mb-3 font-semibold text-fg'>
          {PT_STRINGS.demo.previewTitle}
        </h2>
        <PortableTextContent>
          {previewValue as PortableTextValue}
        </PortableTextContent>
      </section>
    </main>
  )
}
