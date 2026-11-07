import { Box, Button, Card, Inline, Stack, Text, TextInput } from '@sanity/ui'
import { ACCESS_CODE_LENGTH } from '@shared/config/access'
import { useState } from 'react'
import { requestAccessToken } from '../lib/api-access'

const CODE_PATTERN = new RegExp(`^\\d{${ACCESS_CODE_LENGTH}}$`)

type AccessCodeFormProps = {
  /** What the action is about to do, shown above the code field. */
  message: string
  onCancel: () => void
  /** Called once the API accepted the code and the token is cached. */
  onAuthorized: () => void
}

/**
 * Rendered as the content of a document action's dialog. Exchanges the
 * authenticator code for a twenty-minute token; the action then continues on
 * its own, so the code is entered once per twenty minutes rather than per
 * request.
 */
export function AccessCodeForm({
  message,
  onCancel,
  onAuthorized,
}: AccessCodeFormProps) {
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const trimmedCode = code.trim()
  const canSubmit = CODE_PATTERN.test(trimmedCode) && !isSubmitting

  const submit = async () => {
    setIsSubmitting(true)
    setError(null)

    try {
      await requestAccessToken(trimmedCode)
      onAuthorized()
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'The access code was rejected.'
      )
      setIsSubmitting(false)
    }
  }

  return (
    <Card padding={4}>
      <Stack gap={4}>
        <Text size={1}>{message}</Text>
        <Stack gap={2}>
          <Text size={1} weight='semibold'>
            Access code
          </Text>
          <TextInput
            aria-label='Six-digit access code'
            autoComplete='one-time-code'
            disabled={isSubmitting}
            inputMode='numeric'
            maxLength={ACCESS_CODE_LENGTH}
            onChange={(event) => setCode(event.currentTarget.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && canSubmit) submit()
            }}
            placeholder={'1'.repeat(ACCESS_CODE_LENGTH)}
            value={code}
          />
          <Text muted size={1}>
            The code from your authenticator app. It unlocks write access for
            twenty minutes.
          </Text>
        </Stack>
        {error ? (
          <Box>
            <Text size={1} style={{ color: 'var(--card-critical-fg-color)' }}>
              {error}
            </Text>
          </Box>
        ) : null}
        <Inline gap={2}>
          <Button
            disabled={isSubmitting}
            mode='ghost'
            onClick={onCancel}
            text='Cancel'
          />
          <Button
            disabled={!canSubmit}
            loading={isSubmitting}
            onClick={submit}
            text='Continue'
            tone='primary'
          />
        </Inline>
      </Stack>
    </Card>
  )
}
