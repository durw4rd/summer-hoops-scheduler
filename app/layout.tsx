import type { Metadata } from 'next'
import './globals.css'
import SessionProviderWrapper from '@/components/SessionProviderWrapper'
import LaunchDarklyProvider from '@/components/LaunchDarklyProvider'

export const metadata: Metadata = {
  title: 'Summer Hoops Scheduler',
  description: 'App to view and manage summer hoops schedule',
  generator: 'v0.dev + cursor',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <SessionProviderWrapper>
          <LaunchDarklyProvider>
            {children}
          </LaunchDarklyProvider>
        </SessionProviderWrapper>
      </body>
    </html>
  )
}
