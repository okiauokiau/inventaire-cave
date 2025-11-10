'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { ProtectedRoute } from '@/components/protected-route'
import { Navbar } from '@/components/navbar'
import { useAuth } from '@/lib/auth-context'
import { colors, shadows, borderRadius, spacing } from '@/lib/design-system'

type Article = {
  id: string
  nom: string
  description: string | null
  prix_achat: number | null
  prix_vente: number | null
  quantite: number
  categorie: string | null
  status: 'en_vente' | 'accepte' | 'vendu' | 'archive'
  created_at: string
  created_by: string
  channel_id: string | null
  channels?: SalesChannel[]
}

type SalesChannel = {
  id: string
  name: string
}

export default function ArticlesPage() {
  return (
    <ProtectedRoute>
      <ArticlesContent />
    </ProtectedRoute>
  )
}

function ArticlesContent() {
  const { profile } = useAuth()
  const [articles, setArticles] = useState<Article[]>([])
  const [channels, setChannels] = useState<SalesChannel[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterChannel, setFilterChannel] = useState<string>('all')

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setArticles([])
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

      // Si admin, récupérer tous les articles
      if (userRole === 'admin') {
        const { data: articlesData, error: articlesError } = await supabase
          .from('standard_articles')
          .select('*')
          .order('created_at', { ascending: false })

        if (articlesError) throw articlesError

        // Charger les canaux pour chaque article
        if (articlesData) {
          const articlesWithChannels = await Promise.all(
            articlesData.map(async (article) => {
              const { data: articleChannels } = await supabase
                .from('article_channels')
                .select(`
                  channel_id,
                  sales_channels (id, name)
                `)
                .eq('article_id', article.id)

              return {
                ...article,
                channels: articleChannels?.map(ac => ac.sales_channels).filter(Boolean) || []
              }
            })
          )
          setArticles(articlesWithChannels)
        }

        // Admin voit tous les canaux
        const { data: channelsData, error: channelsError } = await supabase
          .from('sales_channels')
          .select('*')
          .order('name')

        if (channelsError) throw channelsError
        setChannels(channelsData || [])
      } else {
        // Pour les non-admins, filtrer par canaux assignés

        // 1. Récupérer les canaux de l'utilisateur
        const { data: userChannelsData } = await supabase
          .from('user_channels')
          .select('channel_id, sales_channels(*)')
          .eq('user_id', user.id)

        const userChannelIds = userChannelsData?.map(uc => uc.channel_id) || []

        // Extraire les canaux depuis la relation
        const channelsData = userChannelsData?.map(uc => uc.sales_channels).filter(Boolean) || []
        setChannels(channelsData)

        if (userChannelIds.length === 0) {
          // L'utilisateur n'a aucun canal assigné, ne voir aucun article
          setArticles([])
          setLoading(false)
          return
        }

        // 2. Récupérer les articles associés à ces canaux via la table article_channels
        const { data: articleChannelsData } = await supabase
          .from('article_channels')
          .select('article_id')
          .in('channel_id', userChannelIds)

        const articleIds = [...new Set(articleChannelsData?.map(ac => ac.article_id) || [])]

        if (articleIds.length === 0) {
          setArticles([])
          setLoading(false)
          return
        }

        // 3. Récupérer les articles filtrés
        const { data: articlesData, error: articlesError } = await supabase
          .from('standard_articles')
          .select('*')
          .in('id', articleIds)
          .order('created_at', { ascending: false })

        if (articlesError) throw articlesError

        // Charger les canaux pour chaque article
        if (articlesData) {
          const articlesWithChannels = await Promise.all(
            articlesData.map(async (article) => {
              const { data: articleChannels } = await supabase
                .from('article_channels')
                .select(`
                  channel_id,
                  sales_channels (id, name)
                `)
                .eq('article_id', article.id)

              return {
                ...article,
                channels: articleChannels?.map(ac => ac.sales_channels).filter(Boolean) || []
              }
            })
          )
          setArticles(articlesWithChannels)
        }
      }
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredArticles = articles.filter(article => {
    const matchSearch = article.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       article.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       article.categorie?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchStatus = filterStatus === 'all' || article.status === filterStatus
    const matchChannel = filterChannel === 'all' || article.channels?.some(channel => channel.id === filterChannel)
    return matchSearch && matchStatus && matchChannel
  })

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      en_vente: 'En vente',
      accepte: 'Accepté',
      vendu: 'Vendu',
      archive: 'Archivé'
    }
    return labels[status] || status
  }

  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      en_vente: colors.info.DEFAULT,
      accepte: colors.warning.DEFAULT,
      vendu: colors.success.DEFAULT,
      archive: colors.neutral[500]
    }
    return statusColors[status] || colors.neutral[500]
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center" style={{
          background: `linear-gradient(135deg, ${colors.neutral[50]} 0%, ${colors.primary[50]} 100%)`
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
        background: `linear-gradient(135deg, ${colors.neutral[50]} 0%, ${colors.primary[50]} 100%)`
      }}>
        {/* Header */}
        <div style={{
          background: `linear-gradient(135deg, ${colors.primary[600]} 0%, ${colors.primary[700]} 100%)`,
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
                  <span className="text-3xl sm:text-4xl">📦</span>
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white" style={{
                    letterSpacing: '-0.025em'
                  }}>
                    Articles
                  </h1>
                  <p className="text-sm sm:text-base mt-1" style={{
                    color: 'rgba(255, 255, 255, 0.9)'
                  }}>
                    Gestion des articles standards
                  </p>
                </div>
              </div>
              <div className="flex gap-2 sm:gap-3 flex-wrap">
                {profile?.role && ['admin', 'moderator'].includes(profile.role) && (
                  <Link
                    href="/articles/nouveau"
                    className="px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold transition-all text-center text-sm sm:text-base"
                    style={{
                      backgroundColor: '#ffffff',
                      color: colors.primary[600],
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
                    + Nouvel article
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
          {/* Filtres */}
          <div className="mb-6 space-y-3 sm:space-y-4">
            {/* Recherche */}
            <div className="relative">
              <input
                type="text"
                placeholder="Rechercher un article..."
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
                  e.currentTarget.style.borderColor = colors.primary[500]
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

            {/* Filtres statut et canal */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2.5 sm:py-3 text-sm sm:text-base transition-all"
                style={{
                  backgroundColor: '#ffffff',
                  border: `2px solid ${colors.neutral[200]}`,
                  borderRadius: borderRadius.lg,
                  color: colors.neutral[900],
                  boxShadow: shadows.sm,
                  flex: '1'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = colors.primary[500]
                  e.currentTarget.style.boxShadow = shadows.md
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = colors.neutral[200]
                  e.currentTarget.style.boxShadow = shadows.sm
                }}
              >
                <option value="all">Tous les statuts</option>
                <option value="en_vente">En vente</option>
                <option value="accepte">Accepté</option>
                <option value="vendu">Vendu</option>
                <option value="archive">Archivé</option>
              </select>

              <select
                value={filterChannel}
                onChange={(e) => setFilterChannel(e.target.value)}
                className="px-4 py-2.5 sm:py-3 text-sm sm:text-base transition-all"
                style={{
                  backgroundColor: '#ffffff',
                  border: `2px solid ${colors.neutral[200]}`,
                  borderRadius: borderRadius.lg,
                  color: colors.neutral[900],
                  boxShadow: shadows.sm,
                  flex: '1'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = colors.primary[500]
                  e.currentTarget.style.boxShadow = shadows.md
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = colors.neutral[200]
                  e.currentTarget.style.boxShadow = shadows.sm
                }}
              >
                <option value="all">Tous les canaux</option>
                {channels.map(channel => (
                  <option key={channel.id} value={channel.id}>{channel.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Stats */}
          <div className="mb-6 px-2 text-sm sm:text-base font-medium" style={{ color: colors.neutral[600] }}>
            {filteredArticles.length} article{filteredArticles.length > 1 ? 's' : ''} trouvé{filteredArticles.length > 1 ? 's' : ''}
          </div>

          {/* Liste des articles */}
          {filteredArticles.length === 0 ? (
            <div className="text-center py-12 sm:py-16 px-4" style={{
              backgroundColor: '#ffffff',
              borderRadius: borderRadius.xl,
              boxShadow: shadows.card
            }}>
              <div style={{
                backgroundColor: colors.primary[50],
                width: '4rem',
                height: '4rem',
                borderRadius: borderRadius.full,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem'
              }}>
                <span className="text-3xl">📦</span>
              </div>
              <p className="text-lg sm:text-xl font-medium mb-4" style={{ color: colors.neutral[700] }}>
                Aucun article trouvé
              </p>
              {profile?.role && ['admin', 'moderator'].includes(profile.role) && (
                <Link
                  href="/articles/nouveau"
                  className="inline-block px-6 py-2.5 rounded-lg font-semibold transition-all text-sm sm:text-base"
                  style={{
                    backgroundColor: colors.primary[600],
                    color: '#ffffff'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.primary[700]
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = colors.primary[600]
                  }}
                >
                  Créer votre premier article
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredArticles.map((article) => (
                <Link
                  key={article.id}
                  href={`/articles/${article.id}`}
                  className="group"
                >
                  <div
                    className="p-5 sm:p-6 transition-all duration-300"
                    style={{
                      backgroundColor: '#ffffff',
                      borderRadius: borderRadius.xl,
                      boxShadow: shadows.card,
                      borderTop: `4px solid ${colors.primary[500]}`,
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column'
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
                        letterSpacing: '-0.025em',
                        flex: '1'
                      }}>
                        {article.nom}
                      </h3>
                      <span
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold text-white shrink-0"
                        style={{ backgroundColor: getStatusColor(article.status) }}
                      >
                        {getStatusLabel(article.status)}
                      </span>
                    </div>

                    {/* Description */}
                    {article.description && (
                      <p className="text-sm sm:text-base mb-4 line-clamp-2" style={{ color: colors.neutral[600] }}>
                        {article.description}
                      </p>
                    )}

                    {/* Infos */}
                    <div className="space-y-2 text-xs sm:text-sm mt-auto">
                      {article.categorie && (
                        <div className="flex items-center gap-2">
                          <span style={{ color: colors.neutral[500] }}>Catégorie:</span>
                          <span className="font-medium" style={{ color: colors.neutral[700] }}>{article.categorie}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <span style={{ color: colors.neutral[500] }}>Quantité:</span>
                        <span className="font-medium px-2 py-0.5 rounded" style={{
                          backgroundColor: colors.info.light,
                          color: colors.info.dark
                        }}>
                          {article.quantite}
                        </span>
                      </div>
                      {article.prix_vente && (
                        <div className="flex items-center gap-2">
                          <span style={{ color: colors.neutral[500] }}>Prix de vente:</span>
                          <span className="font-bold" style={{ color: colors.success.DEFAULT }}>
                            {article.prix_vente} €
                          </span>
                        </div>
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
