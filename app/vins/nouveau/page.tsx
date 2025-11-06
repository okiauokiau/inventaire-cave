'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { COULEURS, VOLUMES } from '@/types'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NouveauVin() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [photos, setPhotos] = useState<{ file: File; preview: string; commentaire: string }[]>([])
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  
  const [formData, setFormData] = useState({
    nom: '',
    producteur: '',
    appellation: '',
    region: '',
    pays: '',
    millesime: '',
    couleur: '',
    cepage: '',
    degre_alcool: '',
    volume_bouteille: '',
    commentaire_general: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newPhotosArray: { file: File; preview: string; commentaire: string }[] = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const preview = URL.createObjectURL(file)
      newPhotosArray.push({ file, preview, commentaire: '' })
    }
    setPhotos(prev => [...prev, ...newPhotosArray])
    if (photos.length === 0) {
      setCurrentPhotoIndex(0)
    }
  }

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index)
    setPhotos(newPhotos)
    if (newPhotos.length === 0) {
      setCurrentPhotoIndex(0)
    } else if (currentPhotoIndex >= newPhotos.length) {
      setCurrentPhotoIndex(newPhotos.length - 1)
    }
  }

  const updatePhotoComment = (index: number, commentaire: string) => {
    setPhotos(prev => prev.map((photo, i) => 
      i === index ? { ...photo, commentaire } : photo
    ))
  }

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length)
  }

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % photos.length)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: vin, error: vinError } = await supabase
        .from('vins')
        .insert([{
          nom: formData.nom,
          producteur: formData.producteur || null,
          appellation: formData.appellation || null,
          region: formData.region || null,
          pays: formData.pays || null,
          millesime: formData.millesime ? parseInt(formData.millesime) : null,
          couleur: formData.couleur || null,
          cepage: formData.cepage || null,
          degre_alcool: formData.degre_alcool ? parseFloat(formData.degre_alcool) : null,
          volume_bouteille: formData.volume_bouteille || null,
          commentaire_general: formData.commentaire_general || null,
        }])
        .select()
        .single()

      if (vinError) throw vinError

      if (photos.length > 0) {
        for (let i = 0; i < photos.length; i++) {
          const photo = photos[i]
          const fileName = `${vin.id}/${Date.now()}-${i}.jpg`

          const { error: uploadError } = await supabase.storage
            .from('photos-vins')
            .upload(fileName, photo.file)

          if (uploadError) throw uploadError

          const { data: { publicUrl } } = supabase.storage
            .from('photos-vins')
            .getPublicUrl(fileName)

          const { error: photoError } = await supabase
            .from('photos')
            .insert([{
              vin_id: vin.id,
              url: publicUrl,
              commentaire: photo.commentaire || null,
              ordre: i + 1,
            }])

          if (photoError) throw photoError
        }
      }

      alert('Vin créé avec succès !')
      router.push(`/vins/${vin.id}`)
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la création du vin')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 text-white shadow-2xl">
        <div className="max-w-5xl mx-auto py-8 px-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-5xl font-black mb-2 drop-shadow-lg">🍷 Nouveau vin</h1>
              <p className="text-xl text-purple-100">Ajoutez un vin à votre cave</p>
            </div>
            <Link 
              href="/"
              className="bg-white/20 hover:bg-white/30 backdrop-blur px-8 py-4 rounded-2xl transition font-bold text-lg border-2 border-white/30"
            >
              ← Retour
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto py-8 px-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Informations essentielles - VIOLET */}
          <div className="bg-gradient-to-br from-white to-purple-50 rounded-3xl shadow-2xl p-8 border-4 border-purple-200">
            <h2 className="text-3xl font-black text-purple-900 mb-6 flex items-center gap-3">
              <span className="bg-gradient-to-br from-purple-500 to-purple-700 text-white w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-lg">
                1
              </span>
              Informations essentielles
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-black text-purple-900 mb-2 uppercase tracking-wider">
                  🏷️ Nom du vin *
                </label>
                <input
                  type="text"
                  name="nom"
                  required
                  value={formData.nom}
                  onChange={handleChange}
                  className="w-full px-5 py-4 bg-white border-3 border-purple-300 rounded-2xl focus:border-purple-600 focus:ring-4 focus:ring-purple-200 focus:outline-none transition text-lg font-semibold"
                  placeholder="Château Margaux"
                />
              </div>

              <div>
                <label className="block text-sm font-black text-purple-900 mb-2 uppercase tracking-wider">
                  📅 Millésime
                </label>
                <input
                  type="number"
                  name="millesime"
                  value={formData.millesime}
                  onChange={handleChange}
                  className="w-full px-5 py-4 bg-white border-3 border-purple-300 rounded-2xl focus:border-purple-600 focus:ring-4 focus:ring-purple-200 focus:outline-none transition text-lg font-semibold"
                  placeholder="2015"
                />
              </div>

              <div>
                <label className="block text-sm font-black text-purple-900 mb-2 uppercase tracking-wider">
                  🏭 Producteur
                </label>
                <input
                  type="text"
                  name="producteur"
                  value={formData.producteur}
                  onChange={handleChange}
                  className="w-full px-5 py-4 bg-white border-3 border-purple-300 rounded-2xl focus:border-purple-600 focus:ring-4 focus:ring-purple-200 focus:outline-none transition"
                  placeholder="Château Margaux"
                />
              </div>

              <div>
                <label className="block text-sm font-black text-purple-900 mb-2 uppercase tracking-wider">
                  🎯 Appellation
                </label>
                <input
                  type="text"
                  name="appellation"
                  value={formData.appellation}
                  onChange={handleChange}
                  className="w-full px-5 py-4 bg-white border-3 border-purple-300 rounded-2xl focus:border-purple-600 focus:ring-4 focus:ring-purple-200 focus:outline-none transition"
                  placeholder="Margaux AOC"
                />
              </div>

              <div>
                <label className="block text-sm font-black text-purple-900 mb-2 uppercase tracking-wider">
                  🗺️ Région
                </label>
                <input
                  type="text"
                  name="region"
                  value={formData.region}
                  onChange={handleChange}
                  className="w-full px-5 py-4 bg-white border-3 border-purple-300 rounded-2xl focus:border-purple-600 focus:ring-4 focus:ring-purple-200 focus:outline-none transition"
                  placeholder="Bordeaux"
                />
              </div>

              <div>
                <label className="block text-sm font-black text-purple-900 mb-2 uppercase tracking-wider">
                  🌍 Pays
                </label>
                <input
                  type="text"
                  name="pays"
                  value={formData.pays}
                  onChange={handleChange}
                  className="w-full px-5 py-4 bg-white border-3 border-purple-300 rounded-2xl focus:border-purple-600 focus:ring-4 focus:ring-purple-200 focus:outline-none transition"
                  placeholder="France"
                />
              </div>
            </div>
          </div>

          {/* Caractéristiques - BLEU */}
          <div className="bg-gradient-to-br from-white to-blue-50 rounded-3xl shadow-2xl p-8 border-4 border-blue-200">
            <h2 className="text-3xl font-black text-blue-900 mb-6 flex items-center gap-3">
              <span className="bg-gradient-to-br from-blue-500 to-blue-700 text-white w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-lg">
                2
              </span>
              Caractéristiques
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-black text-blue-900 mb-2 uppercase tracking-wider">
                  🎨 Couleur
                </label>
                <select
                  name="couleur"
                  value={formData.couleur}
                  onChange={handleChange}
                  className="w-full px-5 py-4 bg-white border-3 border-blue-300 rounded-2xl focus:border-blue-600 focus:ring-4 focus:ring-blue-200 focus:outline-none transition font-semibold"
                >
                  <option value="">Choisir...</option>
                  {COULEURS.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-black text-blue-900 mb-2 uppercase tracking-wider">
                  🍾 Volume
                </label>
                <select
                  name="volume_bouteille"
                  value={formData.volume_bouteille}
                  onChange={handleChange}
                  className="w-full px-5 py-4 bg-white border-3 border-blue-300 rounded-2xl focus:border-blue-600 focus:ring-4 focus:ring-blue-200 focus:outline-none transition font-semibold"
                >
                  <option value="">Choisir...</option>
                  {VOLUMES.map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-black text-blue-900 mb-2 uppercase tracking-wider">
                  🌡️ Degré (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="degre_alcool"
                  value={formData.degre_alcool}
                  onChange={handleChange}
                  className="w-full px-5 py-4 bg-white border-3 border-blue-300 rounded-2xl focus:border-blue-600 focus:ring-4 focus:ring-blue-200 focus:outline-none transition"
                  placeholder="13.5"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-black text-blue-900 mb-2 uppercase tracking-wider">
                  🍇 Cépage
                </label>
                <input
                  type="text"
                  name="cepage"
                  value={formData.cepage}
                  onChange={handleChange}
                  className="w-full px-5 py-4 bg-white border-3 border-blue-300 rounded-2xl focus:border-blue-600 focus:ring-4 focus:ring-blue-200 focus:outline-none transition"
                  placeholder="Cabernet Sauvignon 87%..."
                />
              </div>
            </div>
          </div>

          {/* Photos avec CARROUSEL - ORANGE */}
          <div className="bg-gradient-to-br from-white to-orange-50 rounded-3xl shadow-2xl p-8 border-4 border-orange-200">
            <h2 className="text-3xl font-black text-orange-900 mb-6 flex items-center gap-3">
              <span className="bg-gradient-to-br from-orange-500 to-orange-700 text-white w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-lg">
                3
              </span>
              Photos {photos.length > 0 && `(${photos.length})`}
            </h2>
            
            <input
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              onChange={handlePhotoCapture}
              className="hidden"
              id="photo-input"
            />
            
            <label
              htmlFor="photo-input"
              className="inline-flex items-center gap-3 bg-gradient-to-r from-orange-600 to-orange-700 text-white px-10 py-5 rounded-2xl cursor-pointer hover:shadow-2xl hover:scale-105 transition-all font-black text-xl border-4 border-orange-400"
            >
              <span className="text-3xl">📷</span>
              Prendre des photos
            </label>

            {/* CARROUSEL (si photos) */}
            {photos.length > 0 && (
              <div className="mt-8">
                <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl overflow-hidden shadow-2xl">
                  {/* Image principale */}
                  <div className="relative h-80 flex items-center justify-center p-4">
                    <img 
                      src={photos[currentPhotoIndex]?.preview} 
                      alt={`Photo ${currentPhotoIndex + 1}`}
                      className="max-h-full max-w-full object-contain rounded-2xl shadow-2xl"
                    />
                    
                    {/* Flèches (si plusieurs photos) */}
                    {photos.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={prevPhoto}
                          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white w-14 h-14 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-all font-black text-3xl text-gray-900"
                        >
                          ‹
                        </button>
                        <button
                          type="button"
                          onClick={nextPhoto}
                          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white w-14 h-14 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-all font-black text-3xl text-gray-900"
                        >
                          ›
                        </button>
                      </>
                    )}

                    {/* Compteur */}
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-2 rounded-full text-lg font-black shadow-lg">
                      {currentPhotoIndex + 1} / {photos.length}
                    </div>

                    {/* Bouton supprimer */}
                    <button
                      type="button"
                      onClick={() => removePhoto(currentPhotoIndex)}
                      className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all font-black text-xl"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Commentaire éditable */}
                  <div className="bg-gradient-to-r from-gray-800 to-gray-700 p-5 border-t-4 border-orange-500">
                    <input
                      type="text"
                      placeholder="💬 Ajouter un commentaire..."
                      value={photos[currentPhotoIndex]?.commentaire || ''}
                      onChange={(e) => updatePhotoComment(currentPhotoIndex, e.target.value)}
                      className="w-full px-5 py-3 bg-white/10 border-2 border-white/20 rounded-2xl focus:border-orange-400 focus:bg-white/20 focus:outline-none transition text-white placeholder-white/60 font-semibold"
                    />
                  </div>

                  {/* Miniatures */}
                  {photos.length > 1 && (
                    <div className="bg-gray-900 p-4 flex gap-3 overflow-x-auto">
                      {photos.map((photo, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setCurrentPhotoIndex(index)}
                          className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-4 transition-all hover:scale-110 ${
                            index === currentPhotoIndex 
                              ? 'border-orange-400 shadow-lg shadow-orange-500/50 scale-110' 
                              : 'border-gray-600 hover:border-orange-300 opacity-60 hover:opacity-100'
                          }`}
                        >
                          <img
                            src={photo.preview}
                            alt={`Mini ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Commentaire - JAUNE */}
          <div className="bg-gradient-to-br from-white to-yellow-50 rounded-3xl shadow-2xl p-8 border-4 border-yellow-200">
            <h2 className="text-3xl font-black text-yellow-900 mb-6 flex items-center gap-3">
              <span className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-lg">
                4
              </span>
              Notes & commentaires
            </h2>
            <textarea
              name="commentaire_general"
              value={formData.commentaire_general}
              onChange={handleChange}
              rows={5}
              className="w-full px-5 py-4 bg-white border-3 border-yellow-300 rounded-2xl focus:border-yellow-600 focus:ring-4 focus:ring-yellow-200 focus:outline-none transition"
              placeholder="📝 Cartons, emplacement..."
            />
          </div>

          {/* Boutons */}
          <div className="flex gap-4 sticky bottom-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 text-white py-6 rounded-2xl font-black hover:shadow-2xl hover:scale-105 transition-all disabled:opacity-50 text-xl border-4 border-white shadow-xl"
            >
              {loading ? '⏳ Création...' : '✓ Créer le vin'}
            </button>
            <Link
              href="/"
              className="px-10 py-6 bg-white border-4 border-gray-300 rounded-2xl font-black hover:bg-gray-50 hover:scale-105 transition-all text-center shadow-lg"
            >
              Annuler
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
