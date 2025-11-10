'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { ProtectedRoute } from '@/components/protected-route'
import { Navbar } from '@/components/navbar'
import { useAuth } from '@/lib/auth-context'

type Tag = {
  id: string
  name: string
  color: string | null
  created_at: string
}

type Category = {
  id: string
  name: string
  description: string | null
  color: string | null
  created_at: string
}

type SalesChannel = {
  id: string
  name: string
  description: string | null
  created_at: string
}

type ActiveTab = 'tags' | 'categories' | 'channels' | 'bulk_channels'

export default function ParametragePage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <ParametrageContent />
    </ProtectedRoute>
  )
}

function ParametrageContent() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<ActiveTab>('tags')
  const [tags, setTags] = useState<Tag[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [channels, setChannels] = useState<SalesChannel[]>([])
  const [loading, setLoading] = useState(true)

  // États pour Tags
  const [creatingTag, setCreatingTag] = useState(false)
  const [editingTag, setEditingTag] = useState<string | null>(null)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState('#3b82f6')
  const [editingTagName, setEditingTagName] = useState('')
  const [editingTagColor, setEditingTagColor] = useState('#3b82f6')

  // États pour Catégories
  const [creatingCategory, setCreatingCategory] = useState(false)
  const [editingCategory, setEditingCategory] = useState<string | null>(null)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryDescription, setNewCategoryDescription] = useState('')
  const [newCategoryColor, setNewCategoryColor] = useState('#10b981')
  const [editingCategoryName, setEditingCategoryName] = useState('')
  const [editingCategoryDescription, setEditingCategoryDescription] = useState('')
  const [editingCategoryColor, setEditingCategoryColor] = useState('#10b981')

  // États pour Canaux de vente
  const [creatingChannel, setCreatingChannel] = useState(false)
  const [editingChannel, setEditingChannel] = useState<string | null>(null)
  const [newChannelName, setNewChannelName] = useState('')
  const [newChannelDescription, setNewChannelDescription] = useState('')
  const [editingChannelName, setEditingChannelName] = useState('')
  const [editingChannelDescription, setEditingChannelDescription] = useState('')

  // États pour Affectation en masse
  const [bulkMode, setBulkMode] = useState<'vins' | 'articles'>('vins')
  const [vins, setVins] = useState<any[]>([])
  const [articles, setArticles] = useState<any[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [selectedChannelIds, setSelectedChannelIds] = useState<string[]>([])
  const [bulkAction, setBulkAction] = useState<'add' | 'remove'>('add')
  const [loadingBulk, setLoadingBulk] = useState(false)

  const colorPresets = [
    { name: 'Bleu', value: '#3b82f6' },
    { name: 'Vert', value: '#10b981' },
    { name: 'Rouge', value: '#ef4444' },
    { name: 'Jaune', value: '#f59e0b' },
    { name: 'Violet', value: '#8b5cf6' },
    { name: 'Rose', value: '#ec4899' },
    { name: 'Gris', value: '#6b7280' },
    { name: 'Indigo', value: '#6366f1' }
  ]

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (activeTab === 'bulk_channels') {
      fetchBulkData()
    }
  }, [activeTab, bulkMode])

  async function fetchData() {
    try {
      // Charger les tags
      const { data: tagsData, error: tagsError } = await supabase
        .from('tags')
        .select('*')
        .order('name')

      if (tagsError) throw tagsError
      setTags(tagsData || [])

      // Charger les catégories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('name')

      if (categoriesError) throw categoriesError
      setCategories(categoriesData || [])

      // Charger les canaux de vente
      const { data: channelsData, error: channelsError } = await supabase
        .from('sales_channels')
        .select('*')
        .order('name')

      if (channelsError) throw channelsError
      setChannels(channelsData || [])
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  // ===== GESTION DES TAGS =====
  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTagName.trim()) return

    try {
      const { error } = await supabase
        .from('tags')
        .insert([{
          name: newTagName.trim(),
          color: newTagColor,
          created_by: user?.id
        }])

      if (error) throw error

      setNewTagName('')
      setNewTagColor('#3b82f6')
      setCreatingTag(false)
      await fetchData()
      alert('Tag créé avec succès')
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la création du tag')
    }
  }

  const handleEditTag = (tag: Tag) => {
    setEditingTag(tag.id)
    setEditingTagName(tag.name)
    setEditingTagColor(tag.color || '#3b82f6')
  }

  const handleSaveTag = async (tagId: string) => {
    try {
      const { error } = await supabase
        .from('tags')
        .update({
          name: editingTagName.trim(),
          color: editingTagColor
        })
        .eq('id', tagId)

      if (error) throw error

      setEditingTag(null)
      await fetchData()
      alert('Tag mis à jour avec succès')
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la mise à jour du tag')
    }
  }

  const handleDeleteTag = async (tagId: string, tagName: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le tag "${tagName}" ?\n\nAttention : ce tag sera supprimé de tous les articles et vins associés.`)) return

    try {
      const { error } = await supabase
        .from('tags')
        .delete()
        .eq('id', tagId)

      if (error) throw error

      await fetchData()
      alert('Tag supprimé avec succès')
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la suppression du tag')
    }
  }

  // ===== GESTION DES CATÉGORIES =====
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCategoryName.trim()) return

    try {
      const { error } = await supabase
        .from('categories')
        .insert([{
          name: newCategoryName.trim(),
          description: newCategoryDescription.trim() || null,
          color: newCategoryColor,
          created_by: user?.id
        }])

      if (error) throw error

      setNewCategoryName('')
      setNewCategoryDescription('')
      setNewCategoryColor('#10b981')
      setCreatingCategory(false)
      await fetchData()
      alert('Catégorie créée avec succès')
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la création de la catégorie')
    }
  }

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category.id)
    setEditingCategoryName(category.name)
    setEditingCategoryDescription(category.description || '')
    setEditingCategoryColor(category.color || '#10b981')
  }

  const handleSaveCategory = async (categoryId: string) => {
    try {
      const { error } = await supabase
        .from('categories')
        .update({
          name: editingCategoryName.trim(),
          description: editingCategoryDescription.trim() || null,
          color: editingCategoryColor
        })
        .eq('id', categoryId)

      if (error) throw error

      setEditingCategory(null)
      await fetchData()
      alert('Catégorie mise à jour avec succès')
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la mise à jour de la catégorie')
    }
  }

  const handleDeleteCategory = async (categoryId: string, categoryName: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer la catégorie "${categoryName}" ?\n\nAttention : cette catégorie sera supprimée de tous les articles associés.`)) return

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId)

      if (error) throw error

      await fetchData()
      alert('Catégorie supprimée avec succès')
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la suppression de la catégorie')
    }
  }

  // ===== GESTION DES CANAUX DE VENTE =====
  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newChannelName.trim()) return

    try {
      const { error } = await supabase
        .from('sales_channels')
        .insert([{
          name: newChannelName.trim(),
          description: newChannelDescription.trim() || null,
          created_by: user?.id
        }])

      if (error) throw error

      setNewChannelName('')
      setNewChannelDescription('')
      setCreatingChannel(false)
      await fetchData()
      alert('Canal de vente créé avec succès')
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la création du canal de vente')
    }
  }

  const handleEditChannel = (channel: SalesChannel) => {
    setEditingChannel(channel.id)
    setEditingChannelName(channel.name)
    setEditingChannelDescription(channel.description || '')
  }

  const handleSaveChannel = async (channelId: string) => {
    try {
      const { error } = await supabase
        .from('sales_channels')
        .update({
          name: editingChannelName.trim(),
          description: editingChannelDescription.trim() || null
        })
        .eq('id', channelId)

      if (error) throw error

      setEditingChannel(null)
      await fetchData()
      alert('Canal de vente mis à jour avec succès')
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la mise à jour du canal de vente')
    }
  }

  const handleDeleteChannel = async (channelId: string, channelName: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le canal de vente "${channelName}" ?\n\nAttention : ce canal sera supprimé de tous les articles et vins associés.`)) return

    try {
      const { error } = await supabase
        .from('sales_channels')
        .delete()
        .eq('id', channelId)

      if (error) throw error

      await fetchData()
      alert('Canal de vente supprimé avec succès')
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la suppression du canal de vente')
    }
  }

  // ===== GESTION AFFECTATION EN MASSE =====
  async function fetchBulkData() {
    setLoadingBulk(true)
    try {
      if (bulkMode === 'vins') {
        // Charger les vins avec leurs canaux
        const { data: vinsData } = await supabase
          .from('vins')
          .select('id, nom, appellation')
          .order('nom')

        if (vinsData) {
          // Charger les canaux pour chaque vin
          const vinsWithChannels = await Promise.all(
            vinsData.map(async (vin) => {
              const { data: vinChannels } = await supabase
                .from('vin_channels')
                .select(`
                  channel_id,
                  sales_channels (id, name)
                `)
                .eq('vin_id', vin.id)

              return {
                ...vin,
                channels: vinChannels?.map(vc => vc.sales_channels).filter(Boolean) || []
              }
            })
          )
          setVins(vinsWithChannels)
        }
      } else {
        // Charger les articles avec leurs canaux
        const { data: articlesData } = await supabase
          .from('standard_articles')
          .select('id, nom, description')
          .order('nom')

        if (articlesData) {
          // Charger les canaux pour chaque article
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
      alert('Erreur lors du chargement des données')
    } finally {
      setLoadingBulk(false)
    }
  }

  function handleSelectAll() {
    const items = bulkMode === 'vins' ? vins : articles
    setSelectedIds(items.map(item => item.id))
  }

  function handleDeselectAll() {
    setSelectedIds([])
  }

  function handleToggleSelect(id: string) {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(itemId => itemId !== id)
        : [...prev, id]
    )
  }

  async function handleApplyBulkChannels() {
    if (selectedIds.length === 0) {
      alert('Veuillez sélectionner au moins une fiche')
      return
    }
    if (selectedChannelIds.length === 0) {
      alert('Veuillez sélectionner au moins un canal')
      return
    }

    const confirmMsg = bulkAction === 'add'
      ? `Ajouter ${selectedChannelIds.length} canal(ux) à ${selectedIds.length} fiche(s) ?`
      : `Retirer ${selectedChannelIds.length} canal(ux) de ${selectedIds.length} fiche(s) ?`

    if (!confirm(confirmMsg)) return

    setLoadingBulk(true)
    try {
      const tableName = bulkMode === 'vins' ? 'vin_channels' : 'article_channels'
      const idField = bulkMode === 'vins' ? 'vin_id' : 'article_id'

      if (bulkAction === 'add') {
        // Ajouter les canaux
        const insertData = []
        for (const itemId of selectedIds) {
          for (const channelId of selectedChannelIds) {
            insertData.push({
              [idField]: itemId,
              channel_id: channelId
            })
          }
        }

        const { error } = await supabase
          .from(tableName)
          .upsert(insertData, { onConflict: `${idField},channel_id` })

        if (error) throw error
      } else {
        // Retirer les canaux
        const { error } = await supabase
          .from(tableName)
          .delete()
          .in(idField, selectedIds)
          .in('channel_id', selectedChannelIds)

        if (error) throw error
      }

      alert('Affectation appliquée avec succès')
      setSelectedIds([])
      setSelectedChannelIds([])
      await fetchBulkData()
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de l\'application de l\'affectation')
    } finally {
      setLoadingBulk(false)
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-xl">Chargement...</div>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-indigo-700 text-white py-6 px-8 shadow-md">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold">⚙️ Paramétrage</h1>
            <p className="text-indigo-100 mt-2">Gérez les tags, catégories et autres données de référence</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-8 pt-6">
          <div className="flex gap-2 border-b border-gray-300">
            <button
              onClick={() => setActiveTab('tags')}
              className={`px-6 py-3 font-semibold transition ${
                activeTab === 'tags'
                  ? 'border-b-4 border-purple-600 text-purple-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🏷️ Tags
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`px-6 py-3 font-semibold transition ${
                activeTab === 'categories'
                  ? 'border-b-4 border-green-600 text-green-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📁 Catégories
            </button>
            <button
              onClick={() => setActiveTab('channels')}
              className={`px-6 py-3 font-semibold transition ${
                activeTab === 'channels'
                  ? 'border-b-4 border-orange-600 text-orange-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🛒 Canaux de vente
            </button>
            <button
              onClick={() => setActiveTab('bulk_channels')}
              className={`px-6 py-3 font-semibold transition ${
                activeTab === 'bulk_channels'
                  ? 'border-b-4 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              ⚡ Affectation en masse
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto p-8">
          {activeTab === 'tags' && (
            <div>
              {/* Bouton créer tag */}
              <div className="mb-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Gestion des Tags</h2>
                <button
                  onClick={() => setCreatingTag(true)}
                  className="bg-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-purple-700 transition"
                >
                  + Nouveau tag
                </button>
              </div>

              {/* Formulaire création tag */}
              {creatingTag && (
                <div className="bg-white rounded-lg shadow p-6 mb-8">
                  <h3 className="text-xl font-bold mb-4">Créer un nouveau tag</h3>
                  <form onSubmit={handleCreateTag} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nom du tag <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        value={newTagName}
                        onChange={(e) => setNewTagName(e.target.value)}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                        placeholder="Ex: Bio, Primeur, À déguster..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Couleur</label>
                      <div className="flex gap-3 flex-wrap">
                        {colorPresets.map(preset => (
                          <button
                            key={preset.value}
                            type="button"
                            onClick={() => setNewTagColor(preset.value)}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition"
                            style={{
                              borderColor: newTagColor === preset.value ? preset.value : '#e5e7eb',
                              backgroundColor: newTagColor === preset.value ? `${preset.value}20` : 'white'
                            }}
                          >
                            <div
                              className="w-6 h-6 rounded"
                              style={{ backgroundColor: preset.value }}
                            />
                            <span className="text-sm">{preset.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <button
                        type="submit"
                        className="px-6 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700"
                      >
                        Créer le tag
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCreatingTag(false)
                          setNewTagName('')
                          setNewTagColor('#3b82f6')
                        }}
                        className="px-6 py-2 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-100"
                      >
                        Annuler
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Stats tags */}
              <div className="bg-white rounded-lg shadow p-6 mb-8">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Total de tags</h3>
                <p className="text-3xl font-bold text-purple-600">{tags.length}</p>
              </div>

              {/* Liste des tags */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tags.map(tag => (
                  <div key={tag.id} className="bg-white rounded-lg shadow p-6">
                    {editingTag === tag.id ? (
                      /* MODE ÉDITION TAG */
                      <div className="space-y-4">
                        <input
                          type="text"
                          value={editingTagName}
                          onChange={(e) => setEditingTagName(e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg text-lg font-semibold"
                        />

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Couleur</label>
                          <div className="grid grid-cols-4 gap-2">
                            {colorPresets.map(preset => (
                              <button
                                key={preset.value}
                                type="button"
                                onClick={() => setEditingTagColor(preset.value)}
                                className="w-full h-10 rounded border-2"
                                style={{
                                  backgroundColor: preset.value,
                                  borderColor: editingTagColor === preset.value ? '#000' : preset.value
                                }}
                                title={preset.name}
                              />
                            ))}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveTag(tag.id)}
                            className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                          >
                            ✓ Sauver
                          </button>
                          <button
                            onClick={() => setEditingTag(null)}
                            className="flex-1 px-3 py-2 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
                          >
                            ✕ Annuler
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* MODE LECTURE TAG */
                      <>
                        <div className="flex items-center justify-between mb-4">
                          <span
                            className="px-4 py-2 rounded-full text-sm font-semibold text-white"
                            style={{ backgroundColor: tag.color || '#6b7280' }}
                          >
                            {tag.name}
                          </span>
                        </div>

                        <div className="text-sm text-gray-500 mb-4">
                          Créé le {new Date(tag.created_at).toLocaleDateString('fr-FR')}
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditTag(tag)}
                            className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                          >
                            ✏️ Modifier
                          </button>
                          <button
                            onClick={() => handleDeleteTag(tag.id, tag.name)}
                            className="flex-1 px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                          >
                            🗑️ Supprimer
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>

              {tags.length === 0 && (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                  <p className="text-xl text-gray-500 mb-4">Aucun tag créé</p>
                  <button
                    onClick={() => setCreatingTag(true)}
                    className="text-purple-600 hover:underline font-semibold"
                  >
                    Créer votre premier tag
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'categories' && (
            <div>
              {/* Bouton créer catégorie */}
              <div className="mb-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Gestion des Catégories</h2>
                <button
                  onClick={() => setCreatingCategory(true)}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition"
                >
                  + Nouvelle catégorie
                </button>
              </div>

              {/* Formulaire création catégorie */}
              {creatingCategory && (
                <div className="bg-white rounded-lg shadow p-6 mb-8">
                  <h3 className="text-xl font-bold mb-4">Créer une nouvelle catégorie</h3>
                  <form onSubmit={handleCreateCategory} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nom de la catégorie <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent"
                        placeholder="Ex: Accessoires, Mobilier, Décoration..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        value={newCategoryDescription}
                        onChange={(e) => setNewCategoryDescription(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent"
                        placeholder="Description optionnelle..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Couleur</label>
                      <div className="flex gap-3 flex-wrap">
                        {colorPresets.map(preset => (
                          <button
                            key={preset.value}
                            type="button"
                            onClick={() => setNewCategoryColor(preset.value)}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition"
                            style={{
                              borderColor: newCategoryColor === preset.value ? preset.value : '#e5e7eb',
                              backgroundColor: newCategoryColor === preset.value ? `${preset.value}20` : 'white'
                            }}
                          >
                            <div
                              className="w-6 h-6 rounded"
                              style={{ backgroundColor: preset.value }}
                            />
                            <span className="text-sm">{preset.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <button
                        type="submit"
                        className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
                      >
                        Créer la catégorie
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCreatingCategory(false)
                          setNewCategoryName('')
                          setNewCategoryDescription('')
                          setNewCategoryColor('#10b981')
                        }}
                        className="px-6 py-2 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-100"
                      >
                        Annuler
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Stats catégories */}
              <div className="bg-white rounded-lg shadow p-6 mb-8">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Total de catégories</h3>
                <p className="text-3xl font-bold text-green-600">{categories.length}</p>
              </div>

              {/* Liste des catégories */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map(category => (
                  <div key={category.id} className="bg-white rounded-lg shadow p-6">
                    {editingCategory === category.id ? (
                      /* MODE ÉDITION CATÉGORIE */
                      <div className="space-y-4">
                        <input
                          type="text"
                          value={editingCategoryName}
                          onChange={(e) => setEditingCategoryName(e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg text-lg font-semibold"
                        />

                        <textarea
                          value={editingCategoryDescription}
                          onChange={(e) => setEditingCategoryDescription(e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 border rounded-lg text-sm"
                          placeholder="Description..."
                        />

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Couleur</label>
                          <div className="grid grid-cols-4 gap-2">
                            {colorPresets.map(preset => (
                              <button
                                key={preset.value}
                                type="button"
                                onClick={() => setEditingCategoryColor(preset.value)}
                                className="w-full h-10 rounded border-2"
                                style={{
                                  backgroundColor: preset.value,
                                  borderColor: editingCategoryColor === preset.value ? '#000' : preset.value
                                }}
                                title={preset.name}
                              />
                            ))}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveCategory(category.id)}
                            className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                          >
                            ✓ Sauver
                          </button>
                          <button
                            onClick={() => setEditingCategory(null)}
                            className="flex-1 px-3 py-2 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
                          >
                            ✕ Annuler
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* MODE LECTURE CATÉGORIE */
                      <>
                        <div className="mb-4">
                          <span
                            className="px-4 py-2 rounded-lg text-sm font-semibold text-white inline-block"
                            style={{ backgroundColor: category.color || '#6b7280' }}
                          >
                            {category.name}
                          </span>
                        </div>

                        {category.description && (
                          <p className="text-sm text-gray-600 mb-4">{category.description}</p>
                        )}

                        <div className="text-sm text-gray-500 mb-4">
                          Créé le {new Date(category.created_at).toLocaleDateString('fr-FR')}
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditCategory(category)}
                            className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                          >
                            ✏️ Modifier
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category.id, category.name)}
                            className="flex-1 px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                          >
                            🗑️ Supprimer
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>

              {categories.length === 0 && (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                  <p className="text-xl text-gray-500 mb-4">Aucune catégorie créée</p>
                  <button
                    onClick={() => setCreatingCategory(true)}
                    className="text-green-600 hover:underline font-semibold"
                  >
                    Créer votre première catégorie
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'channels' && (
            <div>
              {/* Bouton créer canal */}
              <div className="mb-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Gestion des Canaux de vente</h2>
                <button
                  onClick={() => setCreatingChannel(true)}
                  className="bg-orange-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-orange-700 transition"
                >
                  + Nouveau canal
                </button>
              </div>

              {/* Formulaire création canal */}
              {creatingChannel && (
                <div className="bg-white rounded-lg shadow p-6 mb-8">
                  <h3 className="text-xl font-bold mb-4">Créer un nouveau canal de vente</h3>
                  <form onSubmit={handleCreateChannel} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nom du canal <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        value={newChannelName}
                        onChange={(e) => setNewChannelName(e.target.value)}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-600 focus:border-transparent"
                        placeholder="Ex: Boutique en ligne, Vente directe, Revendeur..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        value={newChannelDescription}
                        onChange={(e) => setNewChannelDescription(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-600 focus:border-transparent"
                        placeholder="Description optionnelle..."
                      />
                    </div>

                    <div className="flex gap-4">
                      <button
                        type="submit"
                        className="px-6 py-2 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700"
                      >
                        Créer le canal
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCreatingChannel(false)
                          setNewChannelName('')
                          setNewChannelDescription('')
                        }}
                        className="px-6 py-2 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-100"
                      >
                        Annuler
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Stats canaux */}
              <div className="bg-white rounded-lg shadow p-6 mb-8">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Total de canaux</h3>
                <p className="text-3xl font-bold text-orange-600">{channels.length}</p>
              </div>

              {/* Liste des canaux */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {channels.map(channel => (
                  <div key={channel.id} className="bg-white rounded-lg shadow p-6">
                    {editingChannel === channel.id ? (
                      /* MODE ÉDITION CANAL */
                      <div className="space-y-4">
                        <input
                          type="text"
                          value={editingChannelName}
                          onChange={(e) => setEditingChannelName(e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg text-lg font-semibold"
                        />

                        <textarea
                          value={editingChannelDescription}
                          onChange={(e) => setEditingChannelDescription(e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 border rounded-lg text-sm"
                          placeholder="Description..."
                        />

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveChannel(channel.id)}
                            className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                          >
                            ✓ Sauver
                          </button>
                          <button
                            onClick={() => setEditingChannel(null)}
                            className="flex-1 px-3 py-2 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
                          >
                            ✕ Annuler
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* MODE LECTURE CANAL */
                      <>
                        <div className="mb-4">
                          <span className="px-4 py-2 rounded-lg text-sm font-semibold text-white inline-block bg-orange-600">
                            {channel.name}
                          </span>
                        </div>

                        {channel.description && (
                          <p className="text-sm text-gray-600 mb-4">{channel.description}</p>
                        )}

                        <div className="text-sm text-gray-500 mb-4">
                          Créé le {new Date(channel.created_at).toLocaleDateString('fr-FR')}
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditChannel(channel)}
                            className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                          >
                            ✏️ Modifier
                          </button>
                          <button
                            onClick={() => handleDeleteChannel(channel.id, channel.name)}
                            className="flex-1 px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                          >
                            🗑️ Supprimer
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>

              {channels.length === 0 && (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                  <p className="text-xl text-gray-500 mb-4">Aucun canal de vente créé</p>
                  <button
                    onClick={() => setCreatingChannel(true)}
                    className="text-orange-600 hover:underline font-semibold"
                  >
                    Créer votre premier canal
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'bulk_channels' && (
            <div>
              {/* Header */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Affectation en masse des canaux</h2>
                <p className="text-gray-600">Attribuez ou retirez des canaux de vente à plusieurs fiches en une seule fois</p>
              </div>

              {/* Mode selection */}
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">Type de fiches</label>
                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      setBulkMode('vins')
                      setSelectedIds([])
                    }}
                    className={`flex-1 px-6 py-3 rounded-lg font-semibold transition ${
                      bulkMode === 'vins'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    🍷 Fiches de vin
                  </button>
                  <button
                    onClick={() => {
                      setBulkMode('articles')
                      setSelectedIds([])
                    }}
                    className={`flex-1 px-6 py-3 rounded-lg font-semibold transition ${
                      bulkMode === 'articles'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    📦 Fiches d'articles standards
                  </button>
                </div>
              </div>

              {/* Action selection */}
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">Action à effectuer</label>
                <div className="flex gap-4 mb-6">
                  <button
                    onClick={() => setBulkAction('add')}
                    className={`flex-1 px-6 py-3 rounded-lg font-semibold transition ${
                      bulkAction === 'add'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    ➕ Ajouter des canaux
                  </button>
                  <button
                    onClick={() => setBulkAction('remove')}
                    className={`flex-1 px-6 py-3 rounded-lg font-semibold transition ${
                      bulkAction === 'remove'
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    ➖ Retirer des canaux
                  </button>
                </div>

                {/* Channel selection */}
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Canaux à {bulkAction === 'add' ? 'ajouter' : 'retirer'}
                </label>
                <div className="flex flex-wrap gap-3 mb-6">
                  {channels.map(channel => (
                    <label
                      key={channel.id}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 cursor-pointer transition"
                      style={{
                        borderColor: selectedChannelIds.includes(channel.id) ? '#f97316' : '#e5e7eb',
                        backgroundColor: selectedChannelIds.includes(channel.id) ? '#fed7aa' : 'white'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedChannelIds.includes(channel.id)}
                        onChange={() => {
                          setSelectedChannelIds(prev =>
                            prev.includes(channel.id)
                              ? prev.filter(id => id !== channel.id)
                              : [...prev, channel.id]
                          )
                        }}
                        className="w-4 h-4"
                      />
                      <span className="font-medium">{channel.name}</span>
                    </label>
                  ))}
                </div>

                {/* Apply button */}
                <button
                  onClick={handleApplyBulkChannels}
                  disabled={loadingBulk || selectedIds.length === 0 || selectedChannelIds.length === 0}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                >
                  {loadingBulk ? 'Application en cours...' : `Appliquer à ${selectedIds.length} fiche(s) sélectionnée(s)`}
                </button>
              </div>

              {/* Items list */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-900">
                    {bulkMode === 'vins' ? `Fiches de vin (${vins.length})` : `Articles standards (${articles.length})`}
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSelectAll}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm font-semibold"
                    >
                      Tout sélectionner
                    </button>
                    <button
                      onClick={handleDeselectAll}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm font-semibold"
                    >
                      Tout désélectionner
                    </button>
                  </div>
                </div>

                {loadingBulk ? (
                  <div className="text-center py-8 text-gray-500">Chargement...</div>
                ) : (
                  <div className="space-y-2 max-h-[600px] overflow-y-auto">
                    {bulkMode === 'vins' && vins.map(vin => (
                      <label
                        key={vin.id}
                        className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition"
                        style={{
                          borderColor: selectedIds.includes(vin.id) ? '#3b82f6' : '#e5e7eb',
                          backgroundColor: selectedIds.includes(vin.id) ? '#eff6ff' : 'white'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(vin.id)}
                          onChange={() => handleToggleSelect(vin.id)}
                          className="w-5 h-5 mt-1"
                        />
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">{vin.nom}</div>
                          {vin.appellation && (
                            <div className="text-sm text-gray-600">{vin.appellation}</div>
                          )}
                          {vin.channels && vin.channels.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {vin.channels.map((channel: any) => (
                                <span
                                  key={channel.id}
                                  className="px-2 py-1 rounded text-xs font-medium"
                                  style={{
                                    backgroundColor: '#fed7aa',
                                    color: '#c2410c'
                                  }}
                                >
                                  {channel.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </label>
                    ))}

                    {bulkMode === 'articles' && articles.map(article => (
                      <label
                        key={article.id}
                        className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition"
                        style={{
                          borderColor: selectedIds.includes(article.id) ? '#3b82f6' : '#e5e7eb',
                          backgroundColor: selectedIds.includes(article.id) ? '#eff6ff' : 'white'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(article.id)}
                          onChange={() => handleToggleSelect(article.id)}
                          className="w-5 h-5 mt-1"
                        />
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">{article.nom}</div>
                          {article.description && (
                            <div className="text-sm text-gray-600">{article.description}</div>
                          )}
                          {article.channels && article.channels.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {article.channels.map((channel: any) => (
                                <span
                                  key={channel.id}
                                  className="px-2 py-1 rounded text-xs font-medium"
                                  style={{
                                    backgroundColor: '#fed7aa',
                                    color: '#c2410c'
                                  }}
                                >
                                  {channel.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </label>
                    ))}

                    {bulkMode === 'vins' && vins.length === 0 && (
                      <div className="text-center py-8 text-gray-500">Aucune fiche de vin trouvée</div>
                    )}

                    {bulkMode === 'articles' && articles.length === 0 && (
                      <div className="text-center py-8 text-gray-500">Aucun article standard trouvé</div>
                    )}
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
