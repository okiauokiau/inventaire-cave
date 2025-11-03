'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Vin, Photo, Bouteille } from '@/types'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

export default function VinDetail() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [vin, setVin] = useState<Vin | null>(null)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [bouteilles, setBouteilles] = useState<Bouteille[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)

  const [stats, setStats] = useState({
    total: 0,
    excellent: 0,
    bon: 0,
    correct: 0,
    moyen: 0,
    mauvais: 0,
    difficulte: 0
  })

  const [niveaux, setNiveaux] = useState({
    plein: 0,
    haut_epaule: 0,
    mi_epaule: 0,
    bas_epaule: 0,
    haut_goulot: 0,
    mi_goulot: 0
  })

  useEffect(() => {
    fetchVin()
  }, [id])

  async function fetchVin() {
    try {
      const { data: vinData, error: vinError } = await supabase
        .from('vins')
        .select('*')
        .eq('id', id)
        .single()

      if (vinError) throw vinError
      setVin(vinData)

      const { data: photosData } = await supabase
        .from('photos')
        .select('*')
        .eq('vin_id', id)
        .order('ordre', { ascending: true })

      setPhotos(photosData || [])

      const { data: bouteillesData } = await supabase
        .from('bouteilles')
        .select('*')
        .eq('vin_id', id)
        .order('created_at', { ascending: false })

      setBouteilles(bouteillesData || [])

      if (bouteillesData) {
        const statsCalc = {
          total: bouteillesData.length,
          excellent: bouteillesData.filter(b => b.etat_qualitatif === 'EXCELLENT').length,
          bon: bouteillesData.filter(b => b.etat_qualitatif === 'BON').length,
          correct: bouteillesData.filter(b => b.etat_qualitatif === 'CORRECT').length,
          moyen: bouteillesData.filter(b => b.etat_qualitatif === 'MOYEN').length,
          mauvais: bouteillesData.filter(b => b.etat_qualitatif === 'MAUVAIS').length,
          difficulte: bouteillesData.filter(b => b.etat_qualitatif === 'DIFFICULTE_EVOLUTION').length
        }
        setStats(statsCalc)

        const niveauxCalc = {
          plein: bouteillesData.filter(b => b.niveau_remplissage === 'PLEIN').length,
          haut_epaule: bouteillesData.filter(b => b.niveau_remplissage === 'HAUT_EPAULE').length,
          mi_epaule: bouteillesData.filter(b => b.niveau_remplissage === 'MI_EPAULE').length,
          bas_epaule: bouteillesData.filter(b => b.niveau_remplissage === 'BAS_EPAULE').length,
          haut_goulot: bouteillesData.filter(b => b.niveau_remplissage === 'HAUT_GOULOT').length,
          mi_goulot: bouteillesData.filter(b => b.niveau_remplissage === 'MI_GOULOT').length
        }
        setNiveaux(niveauxCalc)
      }
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteVin = async () => {
    if (!confirm('Supprimer ce vin et toutes ses bouteilles ?')) return

    try {
      const { error } = await supabase.from('vins').delete().eq('id', id)
      if (error) throw error
      alert('Vin supprimé')
      router.push('/')
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la suppression')
    }
  }

  const prevPhoto = () => {
    if (photos.length === 0) return
    setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length)
  }

  const nextPhoto = () => {
    if (photos.length === 0) return
    setCurrentPhotoIndex((prev) => (prev + 1) % photos.length)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
        <div className="text-3xl font-black text-purple-600">⏳ Chargement...</div>
      </div>
    )
  }

  if (!vin) {
    return <div className="p-8 text-xl">Vin non trouvé</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 text-white shadow-2xl">
        <div className="max-w-5xl mx-auto py-8 px-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-5xl font-black mb-2 drop-shadow-lg">
                🍷 {vin.nom} {vin.millesime}
              </h1>
              <p className="text-xl text-purple-100">{vin.producteur}</p>
            </div>
            <div className="flex gap-3">
              <Link href={`/vins/${id}/modifier`} className="bg-white/20 hover:bg-white/30 backdrop-blur px-6 py-3 rounded-2xl transition font-bold border-2 border-white/30">✏️ Modifier</Link>
              <Link href="/" className="bg-white/20 hover:bg-white/30 backdrop-blur px-6 py-3 rounded-2xl transition font-bold border-2 border-white/30">← Retour</Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto py-8 px-6 space-y-6">
        {/* SECTION 1 : Informations */}
        <div className="bg-gradient-to-br from-white to-purple-50 rounded-3xl shadow-2xl p-8 border-4 border-purple-200">
          <h2 className="text-3xl font-black text-purple-900 mb-6 flex items-center gap-3">
            <span className="bg-gradient-to-br from-purple-500 to-purple-700 text-white w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-lg">📋</span>
            Informations du vin
          </h2>
          {/* ... fields omitted ... */}
        </div>

        {/* SECTION 4 : CARROUSEL PHOTOS - MODIFIÉ */}
        {photos.length > 0 && (
          <div className="bg-gradient-to-br from-white to-orange-50 rounded-3xl shadow-2xl p-8 border-4 border-orange-200">
            <h2 className="text-3xl font-black text-orange-900 mb-6 flex items-center gap-3">
              <span className="bg-gradient-to-br from-orange-500 to-orange-700 text-white w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-lg">📷</span>
              Photos ({photos.length})
            </h2>

            <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl overflow-hidden shadow-2xl max-w-full">
              {/* Image principale - responsive */}
              <div className="relative w-full h-auto flex items-center justify-center p-2 sm:p-4">
                <img 
                  src={photos[currentPhotoIndex]?.url} 
                  alt={`Photo ${currentPhotoIndex + 1}`}
                  className="max-h-[70vh] w-auto object-contain rounded-2xl shadow-2xl transition-all duration-500 ease-in-out"

                />

                {/* Flèches (si plusieurs photos) */}
                {photos.length > 1 && (
                  <>
                    <button type="button" onClick={prevPhoto} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white w-14 h-14 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-all font-black text-3xl text-gray-900">‹</button>
                    <button type="button" onClick={nextPhoto} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white w-14 h-14 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-all font-black text-3xl text-gray-900">›</button>
                  </>
                )}

                {/* Compteur */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-2 rounded-full text-lg font-black shadow-lg">
                  {currentPhotoIndex + 1} / {photos.length}
                </div>
              </div>

              {/* Commentaire */}
              {photos[currentPhotoIndex]?.commentaire && (
                <div className="bg-gradient-to-r from-gray-800 to-gray-700 p-5 border-t-4 border-orange-500">
                  <div className="text-white font-semibold">💬 {photos[currentPhotoIndex].commentaire}</div>
                </div>
              )}

              {/* Miniatures - scroll horizontal, tactile friendly */}
              {photos.length > 1 && (
                <div className="bg-gray-900 p-4 flex gap-3 overflow-x-auto" style={{ touchAction: 'pan-y' }}>
                  {photos.map((photo, index) => (
                    <button key={photo.id} type="button" onClick={() => setCurrentPhotoIndex(index)}
                      className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-4 transition-all hover:scale-110 ${index === currentPhotoIndex ? 'border-orange-400 shadow-lg shadow-orange-500/50 scale-110' : 'border-gray-600 hover:border-orange-300 opacity-60 hover:opacity-100'}`}>
                      <img src={photo.url} alt={`Mini ${index + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* SECTION 5 : Commentaire */}
        {vin.commentaire_general && (
          <div className="bg-gradient-to-br from-white to-yellow-50 rounded-3xl shadow-2xl p-8 border-4 border-yellow-200">
            <h2 className="text-3xl font-black text-yellow-900 mb-6 flex items-center gap-3">
              <span className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-lg">📝</span>
              Notes & commentaires
            </h2>
            <div className="bg-white rounded-2xl p-6 border-2 border-yellow-300">
              <p className="whitespace-pre-wrap text-gray-800">{vin.commentaire_general}</p>
            </div>
          </div>
        )}

        {/* ... remaining sections unchanged ... */}
      </div>
    </div>
  )
}
