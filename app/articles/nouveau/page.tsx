'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/protected-route'
import { Navbar } from '@/components/navbar'
import { useAuth } from '@/lib/auth-context'

type SalesChannel = {
  id: string
  name: string
}

type Category = {
  id: string
  name: string
  color: string | null
}

export default function NouvelArticlePage() {
  return (
    <ProtectedRoute>
      <NouvelArticleContent />
    </ProtectedRoute>
  )
}

function NouvelArticleContent() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [channels, setChannels] = useState<SalesChannel[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])

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
    fetchChannels()
    fetchCategories()
  }, [])

  async function fetchChannels() {
    const { data } = await supabase
      .from('sales_channels')
      .select('*')
      .order('name')

    if (data) setChannels(data)
  }

  async function fetchCategories() {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('name')

    if (data) setCategories(data)
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

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index))
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // 1. Créer l'article
      const { data: article, error: articleError } = await supabase
        .from('standard_articles')
        .insert([
          {
            nom: formData.nom,
            description: formData.description || null,
            prix_achat: formData.prix_achat ? parseFloat(formData.prix_achat) : null,
            prix_vente: formData.prix_vente ? parseFloat(formData.prix_vente) : null,
            quantite: parseInt(formData.quantite),
            category_id: formData.category_id || null,
            channel_id: formData.channel_id || null,
            status: formData.status,
            created_by: user?.id
          }
        ])
        .select()
        .single()

      if (articleError) throw articleError

      // 2. Uploader les images
      if (selectedImages.length > 0) {
        for (let i = 0; i < selectedImages.length; i++) {
          const file = selectedImages[i]
          const fileExt = file.name.split('.').pop()
          const fileName = `${article.id}/${Date.now()}_${i}.${fileExt}`

          // Upload vers Supabase Storage
          const { error: uploadError } = await supabase.storage
            .from('article-images')
            .upload(fileName, file)

          if (uploadError) {
            console.error('Erreur upload image:', uploadError)
            continue
          }

          // Récupérer l'URL publique
          const { data: { publicUrl } } = supabase.storage
            .from('article-images')
            .getPublicUrl(fileName)

          // Enregistrer dans la table standard_article_photos
          await supabase
            .from('standard_article_photos')
            .insert([
              {
                article_id: article.id,
                url: publicUrl,
                ordre: i
              }
            ])
        }
      }

      router.push(`/articles/${article.id}`)
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la création de l\'article')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-green-700 text-white py-6 px-8 shadow-md">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold">📝 Nouvel Article Standard</h1>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto p-8">
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-8 space-y-6">

            {/* Nom */}
            <div>
              <label htmlFor="nom" className="block text-sm font-medium text-gray-700 mb-2">
                Nom de l'article <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                id="nom"
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-700 focus:border-transparent"
                placeholder="Ex: Caisse en bois vintage"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-700 focus:border-transparent"
                placeholder="Description détaillée de l'article..."
              />
            </div>

            {/* Catégorie */}
            <div>
              <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 mb-2">
                Catégorie
              </label>
              <select
                id="category_id"
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-700 focus:border-transparent"
              >
                <option value="">-- Sélectionner une catégorie --</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>

            {/* Prix d'achat et Prix de vente */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="prix_achat" className="block text-sm font-medium text-gray-700 mb-2">
                  Prix d'achat (€)
                </label>
                <input
                  type="number"
                  id="prix_achat"
                  name="prix_achat"
                  value={formData.prix_achat}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-700 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label htmlFor="prix_vente" className="block text-sm font-medium text-gray-700 mb-2">
                  Prix de vente (€)
                </label>
                <input
                  type="number"
                  id="prix_vente"
                  name="prix_vente"
                  value={formData.prix_vente}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-700 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Quantité */}
            <div>
              <label htmlFor="quantite" className="block text-sm font-medium text-gray-700 mb-2">
                Quantité <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                id="quantite"
                name="quantite"
                value={formData.quantite}
                onChange={handleChange}
                required
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-700 focus:border-transparent"
              />
            </div>

            {/* Canal de vente */}
            <div>
              <label htmlFor="channel_id" className="block text-sm font-medium text-gray-700 mb-2">
                Canal de vente
              </label>
              <select
                id="channel_id"
                name="channel_id"
                value={formData.channel_id}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-700 focus:border-transparent"
              >
                <option value="">-- Sélectionner un canal --</option>
                {channels.map(channel => (
                  <option key={channel.id} value={channel.id}>{channel.name}</option>
                ))}
              </select>
            </div>

            {/* Statut */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Statut <span className="text-red-600">*</span>
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-700 focus:border-transparent"
              >
                <option value="en_vente">En vente</option>
                <option value="accepte">Accepté</option>
                <option value="vendu">Vendu</option>
                <option value="archive">Archivé</option>
              </select>
            </div>

            {/* Upload d'images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Photos de l'article
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelect}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                >
                  <span className="text-2xl">📷</span>
                  <span>Ajouter des photos</span>
                </label>
                <p className="text-sm text-gray-500 mt-2">
                  Vous pouvez ajouter plusieurs images
                </p>
              </div>

              {/* Previews des images */}
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Boutons */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-green-700 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-800 transition disabled:bg-gray-400"
              >
                {loading ? 'Création...' : 'Créer l\'article'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/articles')}
                className="px-6 py-3 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-100 transition"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
