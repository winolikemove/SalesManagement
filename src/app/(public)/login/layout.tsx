import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Login - TransMan',
  description: 'Sign in to TransMan Sales Management System',
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
