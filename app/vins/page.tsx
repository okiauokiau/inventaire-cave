'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Vin } from '@/types'
import Link from 'next/link'
import { ProtectedRoute } from '@/components/protected-route'
import { Navbar } from '@/components/navbar'
import { useAuth } from '@/lib/auth-context'
import { colors, shadows, borderRadius, spacing } from '@/lib/design-system'

export default function VinsPage() {
  return (
    <ProtectedRoute>
      <VinsContent />
    </ProtectedRoute>
  )
}

function VinsContent() {
  const { profile } = useAuth()
  const [vins, setVins] = useState<Vin[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchVins()
  }, [])

  async function fetchVins() {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setVins([])
        setLoading(false)
        return
      }

      // Récupérer le profil pour vérifier le rôle
      const { data: profileData } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      const userRole = profileData?.role

      // Si admin, récupérer tous les vins
      if (userRole === 'admin') {
        const { data: vinsData, error: vinsError } = await supabase
          .from('vins')
          .select('*')
          .order('created_at', { ascending: false })

        if (vinsError) throw vinsError

        // Compter les bouteilles pour chaque vin
        const vinsWithCount = await Promise.all(
          (vinsData || []).map(async (vin) => {
            const { count } = await supabase
              .from('bouteilles')
              .select('*', { count: 'exact', head: true })
              .eq('vin_id', vin.id)

            return {
              ...vin,
              nombre_bouteilles: count || 0
            }
          })
        )

        setVins(vinsWithCount)
      } else {
        // Pour les non-admins, filtrer par canaux assignés

        // 1. Récupérer les canaux de l'utilisateur
        const { data: userChannelsData } = await supabase
          .from('user_channels')
          .select('channel_id')
          .eq('user_id', user.id)

        const userChannelIds = userChannelsData?.map(uc => uc.channel_id) || []

        if (userChannelIds.length === 0) {
          // L'utilisateur n'a aucun canal assigné, ne voir aucun vin
          setVins([])
          setLoading(false)
          return
        }

        // 2. Récupérer les vins associés à ces canaux via la table vin_channels
        const { data: vinChannelsData } = await supabase
          .from('vin_channels')
          .select('vin_id')
          .in('channel_id', userChannelIds)

        const vinIds = [...new Set(vinChannelsData?.map(vc => vc.vin_id) || [])]

        if (vinIds.length === 0) {
          setVins([])
          setLoading(false)
          return
        }

        // 3. Récupérer les vins filtrés
        const { data: vinsData, error: vinsError } = await supabase
          .from('vins')
          .select('*')
          .in('id', vinIds)
          .order('created_at', { ascending: false })

        if (vinsError) throw vinsError

        // Compter les bouteilles pour chaque vin
        const vinsWithCount = await Promise.all(
          (vinsData || []).map(async (vin) => {
            const { count } = await supabase
              .from('bouteilles')
              .select('*', { count: 'exact', head: true })
              .eq('vin_id', vin.id)

            return {
              ...vin,
              nombre_bouteilles: count || 0
            }
          })
        )

        setVins(vinsWithCount)
      }
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredVins = vins.filter(vin =>
    vin.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vin.producteur?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vin.millesime?.toString().includes(searchTerm)
  )

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center" style={{
          background: `linear-gradient(135deg, ${colors.neutral[50]} 0%, ${colors.accent[50]} 100%)`
        }}>
          <div className="text-xl font-medium" style={{ color: colors.neutral[700] }}>
            Chargement...
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen" style={{
        background: `linear-gradient(135deg, ${colors.neutral[50]} 0%, ${colors.accent[50]} 100%)`
      }}>
        {/* Header */}
        <div style={{
          background: `linear-gradient(135deg, ${colors.accent[600]} 0%, ${colors.accent[700]} 100%)`,
          boxShadow: shadows.md
        }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  padding: '0.75rem',
                  borderRadius: borderRadius.lg
                }}>
                  <span className="text-3xl sm:text-4xl">🍷</span>
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white" style={{
                    letterSpacing: '-0.025em'
                  }}>
                    Vins
                  </h1>
                  <p className="text-sm sm:text-base mt-1" style={{
                    color: 'rgba(255, 255, 255, 0.9)'
                  }}>
                    Gestion de la collection
                  </p>
                </div>
              </div>
              <div className="flex gap-2 sm:gap-3 flex-wrap">
                {profile?.role && ['admin', 'moderator'].includes(profile.role) && (
                  <Link
                    href="/vins/nouveau"
                    className="px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold transition-all text-center text-sm sm:text-base"
                    style={{
                      backgroundColor: '#ffffff',
                      color: colors.accent[600],
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)'
                    }}
                  >
                    + Nouveau vin
                  </Link>
                )}
                <Link
                  href="/"
                  className="px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold transition-all text-center text-sm sm:text-base"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    color: '#ffffff'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  ← Retour
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Rechercher un vin..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 sm:py-3.5 pl-12 text-sm sm:text-base transition-all"
                style={{
                  backgroundColor: '#ffffff',
                  border: `2px solid ${colors.neutral[200]}`,
                  borderRadius: borderRadius.lg,
                  color: colors.neutral[900],
                  boxShadow: shadows.sm
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = colors.accent[500]
                  e.currentTarget.style.boxShadow = shadows.md
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = colors.neutral[200]
                  e.currentTarget.style.boxShadow = shadows.sm
                }}
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg sm:text-xl">
                🔍
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="mb-6 px-2 text-sm sm:text-base font-medium" style={{ color: colors.neutral[600] }}>
            {filteredVins.length} vin{filteredVins.length > 1 ? 's' : ''} trouvé{filteredVins.length > 1 ? 's' : ''}
          </div>

          {/* Liste des vins */}
          {filteredVins.length === 0 ? (
            <div className="text-center py-12 sm:py-16 px-4" style={{
              backgroundColor: '#ffffff',
              borderRadius: borderRadius.xl,
              boxShadow: shadows.card
            }}>
              <div style={{
                backgroundColor: colors.accent[50],
                width: '4rem',
                height: '4rem',
                borderRadius: borderRadius.full,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem'
              }}>
                <span className="text-3xl">🍷</span>
              </div>
              <p className="text-lg sm:text-xl font-medium mb-4" style={{ color: colors.neutral[700] }}>
                Aucun vin trouvé
              </p>
              {profile?.role && ['admin', 'moderator'].includes(profile.role) && (
                <Link
                  href="/vins/nouveau"
                  className="inline-block px-6 py-2.5 rounded-lg font-semibold transition-all text-sm sm:text-base"
                  style={{
                    backgroundColor: colors.accent[600],
                    color: '#ffffff'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.accent[700]
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = colors.accent[600]
                  }}
                >
                  Créer votre premier vin
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredVins.map((vin) => (
                <Link
                  key={vin.id}
                  href={`/vins/${vin.id}`}
                  className="group"
                >
                  <div
                    className="p-5 sm:p-6 transition-all duration-300"
                    style={{
                      backgroundColor: '#ffffff',
                      borderRadius: borderRadius.xl,
                      boxShadow: shadows.card,
                      borderTop: `4px solid ${colors.accent[500]}`,
                      height: '100%'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = shadows.cardHover
                      e.currentTarget.style.transform = 'translateY(-4px)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = shadows.card
                      e.currentTarget.style.transform = 'translateY(0)'
                    }}
                  >
                    {/* En-tête */}
                    <div className="flex justify-between items-start gap-3 mb-3">
                      <h3 className="text-lg sm:text-xl font-bold line-clamp-2" style={{
                        color: colors.neutral[900],
                        letterSpacing: '-0.025em'
                      }}>
                        {vin.nom}
                      </h3>
                      {vin.millesime && (
                        <span className="text-base sm:text-lg font-bold px-3 py-1 rounded-lg shrink-0" style={{
                          backgroundColor: colors.accent[50],
                          color: colors.accent[700]
                        }}>
                          {vin.millesime}
                        </span>
                      )}
                    </div>

                    {/* Producteur */}
                    {vin.producteur && (
                      <p className="text-sm sm:text-base mb-4 line-clamp-1" style={{ color: colors.neutral[600] }}>
                        {vin.producteur}
                      </p>
                    )}

                    {/* Nombre de bouteilles */}
                    <div className="mb-3">
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-bold rounded-lg" style={{
                        backgroundColor: colors.accent[100],
                        color: colors.accent[700]
                      }}>
                        🍾 {vin.nombre_bouteilles ?? 0} bouteille{(vin.nombre_bouteilles ?? 0) > 1 ? 's' : ''}
                      </span>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mt-auto">
                      {vin.couleur && (
                        <span className="px-3 py-1 text-xs sm:text-sm font-medium rounded-full" style={{
                          backgroundColor: colors.neutral[100],
                          color: colors.neutral[700]
                        }}>
                          {vin.couleur}
                        </span>
                      )}
                      {vin.region && (
                        <span className="px-3 py-1 text-xs sm:text-sm font-medium rounded-full" style={{
                          backgroundColor: colors.neutral[100],
                          color: colors.neutral[700]
                        }}>
                          {vin.region}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
