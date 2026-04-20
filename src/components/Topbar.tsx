'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_TABS = [
  { label: 'Field library', href: '/' },
  { label: 'Matter management', href: '/matter' },
]

export default function Topbar() {
  const pathname = usePathname()
  return (
    <div className="topbar">
      <span className="topbar-logo">LawVu</span>
      <nav className="topbar-nav">
        {NAV_TABS.map(tab => {
          const active = tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`topbar-nav-tab${active ? ' active' : ''}`}
            >
              {tab.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
