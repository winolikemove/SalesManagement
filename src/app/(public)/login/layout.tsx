import type { Metadata } from 'next'
import { APP_DEFAULTS } from '@/lib/constants'

export const metadata: Metadata = {
  title: `Login - ${APP_DEFAULTS.APP_NAME}`,
  description: `Sign in to ${APP_DEFAULTS.APP_NAME} Sales Management System`,
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
