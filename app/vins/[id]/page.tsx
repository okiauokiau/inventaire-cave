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

  // Stats états qualitatifs
  const [stats, setStats] = useState({
    total: 0,
    excellent: 0,
    bon: 0,
    correct: 0,
    moyen: 0,
    mauvais: 0,
    difficulte: 0
  })

  // Stats niveaux remplissage
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
      // Récupérer le vin
      const { data: vinData, error: vinError } = await supabase
        .from('vins')
        .select('*')
        .eq('id', id)
        .single()

      if (vinError) throw vinError
      setVin(vinData)

      // Récupérer les photos
      const { data: photosData } = await supabase
        .from('photos')
        .select('*')
        .eq('vin_id', id)
        .order('ordre', { ascending: true })

      setPhotos(photosData || [])

      // Récupérer les bouteilles
      const { data: bouteillesData } = await supabase
        .from('bouteilles')
        .select('*')
        .eq('vin_id', id)
        .order('created_at', { ascending: false })

      setBouteilles(bouteillesData || [])

      // Calculer stats états
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

        // Calculer stats niveaux
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
    if (photos.length > 0) {
      setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length)
    }
  }

  const nextPhoto = () => {
    if (photos.length > 0) {
      setCurrentPhotoIndex((prev) => (prev + 1) % photos.length)
    }
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
      {/* Header */}
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
              <Link
                href={`/vins/${id}/modifier`}
                className="bg-white/20 hover:bg-white/30 backdrop-blur px-6 py-3 rounded-2xl transition font-bold border-2 border-white/30"
              >
                ✏️ Modifier
              </Link>
              <Link
                href="/"
                className="bg-white/20 hover:bg-white/30 backdrop-blur px-6 py-3 rounded-2xl transition font-bold border-2 border-white/30"
              >
                ← Retour
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto py-8 px-6 space-y-6">
        
        {/* SECTION 1 : Informations du vin - VIOLET */}
        <div className="bg-gradient-to-br from-white to-purple-50 rounded-3xl shadow-2xl p-8 border-4 border-purple-200">
          <h2 className="text-3xl font-black text-purple-900 mb-6 flex items-center gap-3">
            <span className="bg-gradient-to-br from-purple-500 to-purple-700 text-white w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-lg">
              📋
            </span>
            Informations du vin
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {vin.producteur && (
              <div>
                <div className="text-xs font-black text-purple-700 uppercase mb-1">🏭 Producteur</div>
                <div className="text-lg font-semibold">{vin.producteur}</div>
              </div>
            )}
            {vin.appellation && (
              <div>
                <div className="text-xs font-black text-purple-700 uppercase mb-1">🎯 Appellation</div>
                <div className="text-lg font-semibold">{vin.appellation}</div>
              </div>
            )}
            {vin.region && (
              <div>
                <div className="text-xs font-black text-purple-700 uppercase mb-1">🗺️ Région</div>
                <div className="text-lg font-semibold">{vin.region}</div>
              </div>
            )}
            {vin.pays && (
              <div>
                <div className="text-xs font-black text-purple-700 uppercase mb-1">🌍 Pays</div>
                <div className="text-lg font-semibold">{vin.pays}</div>
              </div>
            )}
            {vin.couleur && (
              <div>
                <div className="text-xs font-black text-purple-700 uppercase mb-1">🎨 Couleur</div>
                <div className="text-lg font-semibold">{vin.couleur}</div>
              </div>
            )}
            {vin.cepage && (
              <div>
                <div className="text-xs font-black text-purple-700 uppercase mb-1">🍇 Cépage</div>
                <div className="text-lg font-semibold">{vin.cepage}</div>
              </div>
            )}
            {vin.volume_bouteille && (
              <div>
                <div className="text-xs font-black text-purple-700 uppercase mb-1">🍾 Volume</div>
                <div className="text-lg font-semibold">{vin.volume_bouteille}</div>
              </div>
            )}
            {vin.degre_alcool && (
              <div>
                <div className="text-xs font-black text-purple-700 uppercase mb-1">🌡️ Degré</div>
                <div className="text-lg font-semibold">{vin.degre_alcool}%</div>
              </div>
            )}
            {vin.prix_achat_unitaire && (
              <div>
                <div className="text-xs font-black text-purple-700 uppercase mb-1">💰 Prix</div>
                <div className="text-lg font-semibold">{vin.prix_achat_unitaire}€</div>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 2 : États qualitatifs - VERT */}
        <div className="bg-gradient-to-br from-white to-green-50 rounded-3xl shadow-2xl p-8 border-4 border-green-200">
          <h2 className="text-3xl font-black text-green-900 mb-6 flex items-center gap-3">
            <span className="bg-gradient-to-br from-green-500 to-green-700 text-white w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-lg">
              📊
            </span>
            Inventaire par état qualitatif
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-6 text-center border-4 border-green-300 shadow-lg">
              <div className="text-5xl font-black text-green-700">{stats.total}</div>
              <div className="text-sm font-bold text-gray-600 mt-2">TOTAL</div>
            </div>
            <div className="bg-white rounded-2xl p-6 text-center border-2 border-gray-200">
              <div className="text-4xl font-black text-green-600">{stats.excellent}</div>
              <div className="text-xs font-bold text-gray-600 mt-2">Excellent état</div>
            </div>
            <div className="bg-white rounded-2xl p-6 text-center border-2 border-gray-200">
              <div className="text-4xl font-black text-blue-600">{stats.bon}</div>
              <div className="text-xs font-bold text-gray-600 mt-2">Bon état</div>
            </div>
            <div className="bg-white rounded-2xl p-6 text-center border-2 border-gray-200">
              <div className="text-4xl font-black text-yellow-600">{stats.correct}</div>
              <div className="text-xs font-bold text-gray-600 mt-2">État correct</div>
            </div>
            <div className="bg-white rounded-2xl p-6 text-center border-2 border-gray-200">
              <div className="text-4xl font-black text-orange-600">{stats.moyen}</div>
              <div className="text-xs font-bold text-gray-600 mt-2">État moyen</div>
            </div>
            <div className="bg-white rounded-2xl p-6 text-center border-2 border-gray-200">
              <div className="text-4xl font-black text-red-600">{stats.mauvais}</div>
              <div className="text-xs font-bold text-gray-600 mt-2">Mauvais état</div>
            </div>
            <div className="bg-white rounded-2xl p-6 text-center border-2 border-gray-200">
              <div className="text-4xl font-black text-purple-600">{stats.difficulte}</div>
              <div className="text-xs font-bold text-gray-600 mt-2">Difficulté évolution</div>
            </div>
          </div>
        </div>

        {/* SECTION 3 : Niveaux de remplissage - BLEU */}
        <div className="bg-gradient-to-br from-white to-blue-50 rounded-3xl shadow-2xl p-8 border-4 border-blue-200">
          <h2 className="text-3xl font-black text-blue-900 mb-6 flex items-center gap-3">
            <span className="bg-gradient-to-br from-blue-500 to-blue-700 text-white w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-lg">
              🍾
            </span>
            Niveaux de remplissage
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white rounded-2xl p-6 text-center border-2 border-gray-200">
              <div className="text-4xl font-black text-green-600">{niveaux.plein}</div>
              <div className="text-xs font-bold text-gray-600 mt-2">Plein (100%)</div>
            </div>
            <div className="bg-white rounded-2xl p-6 text-center border-2 border-gray-200">
              <div className="text-4xl font-black text-green-500">{niveaux.haut_epaule}</div>
              <div className="text-xs font-bold text-gray-600 mt-2">Haut épaule (95%)</div>
            </div>
            <div className="bg-white rounded-2xl p-6 text-center border-2 border-gray-200">
              <div className="text-4xl font-black text-yellow-500">{niveaux.mi_epaule}</div>
              <div className="text-xs font-bold text-gray-600 mt-2">Mi-épaule (90%)</div>
            </div>
            <div className="bg-white rounded-2xl p-6 text-center border-2 border-gray-200">
              <div className="text-4xl font-black text-orange-500">{niveaux.bas_epaule}</div>
              <div className="text-xs font-bold text-gray-600 mt-2">Bas épaule (85%)</div>
            </div>
            <div className="bg-white rounded-2xl p-6 text-center border-2 border-gray-200">
              <div className="text-4xl font-black text-red-500">{niveaux.haut_goulot}</div>
              <div className="text-xs font-bold text-gray-600 mt-2">Haut goulot (80%)</div>
            </div>
            <div className="bg-white rounded-2xl p-6 text-center border-2 border-gray-200">
              <div className="text-4xl font-black text-red-700">{niveaux.mi_goulot}</div>
              <div className="text-xs font-bold text-gray-600 mt-2">Mi-goulot (70%)</div>
            </div>
          </div>
        </div>

        {/* SECTION 4 : Photos avec CARROUSEL - ORANGE */}
        {photos.length > 0 && (
          <div className="bg-gradient-to-br from-white to-orange-50 rounded-3xl shadow-2xl p-8 border-4 border-orange-200">
            <h2 className="text-3xl font-black text-orange-900 mb-6 flex items-center gap-3">
              <span className="bg-gradient-to-br from-orange-500 to-orange-700 text-white w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-lg">
                📷
              </span>
              Photos ({photos.length})
            </h2>
            
            <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl overflow-hidden shadow-2xl">
              <div className="relative h-64 flex items-center justify-center p-4">
                <img 
                  src={photos[currentPhotoIndex]?.url} 
                  alt={`Photo ${currentPhotoIndex + 1}`}
                  className="max-h-full max-w-full object-contain rounded-2xl shadow-2xl"
                />
                
                {photos.length > 1 && (
                  <>
                    <button
                      onClick={prevPhoto}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white w-12 h-12 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-all font-black text-2xl text-gray-900"
                    >
                      ‹
                    </button>
                    <button
                      onClick={nextPhoto}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white w-12 h-12 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-all font-black text-2xl text-gray-900"
                    >
                      ›
                    </button>
                  </>
                )}

                <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-full text-sm font-black shadow-lg">
                  {currentPhotoIndex + 1} / {photos.length}
                </div>
              </div>

              {photos[currentPhotoIndex]?.commentaire && (
                <div className="bg-gradient-to-r from-gray-800 to-gray-700 p-4 border-t-4 border-orange-500">
                  <div className="text-white font-semibold text-sm">
                    💬 {photos[currentPhotoIndex].commentaire}
                  </div>
                </div>
              )}

              {photos.length > 1 && (
                <div className="bg-gray-900 p-3 flex gap-2 overflow-x-auto">
                  {photos.map((photo, index) => (
                    <button
                      key={photo.id}
                      onClick={() => setCurrentPhotoIndex(index)}
                      className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-3 transition-all hover:scale-110 ${
                        index === currentPhotoIndex 
                          ? 'border-orange-400 shadow-lg shadow-orange-500/50' 
                          : 'border-gray-600 hover:border-orange-300 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={photo.url}
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

        {/* SECTION 5 : Commentaire général - JAUNE */}
        {vin.commentaire_general && (
          <div className="bg-gradient-to-br from-white to-yellow-50 rounded-3xl shadow-2xl p-8 border-4 border-yellow-200">
            <h2 className="text-3xl font-black text-yellow-900 mb-6 flex items-center gap-3">
              <span className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-lg">
                📝
              </span>
              Notes & commentaires
            </h2>
            <div className="bg-white rounded-2xl p-6 border-2 border-yellow-300">
              <p className="whitespace-pre-wrap text-gray-800">{vin.commentaire_general}</p>
            </div>
          </div>
        )}

        {/* SECTION 6 : Liste des bouteilles - ROSE */}
        <div className="bg-gradient-to-br from-white to-pink-50 rounded-3xl shadow-2xl p-8 border-4 border-pink-200">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-black text-pink-900 flex items-center gap-3">
              <span className="bg-gradient-to-br from-pink-500 to-pink-700 text-white w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-lg">
                🍾
              </span>
              Liste des bouteilles ({bouteilles.length})
            </h2>
            <Link
              href={`/vins/${id}/bouteilles/nouvelle`}
              className="bg-gradient-to-r from-pink-600 to-pink-700 text-white px-8 py-4 rounded-2xl font-black hover:shadow-2xl hover:scale-105 transition-all"
            >
              + Ajouter bouteille
            </Link>
          </div>

          {bouteilles.length === 0 ? (
            <div className="text-center py-12 text-gray-500 text-lg">
              Aucune bouteille. Ajoutez-en une !
            </div>
          ) : (
            <div className="space-y-3">
              {bouteilles.map((bouteille) => (
                <Link
                  key={bouteille.id}
                  href={`/bouteilles/${bouteille.id}`}
                  className="block bg-white rounded-2xl p-6 hover:shadow-xl transition border-2 border-pink-200 hover:border-pink-400"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="bg-pink-100 text-pink-900 px-4 py-2 rounded-xl font-black">
                        #{bouteille.numero_bouteille}
                      </div>
                      <div>
                        <div className="font-bold text-gray-800">
                          État: <span className="text-green-600">{bouteille.etat_qualitatif || 'Non renseigné'}</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          Niveau: {bouteille.niveau_remplissage || 'Non renseigné'}
                        </div>
                      </div>
                    </div>
                    <div className="text-pink-600 font-black text-xl">→</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Boutons actions */}
        <div className="flex gap-4">
          <Link
            href={`/vins/${id}/modifier`}
            className="flex-1 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 text-white py-6 rounded-2xl font-black hover:shadow-2xl hover:scale-105 transition-all text-center text-xl border-4 border-white shadow-xl"
          >
            ✏️ Modifier ce vin
          </Link>
          <button
            onClick={deleteVin}
            className="px-10 py-6 bg-white border-4 border-red-300 text-red-600 rounded-2xl font-black hover:bg-red-50 hover:scale-105 transition-all shadow-lg"
          >
            🗑️ Supprimer
          </button>
        </div>
      </div>
    </div>
  )
}
