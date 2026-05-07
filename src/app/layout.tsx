import type { Metadata } from 'next'
import './globals.css'
import Topbar from '@/components/Topbar'

export const metadata: Metadata = {
  title: 'LawVu — Field Library',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Lato:wght@300;400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Topbar />
        {children}
      </body>
    </html>
  )
}
