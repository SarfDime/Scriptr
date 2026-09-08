import { Button } from '@/components/common/Button'
import { NextLink } from '@/components/common/NextLink'
import { PageLayout } from '@/components/layout/PageLayout'
import { Text } from '@/components/typography/Text'
import { Title } from '@/components/typography/Title'
import { Card } from '@/components/ui/Card'

export default function AuthPage() {
  return (
    <PageLayout contentClassName='flex items-center justify-center min-h-[60vh]'>
      <Card className='w-full max-w-md p-6 ui-stack gap-4'>
        <Card.Header>
          <Title as='h1' className='ui-title font-bold text-center'>
            Sign in to Scriptr
          </Title>
        </Card.Header>
        <Card.Body className='ui-stack gap-4 text-center'>
          <Text className='ui-body text-grey-500'>
            Access your academic subjects, saved scripts, and study materials.
          </Text>
          <NextLink href='/' className='w-full'>
            <Button className='button solid w-full justify-center'>
              Continue as Guest
            </Button>
          </NextLink>
        </Card.Body>
      </Card>
    </PageLayout>
  )
}
