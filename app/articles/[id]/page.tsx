'use client'

import { useState, useEffect, use } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/protected-route'
import { Navbar } from '@/components/navbar'
import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'
import { colors, shadows, borderRadius, spacing } from '@/lib/design-system'

type Article = {
  id: string
  nom: string
  description: string | null
  prix_achat: number | null
  prix_vente: number | null
  quantite: number
  categorie: string | null
  category_id: string | null
  status: 'en_vente' | 'accepte' | 'vendu' | 'archive'
  created_at: string
  created_by: string
  channel_id: string | null
  date_acceptation: string | null
  date_vente: string | null
}

type SalesChannel = {
  id: string
  name: string
}

type Category = {
  id: string
  name: string
  color: string | null
}

type ArticlePhoto = {
  id: string
  article_id: string
  url: string
  ordre: number
}

export default function ArticleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  return (
    <ProtectedRoute>
      <ArticleDetailContent id={resolvedParams.id} />
    </ProtectedRoute>
  )
}

function ArticleDetailContent({ id }: { id: string }) {
  const router = useRouter()
  const { user, profile } = useAuth()
  const [article, setArticle] = useState<Article | null>(null)
  const [channels, setChannels] = useState<SalesChannel[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [photos, setPhotos] = useState<ArticlePhoto[]>([])
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  // States for new photo uploads
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [photosToDelete, setPhotosToDelete] = useState<string[]>([])

  const [formData, setFormData] = useState({
    nom: '',
    description: '',
    prix_achat: '',
    prix_vente: '',
    quantite: '1',
    category_id: '',
    channel_id: '',
    status: 'en_vente' as const
  })

  useEffect(() => {
    fetchData()
  }, [id])

  async function fetchData() {
    try {
      // Charger l'article
      const { data: articleData, error: articleError } = await supabase
        .from('standard_articles')
        .select('*')
        .eq('id', id)
        .single()

      if (articleError) throw articleError
      setArticle(articleData)

      // Charger les canaux
      const { data: channelsData } = await supabase
        .from('sales_channels')
        .select('*')
        .order('name')

      if (channelsData) setChannels(channelsData)

      // Charger les catégories
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .order('name')

      if (categoriesData) setCategories(categoriesData)

      // Charger les photos
      const { data: photosData } = await supabase
        .from('standard_article_photos')
        .select('*')
        .eq('article_id', id)
        .order('ordre', { ascending: true })

      setPhotos(photosData || [])

      // Initialiser le formulaire
      setFormData({
        nom: articleData.nom,
        description: articleData.description || '',
        prix_achat: articleData.prix_achat?.toString() || '',
        prix_vente: articleData.prix_vente?.toString() || '',
        quantite: articleData.quantite.toString(),
        category_id: articleData.category_id || '',
        channel_id: articleData.channel_id || '',
        status: articleData.status
      })
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setSelectedImages(prev => [...prev, ...files])

    // Créer les previews
    files.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeNewImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index))
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  const markPhotoForDeletion = (photoId: string) => {
    setPhotosToDelete(prev =>
      prev.includes(photoId)
        ? prev.filter(id => id !== photoId)
        : [...prev, photoId]
    )
  }

  const handleSave = async () => {
    setSaving(true)

    try {
      // Gestion des dates selon le statut
      let dateAcceptation = null
      let dateVente = null

      if (formData.status === 'accepte') {
        // Garder la date existante ou créer une nouvelle
        dateAcceptation = article?.date_acceptation || new Date().toISOString()
        dateVente = null
      } else if (formData.status === 'vendu') {
        // Garder la date existante ou créer une nouvelle
        dateVente = article?.date_vente || new Date().toISOString()
        dateAcceptation = null
      }
      // Si status = 'en_vente' ou 'archive', les deux dates restent null

      const { error} = await supabase
        .from('standard_articles')
        .update({
          nom: formData.nom,
          description: formData.description || null,
          prix_achat: formData.prix_achat ? parseFloat(formData.prix_achat) : null,
          prix_vente: formData.prix_vente ? parseFloat(formData.prix_vente) : null,
          quantite: parseInt(formData.quantite),
          category_id: formData.category_id || null,
          channel_id: formData.channel_id || null,
          status: formData.status,
          date_acceptation: dateAcceptation,
          date_vente: dateVente
        })
        .eq('id', id)

      if (error) throw error

      // Delete marked photos
      for (const photoId of photosToDelete) {
        const photo = photos.find(p => p.id === photoId)
        if (photo) {
          // Extract file path from URL
          const urlParts = photo.url.split('/article-images/')
          if (urlParts.length > 1) {
            const filePath = decodeURIComponent(urlParts[1])

            // Delete from storage
            await supabase.storage
              .from('article-images')
              .remove([filePath])
          }

          // Delete from database
          await supabase
            .from('standard_article_photos')
            .delete()
            .eq('id', photoId)
        }
      }

      // Upload new images
      if (selectedImages.length > 0) {
        const currentMaxOrdre = photos.length > 0
          ? Math.max(...photos.map(p => p.ordre))
          : -1

        for (let i = 0; i < selectedImages.length; i++) {
          const file = selectedImages[i]
          const fileExt = file.name.split('.').pop()
          const fileName = `${id}/${Date.now()}_${i}.${fileExt}`

          // Upload to Supabase Storage
          const { error: uploadError } = await supabase.storage
            .from('article-images')
            .upload(fileName, file)

          if (uploadError) {
            console.error('Erreur upload image:', uploadError)
            continue
          }

          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('article-images')
            .getPublicUrl(fileName)

          // Save to database
          await supabase
            .from('standard_article_photos')
            .insert([
              {
                article_id: id,
                url: publicUrl,
                ordre: currentMaxOrdre + 1 + i
              }
            ])
        }
      }

      // Reset photo upload states
      setSelectedImages([])
      setImagePreviews([])
      setPhotosToDelete([])

      await fetchData()
      setEditing(false)
      alert('Article mis à jour avec succès')
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la mise à jour')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) return

    try {
      const { error } = await supabase
        .from('standard_articles')
        .delete()
        .eq('id', id)

      if (error) throw error

      router.push('/articles')
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la suppression')
    }
  }

  const canEdit = profile?.role && ['admin', 'moderator'].includes(profile.role) && article?.created_by === user?.id
  const canDelete = profile?.role && ['admin', 'moderator'].includes(profile.role) && article?.created_by === user?.id
  const isAdmin = profile?.role === 'admin'

  if (loading) {
    return (
      <>
        <Navbar />
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ backgroundColor: colors.neutral[50] }}
        >
          <div
            className="text-2xl font-bold"
            style={{ color: colors.primary[600] }}
          >
            Chargement...
          </div>
        </div>
      </>
    )
  }

  if (!article) {
    return (
      <>
        <Navbar />
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ backgroundColor: colors.neutral[50] }}
        >
          <div className="text-center">
            <p
              className="text-xl font-semibold mb-4"
              style={{ color: colors.neutral[700] }}
            >
              Article non trouvé
            </p>
            <Link
              href="/articles"
              className="inline-block px-6 py-3 rounded-lg font-semibold transition-all"
              style={{
                backgroundColor: colors.primary[600],
                color: '#ffffff',
                boxShadow: shadows.md
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.primary[700]
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = colors.primary[600]
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              Retour à la liste
            </Link>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div
        className="min-h-screen"
        style={{ backgroundColor: colors.neutral[50] }}
      >
        {/* Header Section */}
        <div
          className="shadow-md"
          style={{
            background: `linear-gradient(135deg, ${colors.primary[600]} 0%, ${colors.accent[600]} 100%)`,
            color: '#ffffff'
          }}
        >
          <div className="max-w-7xl mx-auto py-6 sm:py-8 md:py-12 px-4 sm:px-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div className="flex-1">
                <Link
                  href="/articles"
                  className="text-sm sm:text-base hover:underline mb-2 block opacity-90 transition-opacity"
                  style={{ color: 'rgba(255, 255, 255, 0.9)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '1'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '0.9'
                  }}
                >
                  ← Retour aux articles
                </Link>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold">
                  {article.nom}
                </h1>
              </div>
              <div className="flex gap-2 sm:gap-3 flex-wrap">
                {canEdit && !editing && (
                  <button
                    onClick={() => setEditing(true)}
                    className="px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold transition-all"
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
                    Modifier
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={handleDelete}
                    className="px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold transition-all"
                    style={{
                      backgroundColor: 'rgba(220, 38, 38, 0.9)',
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      color: '#ffffff',
                      boxShadow: shadows.md
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#dc2626'
                      e.currentTarget.style.transform = 'translateY(-2px)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(220, 38, 38, 0.9)'
                      e.currentTarget.style.transform = 'translateY(0)'
                    }}
                  >
                    Supprimer
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto py-6 sm:py-8 px-4 sm:px-6 space-y-6">
          {/* Main Information Card */}
          <div
            className="rounded-xl p-6 sm:p-8 transition-all hover:shadow-lg"
            style={{
              backgroundColor: '#ffffff',
              boxShadow: shadows.card,
              borderRadius: borderRadius.xl
            }}
          >
            {editing ? (
              /* MODE ÉDITION */
              <div className="space-y-6">
                <h2
                  className="text-2xl sm:text-3xl font-bold mb-6 flex items-center gap-3"
                  style={{ color: colors.neutral[900] }}
                >
                  <span
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center text-xl sm:text-2xl"
                    style={{
                      background: `linear-gradient(135deg, ${colors.primary[500]} 0%, ${colors.primary[700]} 100%)`,
                      color: '#ffffff',
                      boxShadow: shadows.md
                    }}
                  >
                    ✏️
                  </span>
                  Modifier l'article
                </h2>

                <div>
                  <label
                    className="block text-sm font-bold uppercase mb-2"
                    style={{ color: colors.neutral[600] }}
                  >
                    Nom
                  </label>
                  <input
                    type="text"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg transition-all"
                    style={{
                      border: `2px solid ${colors.neutral[200]}`,
                      color: colors.neutral[900]
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = colors.primary[400]
                      e.currentTarget.style.outline = 'none'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = colors.neutral[200]
                    }}
                  />
                </div>

                <div>
                  <label
                    className="block text-sm font-bold uppercase mb-2"
                    style={{ color: colors.neutral[600] }}
                  >
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg transition-all"
                    style={{
                      border: `2px solid ${colors.neutral[200]}`,
                      color: colors.neutral[900]
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = colors.primary[400]
                      e.currentTarget.style.outline = 'none'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = colors.neutral[200]
                    }}
                  />
                </div>

                <div>
                  <label
                    className="block text-sm font-bold uppercase mb-2"
                    style={{ color: colors.neutral[600] }}
                  >
                    Catégorie
                  </label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg transition-all"
                    style={{
                      border: `2px solid ${colors.neutral[200]}`,
                      color: colors.neutral[900]
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = colors.primary[400]
                      e.currentTarget.style.outline = 'none'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = colors.neutral[200]
                    }}
                  >
                    <option value="">-- Sélectionner une catégorie --</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      className="block text-sm font-bold uppercase mb-2"
                      style={{ color: colors.neutral[600] }}
                    >
                      Prix d'achat (€)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.prix_achat}
                      onChange={(e) => setFormData({ ...formData, prix_achat: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg transition-all"
                      style={{
                        border: `2px solid ${colors.neutral[200]}`,
                        color: colors.neutral[900]
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = colors.primary[400]
                        e.currentTarget.style.outline = 'none'
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = colors.neutral[200]
                      }}
                    />
                  </div>
                  <div>
                    <label
                      className="block text-sm font-bold uppercase mb-2"
                      style={{ color: colors.neutral[600] }}
                    >
                      Prix de vente (€)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.prix_vente}
                      onChange={(e) => setFormData({ ...formData, prix_vente: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg transition-all"
                      style={{
                        border: `2px solid ${colors.neutral[200]}`,
                        color: colors.neutral[900]
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = colors.primary[400]
                        e.currentTarget.style.outline = 'none'
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = colors.neutral[200]
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label
                    className="block text-sm font-bold uppercase mb-2"
                    style={{ color: colors.neutral[600] }}
                  >
                    Quantité
                  </label>
                  <input
                    type="number"
                    value={formData.quantite}
                    onChange={(e) => setFormData({ ...formData, quantite: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg transition-all"
                    style={{
                      border: `2px solid ${colors.neutral[200]}`,
                      color: colors.neutral[900]
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = colors.primary[400]
                      e.currentTarget.style.outline = 'none'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = colors.neutral[200]
                    }}
                  />
                </div>

                <div>
                  <label
                    className="block text-sm font-bold uppercase mb-2"
                    style={{ color: colors.neutral[600] }}
                  >
                    Canal de vente
                  </label>
                  <select
                    value={formData.channel_id}
                    onChange={(e) => {
                      // Si on change le canal, réinitialiser le statut à "en_vente"
                      if (e.target.value !== formData.channel_id) {
                        setFormData({ ...formData, channel_id: e.target.value, status: 'en_vente' })
                      } else {
                        setFormData({ ...formData, channel_id: e.target.value })
                      }
                    }}
                    className="w-full px-4 py-3 rounded-lg transition-all"
                    style={{
                      border: `2px solid ${colors.neutral[200]}`,
                      color: colors.neutral[900]
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = colors.primary[400]
                      e.currentTarget.style.outline = 'none'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = colors.neutral[200]
                    }}
                  >
                    <option value="">-- Aucun --</option>
                    {channels.map(channel => (
                      <option key={channel.id} value={channel.id}>{channel.name}</option>
                    ))}
                  </select>
                </div>

                {/* Checkbox conditionnelle selon le canal */}
                {(() => {
                  const selectedChannel = channels.find(c => c.id === formData.channel_id)
                  const channelName = selectedChannel?.name || ''
                  // Normaliser en supprimant les accents et en minuscules
                  const channelNameNormalized = channelName
                    .toLowerCase()
                    .trim()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')

                  if (channelNameNormalized.includes('hotel') && channelNameNormalized.includes('vente')) {
                    return (
                      <div
                        className="rounded-lg p-4"
                        style={{
                          backgroundColor: colors.warning.light,
                          border: `2px solid ${colors.warning.DEFAULT}`
                        }}
                      >
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.status === 'accepte'}
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                status: e.target.checked ? 'accepte' : 'en_vente'
                              })
                            }}
                            className="w-5 h-5 rounded focus:ring-2 transition-all"
                            style={{
                              accentColor: colors.warning.DEFAULT
                            }}
                          />
                          <span
                            className="text-base font-semibold"
                            style={{ color: colors.warning.dark }}
                          >
                            Accepté par l'Hotel de vente
                          </span>
                        </label>
                      </div>
                    )
                  } else if (channelNameNormalized.includes('bon') && channelNameNormalized.includes('coin')) {
                    return (
                      <div
                        className="rounded-lg p-4"
                        style={{
                          backgroundColor: colors.success.light,
                          border: `2px solid ${colors.success.DEFAULT}`
                        }}
                      >
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.status === 'vendu'}
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                status: e.target.checked ? 'vendu' : 'en_vente'
                              })
                            }}
                            className="w-5 h-5 rounded focus:ring-2 transition-all"
                            style={{
                              accentColor: colors.success.DEFAULT
                            }}
                          />
                          <span
                            className="text-base font-semibold"
                            style={{ color: colors.success.dark }}
                          >
                            Vendu
                          </span>
                        </label>
                      </div>
                    )
                  } else if (formData.channel_id) {
                    // Pour les autres canaux, afficher le dropdown de statut
                    return (
                      <div>
                        <label
                          className="block text-sm font-bold uppercase mb-2"
                          style={{ color: colors.neutral[600] }}
                        >
                          Statut
                        </label>
                        <select
                          value={formData.status}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                          className="w-full px-4 py-3 rounded-lg transition-all"
                          style={{
                            border: `2px solid ${colors.neutral[200]}`,
                            color: colors.neutral[900]
                          }}
                          onFocus={(e) => {
                            e.currentTarget.style.borderColor = colors.primary[400]
                            e.currentTarget.style.outline = 'none'
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.borderColor = colors.neutral[200]
                          }}
                        >
                          <option value="en_vente">En vente</option>
                          <option value="accepte">Accepté</option>
                          <option value="vendu">Vendu</option>
                          <option value="archive">Archivé</option>
                        </select>
                      </div>
                    )
                  }
                  return null
                })()}

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 py-3 sm:py-4 rounded-lg font-semibold transition-all"
                    style={{
                      background: saving ? colors.neutral[400] : `linear-gradient(135deg, ${colors.primary[600]} 0%, ${colors.accent[600]} 100%)`,
                      color: '#ffffff',
                      boxShadow: shadows.md,
                      cursor: saving ? 'not-allowed' : 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      if (!saving) {
                        e.currentTarget.style.boxShadow = shadows.lg
                        e.currentTarget.style.transform = 'translateY(-2px)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!saving) {
                        e.currentTarget.style.boxShadow = shadows.md
                        e.currentTarget.style.transform = 'translateY(0)'
                      }
                    }}
                  >
                    {saving ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                  <button
                    onClick={() => {
                      setEditing(false)
                      setSelectedImages([])
                      setImagePreviews([])
                      setPhotosToDelete([])
                      fetchData()
                    }}
                    className="px-6 py-3 sm:py-4 rounded-lg font-semibold transition-all"
                    style={{
                      backgroundColor: '#ffffff',
                      border: `2px solid ${colors.neutral[300]}`,
                      color: colors.neutral[700],
                      boxShadow: shadows.sm
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = colors.neutral[100]
                      e.currentTarget.style.transform = 'translateY(-2px)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#ffffff'
                      e.currentTarget.style.transform = 'translateY(0)'
                    }}
                  >
                    Annuler
                  </button>
                </div>
              </div>
            ) : (
              /* MODE LECTURE */
              <div className="space-y-6">
                <h2
                  className="text-2xl sm:text-3xl font-bold mb-6 flex items-center gap-3"
                  style={{ color: colors.neutral[900] }}
                >
                  <span
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center text-xl sm:text-2xl"
                    style={{
                      background: `linear-gradient(135deg, ${colors.primary[500]} 0%, ${colors.primary[700]} 100%)`,
                      color: '#ffffff',
                      boxShadow: shadows.md
                    }}
                  >
                    📋
                  </span>
                  Informations de l'article
                </h2>

                <div>
                  <div
                    className="text-xs font-bold uppercase mb-2"
                    style={{ color: colors.neutral[600] }}
                  >
                    Description
                  </div>
                  <div
                    className="text-base sm:text-lg rounded-lg p-4"
                    style={{
                      color: colors.neutral[900],
                      backgroundColor: colors.neutral[50],
                      border: `1px solid ${colors.neutral[200]}`
                    }}
                  >
                    {article.description || 'Aucune description'}
                  </div>
                </div>

                {article.category_id && (
                  <div>
                    <div
                      className="text-xs font-bold uppercase mb-2"
                      style={{ color: colors.neutral[600] }}
                    >
                      Catégorie
                    </div>
                    <div
                      className="text-base sm:text-lg font-semibold"
                      style={{ color: colors.neutral[900] }}
                    >
                      {categories.find(c => c.id === article.category_id)?.name || 'Non spécifié'}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {article.prix_achat && (
                    <div
                      className="rounded-lg p-4 sm:p-6 transition-all"
                      style={{
                        backgroundColor: colors.neutral[50],
                        border: `2px solid ${colors.neutral[200]}`
                      }}
                    >
                      <div
                        className="text-xs font-bold uppercase mb-2"
                        style={{ color: colors.neutral[600] }}
                      >
                        Prix d'achat
                      </div>
                      <div
                        className="text-2xl sm:text-3xl font-bold"
                        style={{ color: colors.neutral[900] }}
                      >
                        {article.prix_achat} €
                      </div>
                    </div>
                  )}
                  {article.prix_vente && (
                    <div
                      className="rounded-lg p-4 sm:p-6 transition-all"
                      style={{
                        backgroundColor: colors.success.light,
                        border: `2px solid ${colors.success.DEFAULT}`
                      }}
                    >
                      <div
                        className="text-xs font-bold uppercase mb-2"
                        style={{ color: colors.success.dark }}
                      >
                        Prix de vente
                      </div>
                      <div
                        className="text-2xl sm:text-3xl font-bold"
                        style={{ color: colors.success.dark }}
                      >
                        {article.prix_vente} €
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <div
                    className="text-xs font-bold uppercase mb-2"
                    style={{ color: colors.neutral[600] }}
                  >
                    Quantité
                  </div>
                  <div
                    className="text-base sm:text-lg font-semibold"
                    style={{ color: colors.neutral[900] }}
                  >
                    {article.quantite}
                  </div>
                </div>

                {article.channel_id && (
                  <div>
                    <div
                      className="text-xs font-bold uppercase mb-2"
                      style={{ color: colors.neutral[600] }}
                    >
                      Canal de vente
                    </div>
                    <div
                      className="text-base sm:text-lg font-semibold mb-4"
                      style={{ color: colors.neutral[900] }}
                    >
                      {channels.find(c => c.id === article.channel_id)?.name || 'Non spécifié'}
                    </div>

                    {/* Checkbox conditionnelle selon le canal */}
                    {(() => {
                      const selectedChannel = channels.find(c => c.id === article.channel_id)
                      if (!selectedChannel) return null

                      const channelNameNormalized = selectedChannel.name
                        .toLowerCase()
                        .trim()
                        .normalize('NFD')
                        .replace(/[\u0300-\u036f]/g, '')

                      const handleStatusChange = async (newStatus: 'accepte' | 'vendu' | 'en_vente') => {
                        try {
                          const updateData: any = {
                            status: newStatus
                          }

                          // Gestion des dates selon le statut
                          if (newStatus === 'accepte') {
                            // Ajouter date d'acceptation si elle n'existe pas, supprimer date de vente
                            if (!article.date_acceptation) {
                              updateData.date_acceptation = new Date().toISOString()
                            }
                            updateData.date_vente = null
                          } else if (newStatus === 'vendu') {
                            // Ajouter date de vente si elle n'existe pas, supprimer date d'acceptation
                            if (!article.date_vente) {
                              updateData.date_vente = new Date().toISOString()
                            }
                            updateData.date_acceptation = null
                          } else if (newStatus === 'en_vente') {
                            // Supprimer les deux dates si on revient à "en_vente"
                            updateData.date_acceptation = null
                            updateData.date_vente = null
                          }

                          const { error } = await supabase
                            .from('standard_articles')
                            .update(updateData)
                            .eq('id', id)

                          if (error) throw error

                          // Recharger les données
                          await fetchData()
                        } catch (error) {
                          console.error('Erreur:', error)
                          alert('Erreur lors de la mise à jour du statut')
                        }
                      }

                      // Les checkboxes sont accessibles à tous les utilisateurs authentifiés
                      if (channelNameNormalized.includes('hotel') && channelNameNormalized.includes('vente')) {
                        return (
                          <div
                            className="rounded-lg p-4"
                            style={{
                              backgroundColor: colors.warning.light,
                              border: `2px solid ${colors.warning.DEFAULT}`
                            }}
                          >
                            <label className="flex items-center gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={article.status === 'accepte'}
                                onChange={(e) => handleStatusChange(e.target.checked ? 'accepte' : 'en_vente')}
                                className="w-5 h-5 rounded focus:ring-2 transition-all"
                                style={{
                                  accentColor: colors.warning.DEFAULT
                                }}
                              />
                              <span
                                className="text-base font-semibold"
                                style={{ color: colors.warning.dark }}
                              >
                                Accepté par l'Hôtel de vente
                              </span>
                            </label>
                          </div>
                        )
                      } else if (channelNameNormalized.includes('bon') && channelNameNormalized.includes('coin')) {
                        return (
                          <div
                            className="rounded-lg p-4"
                            style={{
                              backgroundColor: colors.success.light,
                              border: `2px solid ${colors.success.DEFAULT}`
                            }}
                          >
                            <label className="flex items-center gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={article.status === 'vendu'}
                                onChange={(e) => handleStatusChange(e.target.checked ? 'vendu' : 'en_vente')}
                                className="w-5 h-5 rounded focus:ring-2 transition-all"
                                style={{
                                  accentColor: colors.success.DEFAULT
                                }}
                              />
                              <span
                                className="text-base font-semibold"
                                style={{ color: colors.success.dark }}
                              >
                                Vendu
                              </span>
                            </label>
                          </div>
                        )
                      } else {
                        // Pour les autres canaux, afficher le badge de statut normal
                        return (
                          <div>
                            <div
                              className="text-xs font-bold uppercase mb-2"
                              style={{ color: colors.neutral[600] }}
                            >
                              Statut
                            </div>
                            <span
                              className="px-4 py-2 rounded-full text-sm font-semibold inline-block"
                              style={{
                                backgroundColor:
                                  article.status === 'en_vente' ? colors.info.DEFAULT :
                                  article.status === 'accepte' ? colors.warning.DEFAULT :
                                  article.status === 'vendu' ? colors.success.DEFAULT : colors.neutral[400],
                                color: '#ffffff'
                              }}
                            >
                              {article.status === 'en_vente' ? 'En vente' :
                               article.status === 'accepte' ? 'Accepté' :
                               article.status === 'vendu' ? 'Vendu' : 'Archivé'}
                            </span>
                          </div>
                        )
                      }
                    })()}
                  </div>
                )}

                {!article.channel_id && (
                  <div>
                    <div
                      className="text-xs font-bold uppercase mb-2"
                      style={{ color: colors.neutral[600] }}
                    >
                      Statut
                    </div>
                    <span
                      className="px-4 py-2 rounded-full text-sm font-semibold inline-block"
                      style={{
                        backgroundColor:
                          article.status === 'en_vente' ? colors.info.DEFAULT :
                          article.status === 'accepte' ? colors.warning.DEFAULT :
                          article.status === 'vendu' ? colors.success.DEFAULT : colors.neutral[400],
                        color: '#ffffff'
                      }}
                    >
                      {article.status === 'en_vente' ? 'En vente' :
                       article.status === 'accepte' ? 'Accepté' :
                       article.status === 'vendu' ? 'Vendu' : 'Archivé'}
                    </span>
                  </div>
                )}

                <div
                  className="pt-6 mt-6"
                  style={{ borderTop: `2px solid ${colors.neutral[200]}` }}
                >
                  <div
                    className="text-xs font-bold uppercase mb-2"
                    style={{ color: colors.neutral[600] }}
                  >
                    Informations
                  </div>
                  <div className="space-y-1">
                    <p
                      className="text-sm"
                      style={{ color: colors.neutral[700] }}
                    >
                      Créé le {new Date(article.created_at).toLocaleDateString('fr-FR')}
                    </p>
                    {article.date_acceptation && (
                      <p
                        className="text-sm"
                        style={{ color: colors.neutral[700] }}
                      >
                        Accepté le {new Date(article.date_acceptation).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                    {article.date_vente && (
                      <p
                        className="text-sm"
                        style={{ color: colors.neutral[700] }}
                      >
                        Vendu le {new Date(article.date_vente).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* GALERIE PHOTOS - READ MODE */}
          {!editing && photos.length > 0 && (
            <div
              className="rounded-xl p-6 sm:p-8 transition-all hover:shadow-lg"
              style={{
                backgroundColor: '#ffffff',
                boxShadow: shadows.card,
                borderRadius: borderRadius.xl
              }}
            >
              <h3
                className="text-xl sm:text-2xl font-bold mb-4 flex items-center gap-2"
                style={{ color: colors.neutral[900] }}
              >
                <span>📷</span> Photos ({photos.length})
              </h3>

              {/* Grille de miniatures */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {photos.map((photo, index) => (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => setCurrentPhotoIndex(index)}
                    className="relative aspect-square rounded-lg overflow-hidden transition-all"
                    style={{
                      border: `2px solid ${colors.neutral[200]}`
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = colors.primary[400]
                      e.currentTarget.style.transform = 'scale(1.05)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = colors.neutral[200]
                      e.currentTarget.style.transform = 'scale(1)'
                    }}
                  >
                    <img
                      src={photo.url}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {/* Overlay au survol */}
                    <div
                      className="absolute inset-0 flex items-center justify-center transition-all pointer-events-none"
                      style={{
                        backgroundColor: 'rgba(0, 0, 0, 0)',
                        color: '#ffffff'
                      }}
                    >
                      <span className="text-2xl opacity-0 transition-opacity">🔍</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Modal (affichage grande image) */}
              {currentPhotoIndex !== null && (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center p-4"
                  style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
                  onClick={() => setCurrentPhotoIndex(null)}
                >
                  <div
                    className="relative max-w-4xl max-h-[90vh] rounded-xl overflow-hidden"
                    style={{
                      backgroundColor: '#ffffff',
                      boxShadow: shadows.xl
                    }}
                  >
                    <img
                      src={photos[currentPhotoIndex]?.url}
                      alt="Photo agrandie"
                      className="w-full h-full object-contain"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <button
                      onClick={() => setCurrentPhotoIndex(null)}
                      className="absolute top-4 right-4 rounded-full w-10 h-10 flex items-center justify-center transition-all"
                      style={{
                        backgroundColor: '#ffffff',
                        boxShadow: shadows.lg
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = colors.neutral[100]
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#ffffff'
                      }}
                    >
                      ✕
                    </button>

                    {/* Navigation buttons */}
                    {photos.length > 1 && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setCurrentPhotoIndex(currentPhotoIndex === 0 ? photos.length - 1 : currentPhotoIndex - 1)
                          }}
                          className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full w-12 h-12 flex items-center justify-center transition-all"
                          style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            boxShadow: shadows.lg
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#ffffff'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)'
                          }}
                        >
                          ←
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setCurrentPhotoIndex(currentPhotoIndex === photos.length - 1 ? 0 : currentPhotoIndex + 1)
                          }}
                          className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full w-12 h-12 flex items-center justify-center transition-all"
                          style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            boxShadow: shadows.lg
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#ffffff'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)'
                          }}
                        >
                          →
                        </button>
                      </>
                    )}

                    {/* Counter */}
                    <div
                      className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-sm"
                      style={{
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        color: '#ffffff'
                      }}
                    >
                      {currentPhotoIndex + 1} / {photos.length}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* GESTION PHOTOS - EDIT MODE */}
          {editing && canEdit && (
            <div
              className="rounded-xl p-6 sm:p-8 transition-all hover:shadow-lg"
              style={{
                backgroundColor: '#ffffff',
                boxShadow: shadows.card,
                borderRadius: borderRadius.xl
              }}
            >
              <h3
                className="text-xl sm:text-2xl font-bold mb-4 flex items-center gap-2"
                style={{ color: colors.neutral[900] }}
              >
                <span>📷</span> Gestion des photos
              </h3>

              {/* Existing photos with delete option */}
              {photos.length > 0 && (
                <div className="mb-6">
                  <h4
                    className="text-lg font-semibold mb-3"
                    style={{ color: colors.neutral[700] }}
                  >
                    Photos existantes
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {photos.map((photo) => (
                      <div
                        key={photo.id}
                        className="relative group"
                        style={{
                          opacity: photosToDelete.includes(photo.id) ? 0.4 : 1
                        }}
                      >
                        <img
                          src={photo.url}
                          alt={`Photo existante`}
                          className="w-full h-32 object-cover rounded-lg"
                          style={{
                            border: `2px solid ${photosToDelete.includes(photo.id) ? '#dc2626' : colors.neutral[200]}`
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => markPhotoForDeletion(photo.id)}
                          className="absolute top-2 right-2 rounded-full w-8 h-8 flex items-center justify-center transition-all"
                          style={{
                            backgroundColor: photosToDelete.includes(photo.id) ? '#dc2626' : 'rgba(0, 0, 0, 0.6)',
                            color: '#ffffff'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.1)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)'
                          }}
                        >
                          {photosToDelete.includes(photo.id) ? '↺' : '×'}
                        </button>
                        {photosToDelete.includes(photo.id) && (
                          <div
                            className="absolute inset-0 flex items-center justify-center rounded-lg"
                            style={{
                              backgroundColor: 'rgba(220, 38, 38, 0.2)'
                            }}
                          >
                            <span className="text-white font-bold">À supprimer</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload new photos */}
              <div>
                <h4
                  className="text-lg font-semibold mb-3"
                  style={{ color: colors.neutral[700] }}
                >
                  Ajouter de nouvelles photos
                </h4>
                <div
                  className="rounded-lg p-6 text-center transition-all"
                  style={{
                    border: `2px dashed ${colors.neutral[300]}`,
                    backgroundColor: colors.neutral[50]
                  }}
                >
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    className="hidden"
                    id="image-upload-edit"
                  />
                  <label
                    htmlFor="image-upload-edit"
                    className="cursor-pointer inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all"
                    style={{
                      backgroundColor: colors.primary[100],
                      color: colors.primary[700]
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = colors.primary[200]
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = colors.primary[100]
                    }}
                  >
                    <span className="text-xl">📷</span>
                    <span>Ajouter des photos</span>
                  </label>
                  <p
                    className="text-sm mt-3"
                    style={{ color: colors.neutral[600] }}
                  >
                    Vous pouvez ajouter plusieurs images
                  </p>
                </div>

                {/* New image previews */}
                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview}
                          alt={`Nouvelle photo ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                          style={{
                            border: `2px solid ${colors.primary[300]}`
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => removeNewImage(index)}
                          className="absolute top-2 right-2 rounded-full w-8 h-8 flex items-center justify-center transition-all"
                          style={{
                            backgroundColor: '#dc2626',
                            color: '#ffffff'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.1)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)'
                          }}
                        >
                          ×
                        </button>
                        <div
                          className="absolute bottom-2 left-2 px-2 py-1 rounded text-xs font-semibold"
                          style={{
                            backgroundColor: colors.primary[600],
                            color: '#ffffff'
                          }}
                        >
                          Nouvelle
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
