import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Kompas',
  description:
    'Internt AI Product Ops-værktøj — versionerede prompts, målte evalueringer og fuldt revisionsspor.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="da" className={inter.variable} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}
