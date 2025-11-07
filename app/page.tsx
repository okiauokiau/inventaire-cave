'use client'

import { ProtectedRoute } from '@/components/protected-route'
import { Navbar } from '@/components/navbar'
import { useAuth } from '@/lib/auth-context'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { colors, shadows, borderRadius } from '@/lib/design-system'

type Stats = {
  totalVins: number
  totalArticles: number
  totalUsers: number
  vinsEnVente: number
  vinsAcceptes: number
  vinsVendus: number
  articlesEnVente: number
  articlesAcceptes: number
  articlesVendus: number
}

export default function HomePage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  )
}

function DashboardContent() {
  const { profile } = useAuth()
  const [stats, setStats] = useState<Stats>({
    totalVins: 0,
    totalArticles: 0,
    totalUsers: 0,
    vinsEnVente: 0,
    vinsAcceptes: 0,
    vinsVendus: 0,
    articlesEnVente: 0,
    articlesAcceptes: 0,
    articlesVendus: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [profile])

  async function fetchStats() {
    try {
      // Statistiques sur les vins
      const { data: vinsData } = await supabase
        .from('vins')
        .select('status', { count: 'exact' })

      const totalVins = vinsData?.length || 0
      const vinsEnVente = vinsData?.filter(v => v.status === 'en_vente' || !v.status).length || 0
      const vinsAcceptes = vinsData?.filter(v => v.status === 'accepte').length || 0
      const vinsVendus = vinsData?.filter(v => v.status === 'vendu').length || 0

      // Statistiques sur les articles (si la table existe)
      const { data: articlesData } = await supabase
        .from('standard_articles')
        .select('status', { count: 'exact' })
        .throwOnError()
        .then(res => res)
        .catch(() => ({ data: null }))

      const totalArticles = articlesData?.length || 0
      const articlesEnVente = articlesData?.filter(a => a.status === 'en_vente' || !a.status).length || 0
      const articlesAcceptes = articlesData?.filter(a => a.status === 'accepte').length || 0
      const articlesVendus = articlesData?.filter(a => a.status === 'vendu').length || 0

      // Statistiques sur les utilisateurs (admin uniquement)
      let totalUsers = 0
      if (profile?.role === 'admin') {
        const { count } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
        totalUsers = count || 0
      }

      setStats({
        totalVins,
        totalArticles,
        totalUsers,
        vinsEnVente,
        vinsAcceptes,
        vinsVendus,
        articlesEnVente,
        articlesAcceptes,
        articlesVendus,
      })
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-xl" style={{ color: '#6b7280' }}>Chargement...</div>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen" style={{
        background: `linear-gradient(135deg, ${colors.neutral[50]} 0%, ${colors.primary[50]} 100%)`
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          {/* Header */}
          <div className="mb-4 sm:mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold mb-1" style={{
              color: colors.neutral[900],
              letterSpacing: '-0.02em'
            }}>
              Tableau de bord
            </h1>
            <p className="text-sm" style={{ color: colors.neutral[600] }}>
              Bienvenue, <span style={{ color: colors.primary[600], fontWeight: '600' }}>
                {profile?.full_name || profile?.email?.split('@')[0]}
              </span>
            </p>
          </div>

          {/* Statistiques principales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4 sm:mb-6">
            {/* Vins */}
            <Link href="/vins" className="group">
              <div
                className="p-4 sm:p-5 rounded-xl transition-all duration-300"
                style={{
                  backgroundColor: '#ffffff',
                  boxShadow: shadows.card,
                  borderTop: `4px solid ${colors.accent[500]}`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = shadows.cardHover
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = shadows.card
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base sm:text-lg font-semibold" style={{ color: colors.neutral[700] }}>
                    Vins
                  </h3>
                  <div style={{
                    backgroundColor: colors.accent[50],
                    padding: '0.5rem',
                    borderRadius: borderRadius.DEFAULT
                  }}>
                    <span className="text-2xl">🍷</span>
                  </div>
                </div>
                <p className="text-3xl sm:text-4xl font-bold mb-3" style={{ color: colors.accent[600] }}>
                  {stats.totalVins}
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span style={{ color: colors.neutral[600] }}>En vente</span>
                    <span className="font-semibold px-2 py-1 rounded-md" style={{
                      backgroundColor: colors.info.light,
                      color: colors.info.dark
                    }}>{stats.vinsEnVente}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span style={{ color: colors.neutral[600] }}>Acceptés</span>
                    <span className="font-semibold px-2 py-1 rounded-md" style={{
                      backgroundColor: colors.warning.light,
                      color: colors.warning.dark
                    }}>{stats.vinsAcceptes}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span style={{ color: colors.neutral[600] }}>Vendus</span>
                    <span className="font-semibold px-2 py-1 rounded-md" style={{
                      backgroundColor: colors.success.light,
                      color: colors.success.dark
                    }}>{stats.vinsVendus}</span>
                  </div>
                </div>
              </div>
            </Link>

            {/* Articles */}
            <Link href="/articles" className="group">
              <div
                className="p-4 sm:p-5 rounded-xl transition-all duration-300"
                style={{
                  backgroundColor: '#ffffff',
                  boxShadow: shadows.card,
                  borderTop: `4px solid ${colors.primary[500]}`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = shadows.cardHover
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = shadows.card
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base sm:text-lg font-semibold" style={{ color: colors.neutral[700] }}>
                    Articles
                  </h3>
                  <div style={{
                    backgroundColor: colors.primary[50],
                    padding: '0.5rem',
                    borderRadius: borderRadius.DEFAULT
                  }}>
                    <span className="text-2xl">📦</span>
                  </div>
                </div>
                <p className="text-3xl sm:text-4xl font-bold mb-3" style={{ color: colors.primary[600] }}>
                  {stats.totalArticles}
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span style={{ color: colors.neutral[600] }}>En vente</span>
                    <span className="font-semibold px-2 py-1 rounded-md" style={{
                      backgroundColor: colors.info.light,
                      color: colors.info.dark
                    }}>{stats.articlesEnVente}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span style={{ color: colors.neutral[600] }}>Acceptés</span>
                    <span className="font-semibold px-2 py-1 rounded-md" style={{
                      backgroundColor: colors.warning.light,
                      color: colors.warning.dark
                    }}>{stats.articlesAcceptes}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span style={{ color: colors.neutral[600] }}>Vendus</span>
                    <span className="font-semibold px-2 py-1 rounded-md" style={{
                      backgroundColor: colors.success.light,
                      color: colors.success.dark
                    }}>{stats.articlesVendus}</span>
                  </div>
                </div>
              </div>
            </Link>

            {/* Utilisateurs (admin uniquement) */}
            {profile?.role === 'admin' && (
              <Link href="/comptes" className="group">
                <div
                  className="p-4 sm:p-5 rounded-xl transition-all duration-300"
                  style={{
                    backgroundColor: '#ffffff',
                    boxShadow: shadows.card,
                    borderTop: `4px solid ${colors.info.DEFAULT}`
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = shadows.cardHover
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = shadows.card
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base sm:text-lg font-semibold" style={{ color: colors.neutral[700] }}>
                      Utilisateurs
                    </h3>
                    <div style={{
                      backgroundColor: colors.info.light,
                      padding: '0.5rem',
                      borderRadius: borderRadius.DEFAULT
                    }}>
                      <span className="text-2xl">👥</span>
                    </div>
                  </div>
                  <p className="text-3xl sm:text-4xl font-bold mb-3" style={{ color: colors.info.DEFAULT }}>
                    {stats.totalUsers}
                  </p>
                  <p className="text-sm" style={{ color: colors.neutral[600] }}>
                    Comptes enregistrés
                  </p>
                </div>
              </Link>
            )}
          </div>

          {/* Actions rapides - Visible uniquement pour admin et moderator */}
          {profile?.role && ['admin', 'moderator'].includes(profile.role) && (
            <div>
              <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4" style={{
                color: colors.neutral[900],
                letterSpacing: '-0.01em'
              }}>
                Actions rapides
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <Link href="/vins/nouveau" className="group">
                  <div
                    className="p-4 rounded-xl transition-all duration-300 flex items-center gap-3"
                    style={{
                      backgroundColor: '#ffffff',
                      boxShadow: shadows.card,
                      border: `2px solid ${colors.accent[100]}`
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = shadows.cardHover
                      e.currentTarget.style.borderColor = colors.accent[300]
                      e.currentTarget.style.transform = 'translateY(-2px)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = shadows.card
                      e.currentTarget.style.borderColor = colors.accent[100]
                      e.currentTarget.style.transform = 'translateY(0)'
                    }}
                  >
                    <div style={{
                      backgroundColor: colors.accent[50],
                      padding: '0.5rem',
                      borderRadius: borderRadius.DEFAULT,
                      flexShrink: 0
                    }}>
                      <span className="text-2xl">🍷</span>
                    </div>
                    <div>
                      <p className="font-semibold text-sm sm:text-base" style={{ color: colors.neutral[900] }}>
                        Nouveau vin
                      </p>
                      <p className="text-xs sm:text-sm" style={{ color: colors.neutral[600] }}>
                        Ajouter une bouteille
                      </p>
                    </div>
                  </div>
                </Link>

                <Link href="/articles/nouveau" className="group">
                  <div
                    className="p-4 rounded-xl transition-all duration-300 flex items-center gap-3"
                    style={{
                      backgroundColor: '#ffffff',
                      boxShadow: shadows.card,
                      border: `2px solid ${colors.primary[100]}`
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = shadows.cardHover
                      e.currentTarget.style.borderColor = colors.primary[300]
                      e.currentTarget.style.transform = 'translateY(-2px)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = shadows.card
                      e.currentTarget.style.borderColor = colors.primary[100]
                      e.currentTarget.style.transform = 'translateY(0)'
                    }}
                  >
                    <div style={{
                      backgroundColor: colors.primary[50],
                      padding: '0.5rem',
                      borderRadius: borderRadius.DEFAULT,
                      flexShrink: 0
                    }}>
                      <span className="text-2xl">📦</span>
                    </div>
                    <div>
                      <p className="font-semibold text-sm sm:text-base" style={{ color: colors.neutral[900] }}>
                        Nouvel article
                      </p>
                      <p className="text-xs sm:text-sm" style={{ color: colors.neutral[600] }}>
                        Créer un article
                      </p>
                    </div>
                  </div>
                </Link>

                {profile?.role === 'admin' && (
                  <Link href="/parametrage" className="group">
                    <div
                      className="p-4 rounded-xl transition-all duration-300 flex items-center gap-3"
                      style={{
                        backgroundColor: '#ffffff',
                        boxShadow: shadows.card,
                        border: `2px solid ${colors.neutral[200]}`
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = shadows.cardHover
                        e.currentTarget.style.borderColor = colors.neutral[300]
                        e.currentTarget.style.transform = 'translateY(-2px)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = shadows.card
                        e.currentTarget.style.borderColor = colors.neutral[200]
                        e.currentTarget.style.transform = 'translateY(0)'
                      }}
                    >
                      <div style={{
                        backgroundColor: colors.neutral[100],
                        padding: '0.5rem',
                        borderRadius: borderRadius.DEFAULT,
                        flexShrink: 0
                      }}>
                        <span className="text-2xl">⚙️</span>
                      </div>
                      <div>
                        <p className="font-semibold text-sm sm:text-base" style={{ color: colors.neutral[900] }}>
                          Paramétrage
                        </p>
                        <p className="text-xs sm:text-sm" style={{ color: colors.neutral[600] }}>
                          Tags et catégories
                        </p>
                      </div>
                    </div>
                  </Link>
                )}

                {profile?.role === 'admin' && (
                  <Link href="/comptes" className="group">
                    <div
                      className="p-4 rounded-xl transition-all duration-300 flex items-center gap-3"
                      style={{
                        backgroundColor: '#ffffff',
                        boxShadow: shadows.card,
                        border: `2px solid ${colors.info.light}`
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = shadows.cardHover
                        e.currentTarget.style.borderColor = colors.info.DEFAULT
                        e.currentTarget.style.transform = 'translateY(-2px)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = shadows.card
                        e.currentTarget.style.borderColor = colors.info.light
                        e.currentTarget.style.transform = 'translateY(0)'
                      }}
                    >
                      <div style={{
                        backgroundColor: colors.info.light,
                        padding: '0.5rem',
                        borderRadius: borderRadius.DEFAULT,
                        flexShrink: 0
                      }}>
                        <span className="text-2xl">👥</span>
                      </div>
                      <div>
                        <p className="font-semibold text-sm sm:text-base" style={{ color: colors.neutral[900] }}>
                          Gérer les comptes
                        </p>
                        <p className="text-xs sm:text-sm" style={{ color: colors.neutral[600] }}>
                          Administration
                        </p>
                      </div>
                    </div>
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
