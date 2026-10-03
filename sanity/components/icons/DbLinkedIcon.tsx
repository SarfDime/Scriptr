import type { ElementType, FC } from 'react'

interface DbLinkedIconProps {
  dbId?: string
  imageUrl?: string
  icon?: ElementType
}

export const DbLinkedIcon: FC<DbLinkedIconProps> = ({
  dbId,
  imageUrl,
  icon: Icon,
}) => {
  const isLinked = Boolean(dbId)
  const dbBorderColor = isLinked ? '#10B981' : '#EF4444'

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        border: `2px ${isLinked ? 'solid' : 'dashed'} ${dbBorderColor}`,
        borderRadius: '4px',
        boxSizing: 'border-box',
        overflow: 'hidden',
        position: 'relative',
      }}
      title={dbId ? `DB: ${dbId}` : 'Not Linked'}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt=''
          style={{
            width: '98%',
            height: '98%',
            objectFit: 'cover',
          }}
        />
        // biome-ignore lint/style/noNestedTernary: <Needed>
      ) : Icon ? (
        <Icon style={{ width: '85%', height: '85%' }} />
      ) : null}
    </div>
  )
}
