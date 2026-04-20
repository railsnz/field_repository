'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function AppTabs() {
  const pathname = usePathname()
  return (
    <nav className="app-tabs">
      <Link
        href="/"
        className={`app-tab${pathname === '/' ? ' active' : ''}`}
      >
        Field management
      </Link>
      <Link
        href="/matter"
        className={`app-tab${pathname.startsWith('/matter') ? ' active' : ''}`}
      >
        Matter management
      </Link>
    </nav>
  )
}
