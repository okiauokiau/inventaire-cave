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
  created_by: string | null
}

export default function TagsPage() {
  return (
    <ProtectedRoute requiredRole="moderator">
      <TagsContent />
    </ProtectedRoute>
  )
}

function TagsContent() {
  const { user, profile } = useAuth()
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [editingTag, setEditingTag] = useState<string | null>(null)

  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState('#3b82f6')

  const [editingName, setEditingName] = useState('')
  const [editingColor, setEditingColor] = useState('#3b82f6')

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
    fetchTags()
  }, [])

  async function fetchTags() {
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name')

      if (error) throw error
      setTags(data || [])
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTagName.trim()) return

    try {
      const { error } = await supabase
        .from('tags')
        .insert([
          {
            name: newTagName.trim(),
            color: newTagColor,
            created_by: user?.id
          }
        ])

      if (error) throw error

      setNewTagName('')
      setNewTagColor('#3b82f6')
      setCreating(false)
      await fetchTags()
      alert('Tag créé avec succès')
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la création du tag')
    }
  }

  const handleEditTag = (tag: Tag) => {
    setEditingTag(tag.id)
    setEditingName(tag.name)
    setEditingColor(tag.color || '#3b82f6')
  }

  const handleSaveTag = async (tagId: string) => {
    try {
      const { error } = await supabase
        .from('tags')
        .update({
          name: editingName.trim(),
          color: editingColor
        })
        .eq('id', tagId)

      if (error) throw error

      setEditingTag(null)
      await fetchTags()
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

      await fetchTags()
      alert('Tag supprimé avec succès')
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la suppression du tag')
    }
  }

  const canDelete = profile?.role === 'admin'

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
        <div className="bg-purple-700 text-white py-6 px-8 shadow-md">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">🏷️ Gestion des Tags</h1>
              <p className="text-purple-100 mt-2">Organisez vos articles et vins avec des étiquettes</p>
            </div>
            <button
              onClick={() => setCreating(true)}
              className="bg-white text-purple-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition"
            >
              + Nouveau tag
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto p-8">
          {/* Formulaire de création */}
          {creating && (
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h2 className="text-xl font-bold mb-4">Créer un nouveau tag</h2>
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-700 focus:border-transparent"
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
                    className="px-6 py-2 bg-purple-700 text-white rounded-lg font-semibold hover:bg-purple-800"
                  >
                    Créer le tag
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCreating(false)
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

          {/* Stats */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Total de tags</h3>
            <p className="text-3xl font-bold text-gray-900">{tags.length}</p>
          </div>

          {/* Liste des tags */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tags.map(tag => (
              <div key={tag.id} className="bg-white rounded-lg shadow p-6">
                {editingTag === tag.id ? (
                  /* MODE ÉDITION */
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-lg font-semibold"
                    />

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Couleur</label>
                      <div className="grid grid-cols-4 gap-2">
                        {colorPresets.map(preset => (
                          <button
                            key={preset.value}
                            type="button"
                            onClick={() => setEditingColor(preset.value)}
                            className="w-full h-10 rounded border-2"
                            style={{
                              backgroundColor: preset.value,
                              borderColor: editingColor === preset.value ? '#000' : preset.value
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
                  /* MODE LECTURE */
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
                      {canDelete && (
                        <button
                          onClick={() => handleDeleteTag(tag.id, tag.name)}
                          className="flex-1 px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                        >
                          🗑️ Supprimer
                        </button>
                      )}
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
                onClick={() => setCreating(true)}
                className="text-purple-700 hover:underline font-semibold"
              >
                Créer votre premier tag
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
