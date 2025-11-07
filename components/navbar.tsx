'use client'

import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { colors } from '@/lib/design-system'

export function Navbar() {
  const { profile, signOut } = useAuth()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  if (!profile) return null

  const isActive = (path: string) => pathname === path

  // Définir les onglets selon le rôle
  const tabs = [
    { name: 'Accueil', path: '/', icon: '🏠', roles: ['admin', 'moderator', 'standard'] },
    { name: 'Vins', path: '/vins', icon: '🍷', roles: ['admin', 'moderator', 'standard'] },
    { name: 'Articles', path: '/articles', icon: '📦', roles: ['admin', 'moderator', 'standard'] },
    { name: 'Comptes', path: '/comptes', icon: '👥', roles: ['admin'] },
    { name: 'Paramétrage', path: '/parametrage', icon: '⚙️', roles: ['admin'] },
  ]

  const visibleTabs = tabs.filter(tab => tab.roles.includes(profile.role))

  const roleColors = {
    admin: colors.primary[600],
    moderator: colors.info.DEFAULT,
    standard: colors.success.DEFAULT
  }

  const roleLabels = {
    admin: 'Admin',
    moderator: 'Modérateur',
    standard: 'Standard'
  }

  return (
    <nav style={{
      backgroundColor: '#ffffff',
      boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo et titre */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🍷</span>
              <div className="flex flex-col">
                <h1 className="text-lg sm:text-xl font-bold leading-tight" style={{ color: colors.neutral[900] }}>
                  Cave à Vin
                </h1>
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full inline-block w-fit"
                  style={{
                    backgroundColor: `${roleColors[profile.role]}15`,
                    color: roleColors[profile.role]
                  }}
                >
                  {roleLabels[profile.role]}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation tabs - Tablet and Desktop */}
          <div className="hidden md:flex items-center gap-2">
            {visibleTabs.map(tab => (
              <Link
                key={tab.path}
                href={tab.path}
                className="px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                style={{
                  backgroundColor: isActive(tab.path) ? colors.primary[600] : 'transparent',
                  color: isActive(tab.path) ? '#ffffff' : colors.neutral[600],
                  boxShadow: isActive(tab.path) ? '0 2px 8px rgba(224, 96, 85, 0.25)' : 'none'
                }}
                onMouseEnter={(e) => {
                  if (!isActive(tab.path)) {
                    e.currentTarget.style.backgroundColor = colors.neutral[100]
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive(tab.path)) {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }
                }}
              >
                <span>{tab.icon}</span>
                <span className="hidden lg:inline">{tab.name}</span>
              </Link>
            ))}
          </div>

          {/* User menu - Desktop */}
          <div className="hidden md:flex items-center gap-3">
            <div className="text-right hidden lg:block">
              <p className="text-sm font-medium" style={{ color: colors.neutral[900] }}>
                {profile.full_name || profile.email?.split('@')[0]}
              </p>
              <p className="text-xs" style={{ color: colors.neutral[500] }}>
                {profile.email}
              </p>
            </div>
            <button
              onClick={() => signOut()}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                backgroundColor: colors.primary[600],
                color: '#ffffff',
                boxShadow: '0 2px 8px rgba(224, 96, 85, 0.25)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.primary[700]
                e.currentTarget.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = colors.primary[600]
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              Déconnexion
            </button>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg transition-colors"
            style={{
              backgroundColor: mobileMenuOpen ? colors.neutral[100] : 'transparent',
              color: colors.neutral[700]
            }}
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4">
            <div className="flex flex-col gap-2">
              {visibleTabs.map(tab => (
                <Link
                  key={tab.path}
                  href={tab.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 rounded-lg text-sm font-medium transition-all flex items-center gap-3"
                  style={{
                    backgroundColor: isActive(tab.path) ? colors.primary[600] : colors.neutral[50],
                    color: isActive(tab.path) ? '#ffffff' : colors.neutral[700]
                  }}
                >
                  <span className="text-xl">{tab.icon}</span>
                  <span>{tab.name}</span>
                </Link>
              ))}
              <div className="border-t pt-3 mt-2" style={{ borderColor: colors.neutral[200] }}>
                <div className="px-4 py-2 mb-2">
                  <p className="text-sm font-medium" style={{ color: colors.neutral[900] }}>
                    {profile.full_name || profile.email}
                  </p>
                  <p className="text-xs" style={{ color: colors.neutral[500] }}>
                    {profile.email}
                  </p>
                </div>
                <button
                  onClick={() => signOut()}
                  className="w-full px-4 py-3 rounded-lg text-sm font-medium transition-all"
                  style={{
                    backgroundColor: colors.primary[600],
                    color: '#ffffff'
                  }}
                >
                  Déconnexion
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
