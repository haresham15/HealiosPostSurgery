import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Metadata } from 'next'

const sansFont = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const monoFont = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Healios — Clinical Post-Surgical Recovery Concierge & Telemetry',
  description: 'Medical-grade AI wound monitoring, multimodal recovery indexing, and acute post-operative telemetry.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${sansFont.variable} ${monoFont.variable} font-sans antialiased bg-background text-foreground`} suppressHydrationWarning={true}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
