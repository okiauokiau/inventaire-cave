'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

type ProtectedRouteProps = {
  children: React.ReactNode
  requiredRole?: 'admin' | 'moderator' | 'standard'
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      // Si pas connecté, rediriger vers login
      if (!user) {
        router.push('/login')
        return
      }

      // Si rôle requis et utilisateur n'a pas le bon rôle
      if (requiredRole && profile) {
        const roleHierarchy = { admin: 3, moderator: 2, standard: 1 }
        const userRoleLevel = roleHierarchy[profile.role]
        const requiredRoleLevel = roleHierarchy[requiredRole]

        if (userRoleLevel < requiredRoleLevel) {
          router.push('/')
        }
      }
    }
  }, [user, profile, loading, requiredRole, router])

  // Afficher un loader pendant le chargement
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div
            className="inline-block animate-spin rounded-full border-4 border-solid border-current border-r-transparent h-12 w-12"
            style={{ color: '#2563eb' }}
          />
          <p className="mt-4" style={{ color: '#6b7280' }}>
            Chargement...
          </p>
        </div>
      </div>
    )
  }

  // Si pas d'utilisateur, ne rien afficher (redirection en cours)
  if (!user) {
    return null
  }

  // Si rôle requis et pas de profil encore chargé
  if (requiredRole && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p style={{ color: '#6b7280' }}>Chargement du profil...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
