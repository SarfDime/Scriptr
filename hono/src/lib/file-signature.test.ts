import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { FileType } from '@shared/types/api.types'
import { matchesFileSignature } from '@shared/utils/file-signature'

const bytes = (...parts: Array<string | ReadonlyArray<number>>) =>
  new Uint8Array(
    Buffer.concat(
      parts.map((part) =>
        typeof part === 'string' ? Buffer.from(part) : Buffer.from([...part])
      )
    )
  )

const ZIP = [0x50, 0x4b, 0x03, 0x04]
const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
const JPEG = [0xff, 0xd8, 0xff, 0xe0]

const cases: Array<[string, FileType, Uint8Array, boolean]> = [
  ['pdf with a header', 'pdf', bytes('%PDF-1.7\n'), true],
  ['pdf with leading whitespace', 'pdf', bytes('  \n%PDF-1.4'), true],
  ['pdf that is plain text', 'pdf', bytes('hello'), false],
  ['png', 'png', bytes(PNG, [0]), true],
  ['png that is really a jpeg', 'png', bytes(JPEG), false],
  ['jpg', 'jpg', bytes(JPEG), true],
  ['jpeg', 'jpeg', bytes(JPEG), true],
  ['webp', 'webp', bytes('RIFF', [1, 2, 3, 4], 'WEBPVP8 '), true],
  [
    'webp that is really a wav',
    'webp',
    bytes('RIFF', [1, 2, 3, 4], 'WAVEfmt '),
    false,
  ],
  ['docx', 'docx', bytes(ZIP, 'xxxword/document.xml'), true],
  ['docx that is really an xlsx', 'docx', bytes(ZIP, 'xl/workbook.xml'), false],
  ['docx that is not a zip', 'docx', bytes('word/document.xml'), false],
  ['xlsx', 'xlsx', bytes(ZIP, 'xl/workbook.xml'), true],
  [
    'xlsx that is really a docx',
    'xlsx',
    bytes(ZIP, 'word/document.xml'),
    false,
  ],
  ['markdown', 'md', bytes('# héllo'), true],
  ['markdown containing a NUL byte', 'md', bytes('a', [0], 'b'), false],
  [
    'markdown that is not UTF-8',
    'md',
    new Uint8Array([0xff, 0xfe, 0x41]),
    false,
  ],
]

for (const [name, fileType, content, expected] of cases) {
  test(`matchesFileSignature: ${name}`, () => {
    assert.equal(matchesFileSignature(fileType, content), expected)
  })
}
