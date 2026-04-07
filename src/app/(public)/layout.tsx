import type { Metadata } from 'next'
import { APP_DEFAULTS } from '@/lib/constants'

export const metadata: Metadata = {
  title: {
    default: `${APP_DEFAULTS.APP_NAME} - Sales Management System`,
    template: `%s | ${APP_DEFAULTS.APP_NAME}`,
  },
  description: 'Modern Sales & Transaction Management System',
}

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
