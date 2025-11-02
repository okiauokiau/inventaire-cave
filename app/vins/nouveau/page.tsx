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
    description: '',
    garde_optimale_min: '',
    garde_optimale_max: '',
    temperature_service: '',
    accords_mets: '',
    prix_achat_unitaire: '',
    commentaire_general: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const preview = URL.createObjectURL(file)
      setPhotos(prev => [...prev, { file, preview, commentaire: '' }])
    }
  }

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index))
    if (currentPhotoIndex >= photos.length - 1) {
      setCurrentPhotoIndex(Math.max(0, photos.length - 2))
    }
  }

  const updatePhotoComment = (index: number, commentaire: string) => {
    setPhotos(prev => prev.map((photo, i) => 
      i === index ? { ...photo, commentaire } : photo
    ))
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
          description: formData.description || null,
          garde_optimale_min: formData.garde_optimale_min ? parseInt(formData.garde_optimale_min) : null,
          garde_optimale_max: formData.garde_optimale_max ? parseInt(formData.garde_optimale_max) : null,
          temperature_service: formData.temperature_service || null,
          accords_mets: formData.accords_mets || null,
          prix_achat_unitaire: formData.prix_achat_unitaire ? parseFloat(formData.prix_achat_unitaire) : null,
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
      {/* Header coloré */}
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
          
          {/* Carte 1 : Informations essentielles - VIOLET */}
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

          {/* Carte 2 : Caractéristiques - BLEU */}
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
                  placeholder="Cabernet Sauvignon 87%, Merlot 10%..."
                />
              </div>

              <div>
                <label className="block text-sm font-black text-blue-900 mb-2 uppercase tracking-wider">
                  💰 Prix (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="prix_achat_unitaire"
                  value={formData.prix_achat_unitaire}
                  onChange={handleChange}
                  className="w-full px-5 py-4 bg-white border-3 border-blue-300 rounded-2xl focus:border-blue-600 focus:ring-4 focus:ring-blue-200 focus:outline-none transition"
                  placeholder="450"
                />
              </div>
            </div>
          </div>

          {/* Carte 3 : Photos avec CARROUSEL - VERT */}
          <div className="bg-gradient-to-br from-white to-green-50 rounded-3xl shadow-2xl p-8 border-4 border-green-200">
            <h2 className="text-3xl font-black text-green-900 mb-6 flex items-center gap-3">
              <span className="bg-gradient-to-br from-green-500 to-green-700 text-white w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-lg">
                3
              </span>
              Photos
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
              className="inline-flex items-center gap-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-10 py-5 rounded-2xl cursor-pointer hover:shadow-2xl hover:scale-105 transition-all font-black text-xl border-4 border-green-400"
            >
              <span className="text-3xl">📷</span>
              Prendre des photos
            </label>

            {photos.length > 0 && (
              <div className="mt-8">
                {/* CARROUSEL */}
                <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl overflow-hidden shadow-2xl">
                  {/* Image principale */}
                  <div className="relative h-96 flex items-center justify-center p-4">
                    <img 
                      src={photos[currentPhotoIndex].preview} 
                      alt={`Photo ${currentPhotoIndex + 1}`}
                      className="max-h-full max-w-full object-contain rounded-2xl shadow-2xl"
                    />
                    
                    {/* Flèches navigation */}
                    {photos.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={() => setCurrentPhotoIndex((currentPhotoIndex - 1 + photos.length) % photos.length)}
                          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white w-16 h-16 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-all font-black text-3xl text-gray-900"
                        >
                          ‹
                        </button>
                        <button
                          type="button"
                          onClick={() => setCurrentPhotoIndex((currentPhotoIndex + 1) % photos.length)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white w-16 h-16 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-all font-black text-3xl text-gray-900"
                        >
                          ›
                        </button>
                      </>
                    )}

                    {/* Compteur */}
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-full text-lg font-black shadow-lg">
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

                  {/* Commentaire */}
                  <div className="bg-gradient-to-r from-gray-800 to-gray-700 p-6 border-t-4 border-green-500">
                    <input
                      type="text"
                      placeholder="💬 Ajouter un commentaire sur cette photo..."
                      value={photos[currentPhotoIndex].commentaire}
                      onChange={(e) => updatePhotoComment(currentPhotoIndex, e.target.value)}
                      className="w-full px-5 py-4 bg-white/10 border-2 border-white/20 rounded-2xl focus:border-green-400 focus:bg-white/20 focus:outline-none transition text-white placeholder-white/60 font-semibold"
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
                          className={`flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden border-4 transition-all hover:scale-110 ${
                            index === currentPhotoIndex 
                              ? 'border-green-400 shadow-lg shadow-green-500/50' 
                              : 'border-gray-600 hover:border-green-300 opacity-60 hover:opacity-100'
                          }`}
                        >
                          <img
                            src={photo.preview}
                            alt={`Miniature ${index + 1}`}
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

          {/* Carte 4 : Commentaire - ORANGE */}
          <div className="bg-gradient-to-br from-white to-orange-50 rounded-3xl shadow-2xl p-8 border-4 border-orange-200">
            <h2 className="text-3xl font-black text-orange-900 mb-6 flex items-center gap-3">
              <span className="bg-gradient-to-br from-orange-500 to-orange-700 text-white w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-lg">
                4
              </span>
              Notes & commentaires
            </h2>
            <textarea
              name="commentaire_general"
              value={formData.commentaire_general}
              onChange={handleChange}
              rows={6}
              className="w-full px-5 py-4 bg-white border-3 border-orange-300 rounded-2xl focus:border-orange-600 focus:ring-4 focus:ring-orange-200 focus:outline-none transition"
              placeholder="📝 Cartons, emplacement cave, notes de dégustation, historique..."
            />
          </div>

          {/* Boutons */}
          <div className="flex gap-4 sticky bottom-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 text-white py-6 rounded-2xl font-black hover:shadow-2xl hover:scale-105 transition-all disabled:opacity-50 text-xl border-4 border-white shadow-xl"
            >
              {loading ? '⏳ Création en cours...' : '✓ Créer le vin'}
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
