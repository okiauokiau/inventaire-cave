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

type ActiveTab = 'tags' | 'categories'

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
        </div>
      </div>
    </>
  )
}
