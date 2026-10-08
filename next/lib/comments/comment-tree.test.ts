import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { PortableTextValue } from '@shared/types/portable-text.types'
import type { CommentEntity } from '@/types/components/comments/Comments.types'
import {
  addReply,
  countComments,
  nestCommentReplies,
  removeComment,
  updateComment,
} from './comment-tree'

const content: PortableTextValue = [
  {
    _type: 'block',
    _key: 'block',
    children: [{ _type: 'span', _key: 'span', text: 'Test comment' }],
  },
]

const createComment = (
  id: string,
  parentId: string | null,
  createdAt: string
): CommentEntity => ({
  id,
  author_id: 'author',
  content,
  author: null,
  parent_id: parentId,
  created_at: createdAt,
  edited: false,
  reactions_count: 0,
  reactions_by_type: {},
  likes_count: 0,
  my_reactions: [],
  liked_by_me: false,
})

test('nests replies beneath parents and orders them oldest-first', () => {
  const tree = nestCommentReplies([
    createComment('new-reply', 'root', '2026-10-02T00:00:00.000Z'),
    createComment('root', null, '2026-10-01T00:00:00.000Z'),
    createComment('old-reply', 'root', '2026-10-01T12:00:00.000Z'),
  ])

  assert.deepEqual(
    tree.map((comment) => comment.id),
    ['root']
  )
  assert.deepEqual(
    tree[0]?.replies?.map((comment) => comment.id),
    ['old-reply', 'new-reply']
  )
})

test('adds, updates, counts, and removes nested replies without losing the tree', () => {
  const root = createComment('root', null, '2026-10-01T00:00:00.000Z')
  const initial = nestCommentReplies([
    root,
    createComment('reply', 'root', '2026-10-02T00:00:00.000Z'),
  ])
  const added = addReply(
    initial,
    'reply',
    createComment('nested', 'reply', '2026-10-03T00:00:00.000Z')
  )
  assert.equal(countComments(added), 3)

  const updated = updateComment(added, {
    ...createComment('reply', 'root', '2026-10-02T00:00:00.000Z'),
    edited: true,
  })
  assert.equal(updated[0]?.replies?.[0]?.edited, true)
  assert.equal(updated[0]?.replies?.[0]?.replies?.[0]?.id, 'nested')

  const removed = removeComment(updated, 'reply')
  assert.equal(countComments(removed), 1)
  assert.deepEqual(removed[0]?.replies, [])
})
