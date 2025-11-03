'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Vin, Photo, COULEURS, VOLUMES } from '@/types'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function ModifierVin() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [vin, setVin] = useState<Vin | null>(null)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [newPhotos, setNewPhotos] = useState<{ file: File; preview: string; commentaire: string }[]>([])
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

  useEffect(() => {
    fetchVin()
  }, [id])

  async function fetchVin() {
    try {
      const { data, error } = await supabase
        .from('vins')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      setVin(data)
      setFormData({
        nom: data.nom || '',
        producteur: data.producteur || '',
        appellation: data.appellation || '',
        region: data.region || '',
        pays: data.pays || '',
        millesime: data.millesime?.toString() || '',
        couleur: data.couleur || '',
        cepage: data.cepage || '',
        degre_alcool: data.degre_alcool?.toString() || '',
        volume_bouteille: data.volume_bouteille || '',
        commentaire_general: data.commentaire_general || '',
      })

      const { data: photosData } = await supabase
        .from('photos')
        .select('*')
        .eq('vin_id', id)
        .order('ordre', { ascending: true })

      setPhotos(photosData || [])
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors du chargement du vin')
    } finally {
      setLoadingData(false)
    }
  }

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
    setNewPhotos(prev => [...prev, ...newPhotosArray])
  }

  const updateNewPhotoComment = (index: number, commentaire: string) => {
    setNewPhotos(prev => prev.map((photo, i) =>
      i === index ? { ...photo, commentaire } : photo
    ))
  }

  const deleteExistingPhoto = async (photoId: string, photoUrl: string) => {
    if (!confirm('Supprimer cette photo ?')) return

    try {
      const urlParts = photoUrl.split('/photos-vins/')
      if (urlParts.length > 1) {
        const filePath = urlParts[1].split('?')[0]
        await supabase.storage.from('photos-vins').remove([filePath])
      }

      const { error } = await supabase.from('photos').delete().eq('id', photoId)
      if (error) throw error

      const updatedPhotos = photos.filter(p => p.id !== photoId)
      setPhotos(updatedPhotos)

      const all = [...updatedPhotos, ...newPhotos]
      if (currentPhotoIndex >= all.length && all.length > 0) {
        setCurrentPhotoIndex(all.length - 1)
      }

      alert('Photo supprimée')
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la suppression')
    }
  }

  const removeNewPhoto = (index: number) => {
    const updatedNewPhotos = newPhotos.filter((_, i) => i !== index)
    setNewPhotos(updatedNewPhotos)

    const allPhotos = [...photos, ...updatedNewPhotos]
    if (currentPhotoIndex >= allPhotos.length && allPhotos.length > 0) {
      setCurrentPhotoIndex(allPhotos.length - 1)
    }
  }

  const allPhotos = [...photos, ...newPhotos]

  const prevPhoto = () => {
    if (allPhotos.length === 0) return
    setCurrentPhotoIndex((prev) => (prev - 1 + allPhotos.length) % allPhotos.length)
  }

  const nextPhoto = () => {
    if (allPhotos.length === 0) return
    setCurrentPhotoIndex((prev) => (prev + 1) % allPhotos.length)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error: vinError } = await supabase
        .from('vins')
        .update({
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
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (vinError) throw vinError

      if (newPhotos.length > 0) {
        const maxOrdre = photos.length > 0 ? Math.max(...photos.map(p => p.ordre)) : 0

        for (let i = 0; i < newPhotos.length; i++) {
          const photo = newPhotos[i]
          const fileName = `${id}/${Date.now()}-${i}.jpg`

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
              vin_id: id,
              url: publicUrl,
              commentaire: photo.commentaire || null,
              ordre: maxOrdre + i + 1,
            }])

          if (photoError) throw photoError
        }
      }

      alert('Vin modifié avec succès !')
      router.push(`/vins/${id}`)
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la modification du vin')
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
        <div className="text-3xl font-black text-purple-600">⏳ Chargement...</div>
      </div>
    )
  }

  if (!vin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Vin non trouvé</div>
      </div>
    )
  }

  const currentPhoto = allPhotos[currentPhotoIndex]
  const isNewPhoto = currentPhotoIndex >= photos.length

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 text-white shadow-2xl">
        <div className="max-w-5xl mx-auto py-8 px-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-5xl font-black mb-2 drop-shadow-lg">✏️ Modifier le vin</h1>
              <p className="text-xl text-purple-100">{vin.nom} {vin.millesime}</p>
            </div>
            <Link 
              href={`/vins/${id}`}
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
                📝
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
                />
              </div>
            </div>
          </div>

          {/* Caractéristiques - BLEU */}
          <div className="bg-gradient-to-br from-white to-blue-50 rounded-3xl shadow-2xl p-8 border-4 border-blue-200">
            <h2 className="text-3xl font-black text-blue-900 mb-6 flex items-center gap-3">
              <span className="bg-gradient-to-br from-blue-500 to-blue-700 text-white w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-lg">
                🍷
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
                />
              </div>
            </div>
          </div>

          {/* Carrousel Photos - ORANGE */}
          <div className="bg-gradient-to-br from-white to-orange-50 rounded-3xl shadow-2xl p-8 border-4 border-orange-200">
            <h2 className="text-3xl font-black text-orange-900 mb-6 flex items-center gap-3">
              <span className="bg-gradient-to-br from-orange-500 to-orange-700 text-white w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-lg">
                📸
              </span>
              Photos
            </h2>

            {allPhotos.length > 0 && (
              <div className="mb-4">
                <img
                  src={currentPhoto.preview || currentPhoto.url}
                  alt={`Photo ${currentPhotoIndex + 1}`}
                  className="rounded-2xl w-full max-h-[400px] object-cover shadow-lg"
                />
                <div className="flex justify-between mt-2">
                  <button type="button" onClick={prevPhoto} className="bg-orange-400 text-white px-4 py-2 rounded-2xl">←</button>
                  <span>{currentPhotoIndex + 1} / {allPhotos.length}</span>
                  <button type="button" onClick={nextPhoto} className="bg-orange-400 text-white px-4 py-2 rounded-2xl">→</button>
                </div>
                <div className="mt-2 flex justify-between items-center gap-2">
                  {isNewPhoto ? (
                    <button type="button" onClick={() => removeNewPhoto(currentPhotoIndex - photos.length)} className="text-red-600 font-bold">Supprimer</button>
                  ) : (
                    <button type="button" onClick={() => deleteExistingPhoto(currentPhoto.id, currentPhoto.url)} className="text-red-600 font-bold">Supprimer</button>
                  )}
                </div>
              </div>
            )}

            <input type="file" multiple accept="image/*" onChange={handlePhotoCapture} className="mt-4" />
          </div>

          {/* Commentaire général */}
          <div>
            <label className="block text-sm font-black text-gray-900 mb-2 uppercase tracking-wider">
              📝 Commentaire général
            </label>
            <textarea
              name="commentaire_general"
              value={formData.commentaire_general}
              onChange={handleChange}
              className="w-full px-5 py-4 bg-white border-3 border-gray-300 rounded-2xl focus:border-gray-600 focus:ring-4 focus:ring-gray-200 focus:outline-none transition"
            />
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={loading} className="bg-green-500 text-white px-8 py-4 rounded-2xl font-bold hover:bg-green-600 transition">
              {loading ? 'Modification...' : 'Modifier le vin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
