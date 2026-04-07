import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    default: 'TransMan - Sales Management System',
    template: '%s | TransMan',
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
