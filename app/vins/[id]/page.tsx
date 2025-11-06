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
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState<number | null>(null)

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
        
        {/* SECTION 1 : Informations */}
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
          </div>
        </div>

        {/* SECTION 2 : États qualitatifs */}
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
              <div className="text-xs font-bold text-gray-600 mt-2">Excellent</div>
            </div>
            <div className="bg-white rounded-2xl p-6 text-center border-2 border-gray-200">
              <div className="text-4xl font-black text-blue-600">{stats.bon}</div>
              <div className="text-xs font-bold text-gray-600 mt-2">Bon</div>
            </div>
            <div className="bg-white rounded-2xl p-6 text-center border-2 border-gray-200">
              <div className="text-4xl font-black text-yellow-600">{stats.correct}</div>
              <div className="text-xs font-bold text-gray-600 mt-2">Correct</div>
            </div>
            <div className="bg-white rounded-2xl p-6 text-center border-2 border-gray-200">
              <div className="text-4xl font-black text-orange-600">{stats.moyen}</div>
              <div className="text-xs font-bold text-gray-600 mt-2">Moyen</div>
            </div>
            <div className="bg-white rounded-2xl p-6 text-center border-2 border-gray-200">
              <div className="text-4xl font-black text-red-600">{stats.mauvais}</div>
              <div className="text-xs font-bold text-gray-600 mt-2">Mauvais</div>
            </div>
            <div className="bg-white rounded-2xl p-6 text-center border-2 border-gray-200">
              <div className="text-4xl font-black text-purple-600">{stats.difficulte}</div>
              <div className="text-xs font-bold text-gray-600 mt-2">Difficulté</div>
            </div>
          </div>
        </div>

        {/* SECTION 3 : Niveaux */}
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
              <div className="text-xs font-bold text-gray-600 mt-2">Plein</div>
            </div>
            <div className="bg-white rounded-2xl p-6 text-center border-2 border-gray-200">
              <div className="text-4xl font-black text-green-500">{niveaux.haut_epaule}</div>
              <div className="text-xs font-bold text-gray-600 mt-2">Haut épaule</div>
            </div>
            <div className="bg-white rounded-2xl p-6 text-center border-2 border-gray-200">
              <div className="text-4xl font-black text-yellow-500">{niveaux.mi_epaule}</div>
              <div className="text-xs font-bold text-gray-600 mt-2">Mi-épaule</div>
            </div>
            <div className="bg-white rounded-2xl p-6 text-center border-2 border-gray-200">
              <div className="text-4xl font-black text-orange-500">{niveaux.bas_epaule}</div>
              <div className="text-xs font-bold text-gray-600 mt-2">Bas épaule</div>
            </div>
            <div className="bg-white rounded-2xl p-6 text-center border-2 border-gray-200">
              <div className="text-4xl font-black text-red-500">{niveaux.haut_goulot}</div>
              <div className="text-xs font-bold text-gray-600 mt-2">Haut goulot</div>
            </div>
            <div className="bg-white rounded-2xl p-6 text-center border-2 border-gray-200">
              <div className="text-4xl font-black text-red-700">{niveaux.mi_goulot}</div>
              <div className="text-xs font-bold text-gray-600 mt-2">Mi-goulot</div>
            </div>
          </div>
        </div>

        {/* SECTION 4 : GALERIE SIMPLE */}
        {photos.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              📷 Photos ({photos.length})
            </h3>
            
            {/* Grille de miniatures */}
            <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
              {photos.map((photo, index) => (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => setCurrentPhotoIndex(index)}
                  className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-orange-400 transition group"
                >
                  <img
                    src={photo.url}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {/* Overlay au survol */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center">
                    <span className="text-white opacity-0 group-hover:opacity-100 text-2xl">🔍</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Modal simple (affichage grande image) */}
            {currentPhotoIndex !== null && (
              <div 
                className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
                onClick={() => setCurrentPhotoIndex(null)}
              >
                <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-xl overflow-hidden shadow-2xl">
                  <img
                    src={photos[currentPhotoIndex]?.url}
                    alt="Photo agrandie"
                    className="w-full h-full object-contain"
                    onClick={(e) => e.stopPropagation()}
                  />
                  {photos[currentPhotoIndex]?.commentaire && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-4">
                      <p className="text-sm">💬 {photos[currentPhotoIndex].commentaire}</p>
                    </div>
                  )}
                  <button
                    onClick={() => setCurrentPhotoIndex(null)}
                    className="absolute top-4 right-4 bg-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg hover:bg-gray-100 transition"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SECTION 5 : Commentaire */}
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

        {/* SECTION 6 : Graphiques en camembert */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            📊 Répartition des {stats.total} bouteilles
          </h2>

          {stats.total === 0 ? (
            <div className="text-center py-12 text-gray-400 text-lg">
              Aucune bouteille dans cet inventaire
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* États qualitatifs - Camembert */}
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b-2 border-gray-200">
                  États qualitatifs
                </h3>
                <div className="flex flex-col items-center">
                  <svg width="300" height="300" viewBox="0 0 300 300">
                    {(() => {
                      const centerX = 150
                      const centerY = 150
                      const radius = 120
                      let currentAngle = -90

                      const categories = [
                        { value: stats.excellent, color: '#16a34a', label: 'Excellent' },
                        { value: stats.bon, color: '#3b82f6', label: 'Bon' },
                        { value: stats.correct, color: '#eab308', label: 'Correct' },
                        { value: stats.moyen, color: '#f97316', label: 'Moyen' },
                        { value: stats.mauvais, color: '#dc2626', label: 'Mauvais' },
                        { value: stats.difficulte, color: '#9333ea', label: 'Difficulté' }
                      ].filter(cat => cat.value > 0)

                      // Si une seule catégorie à 100%, dessiner un cercle complet
                      if (categories.length === 1) {
                        return (
                          <circle
                            cx={centerX}
                            cy={centerY}
                            r={radius}
                            fill={categories[0].color}
                            stroke="#ffffff"
                            strokeWidth="2"
                          />
                        )
                      }

                      return categories.map((cat, index) => {
                        const percentage = (cat.value / stats.total) * 100
                        const angle = (percentage / 100) * 360
                        const startAngle = currentAngle
                        const endAngle = currentAngle + angle

                        const startRad = (startAngle * Math.PI) / 180
                        const endRad = (endAngle * Math.PI) / 180

                        const x1 = centerX + radius * Math.cos(startRad)
                        const y1 = centerY + radius * Math.sin(startRad)
                        const x2 = centerX + radius * Math.cos(endRad)
                        const y2 = centerY + radius * Math.sin(endRad)

                        const largeArc = angle > 180 ? 1 : 0

                        const pathData = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`

                        currentAngle += angle

                        return (
                          <path
                            key={index}
                            d={pathData}
                            fill={cat.color}
                            stroke="#ffffff"
                            strokeWidth="2"
                          />
                        )
                      })
                    })()}
                  </svg>

                  <div className="mt-4 w-full space-y-2">
                    {stats.excellent > 0 && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div style={{ width: '16px', height: '16px', backgroundColor: '#16a34a', borderRadius: '3px' }}></div>
                          <span className="text-sm" style={{ color: '#374151' }}>Excellent</span>
                        </div>
                        <span className="text-sm font-bold" style={{ color: '#16a34a' }}>
                          {stats.excellent} ({Math.round((stats.excellent / stats.total) * 100)}%)
                        </span>
                      </div>
                    )}
                    {stats.bon > 0 && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div style={{ width: '16px', height: '16px', backgroundColor: '#3b82f6', borderRadius: '3px' }}></div>
                          <span className="text-sm" style={{ color: '#374151' }}>Bon</span>
                        </div>
                        <span className="text-sm font-bold" style={{ color: '#2563eb' }}>
                          {stats.bon} ({Math.round((stats.bon / stats.total) * 100)}%)
                        </span>
                      </div>
                    )}
                    {stats.correct > 0 && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div style={{ width: '16px', height: '16px', backgroundColor: '#eab308', borderRadius: '3px' }}></div>
                          <span className="text-sm" style={{ color: '#374151' }}>Correct</span>
                        </div>
                        <span className="text-sm font-bold" style={{ color: '#ca8a04' }}>
                          {stats.correct} ({Math.round((stats.correct / stats.total) * 100)}%)
                        </span>
                      </div>
                    )}
                    {stats.moyen > 0 && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div style={{ width: '16px', height: '16px', backgroundColor: '#f97316', borderRadius: '3px' }}></div>
                          <span className="text-sm" style={{ color: '#374151' }}>Moyen</span>
                        </div>
                        <span className="text-sm font-bold" style={{ color: '#ea580c' }}>
                          {stats.moyen} ({Math.round((stats.moyen / stats.total) * 100)}%)
                        </span>
                      </div>
                    )}
                    {stats.mauvais > 0 && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div style={{ width: '16px', height: '16px', backgroundColor: '#dc2626', borderRadius: '3px' }}></div>
                          <span className="text-sm" style={{ color: '#374151' }}>Mauvais</span>
                        </div>
                        <span className="text-sm font-bold" style={{ color: '#dc2626' }}>
                          {stats.mauvais} ({Math.round((stats.mauvais / stats.total) * 100)}%)
                        </span>
                      </div>
                    )}
                    {stats.difficulte > 0 && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div style={{ width: '16px', height: '16px', backgroundColor: '#9333ea', borderRadius: '3px' }}></div>
                          <span className="text-sm" style={{ color: '#374151' }}>Difficulté</span>
                        </div>
                        <span className="text-sm font-bold" style={{ color: '#9333ea' }}>
                          {stats.difficulte} ({Math.round((stats.difficulte / stats.total) * 100)}%)
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Niveaux de remplissage - Camembert */}
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b-2 border-gray-200">
                  Niveaux de remplissage
                </h3>
                <div className="flex flex-col items-center">
                  <svg width="300" height="300" viewBox="0 0 300 300">
                    {(() => {
                      const centerX = 150
                      const centerY = 150
                      const radius = 120
                      let currentAngle = -90

                      const categories = [
                        { value: niveaux.plein, color: '#16a34a', label: 'Plein' },
                        { value: niveaux.haut_epaule, color: '#22c55e', label: 'Haut épaule' },
                        { value: niveaux.mi_epaule, color: '#eab308', label: 'Mi-épaule' },
                        { value: niveaux.bas_epaule, color: '#f97316', label: 'Bas épaule' },
                        { value: niveaux.haut_goulot, color: '#ef4444', label: 'Haut goulot' },
                        { value: niveaux.mi_goulot, color: '#dc2626', label: 'Mi-goulot' }
                      ].filter(cat => cat.value > 0)

                      // Si une seule catégorie à 100%, dessiner un cercle complet
                      if (categories.length === 1) {
                        return (
                          <circle
                            cx={centerX}
                            cy={centerY}
                            r={radius}
                            fill={categories[0].color}
                            stroke="#ffffff"
                            strokeWidth="2"
                          />
                        )
                      }

                      return categories.map((cat, index) => {
                        const percentage = (cat.value / stats.total) * 100
                        const angle = (percentage / 100) * 360
                        const startAngle = currentAngle
                        const endAngle = currentAngle + angle

                        const startRad = (startAngle * Math.PI) / 180
                        const endRad = (endAngle * Math.PI) / 180

                        const x1 = centerX + radius * Math.cos(startRad)
                        const y1 = centerY + radius * Math.sin(startRad)
                        const x2 = centerX + radius * Math.cos(endRad)
                        const y2 = centerY + radius * Math.sin(endRad)

                        const largeArc = angle > 180 ? 1 : 0

                        const pathData = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`

                        currentAngle += angle

                        return (
                          <path
                            key={index}
                            d={pathData}
                            fill={cat.color}
                            stroke="#ffffff"
                            strokeWidth="2"
                          />
                        )
                      })
                    })()}
                  </svg>

                  <div className="mt-4 w-full space-y-2">
                    {niveaux.plein > 0 && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div style={{ width: '16px', height: '16px', backgroundColor: '#16a34a', borderRadius: '3px' }}></div>
                          <span className="text-sm" style={{ color: '#374151' }}>Plein</span>
                        </div>
                        <span className="text-sm font-bold" style={{ color: '#16a34a' }}>
                          {niveaux.plein} ({Math.round((niveaux.plein / stats.total) * 100)}%)
                        </span>
                      </div>
                    )}
                    {niveaux.haut_epaule > 0 && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div style={{ width: '16px', height: '16px', backgroundColor: '#22c55e', borderRadius: '3px' }}></div>
                          <span className="text-sm" style={{ color: '#374151' }}>Haut épaule</span>
                        </div>
                        <span className="text-sm font-bold" style={{ color: '#22c55e' }}>
                          {niveaux.haut_epaule} ({Math.round((niveaux.haut_epaule / stats.total) * 100)}%)
                        </span>
                      </div>
                    )}
                    {niveaux.mi_epaule > 0 && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div style={{ width: '16px', height: '16px', backgroundColor: '#eab308', borderRadius: '3px' }}></div>
                          <span className="text-sm" style={{ color: '#374151' }}>Mi-épaule</span>
                        </div>
                        <span className="text-sm font-bold" style={{ color: '#eab308' }}>
                          {niveaux.mi_epaule} ({Math.round((niveaux.mi_epaule / stats.total) * 100)}%)
                        </span>
                      </div>
                    )}
                    {niveaux.bas_epaule > 0 && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div style={{ width: '16px', height: '16px', backgroundColor: '#f97316', borderRadius: '3px' }}></div>
                          <span className="text-sm" style={{ color: '#374151' }}>Bas épaule</span>
                        </div>
                        <span className="text-sm font-bold" style={{ color: '#f97316' }}>
                          {niveaux.bas_epaule} ({Math.round((niveaux.bas_epaule / stats.total) * 100)}%)
                        </span>
                      </div>
                    )}
                    {niveaux.haut_goulot > 0 && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div style={{ width: '16px', height: '16px', backgroundColor: '#ef4444', borderRadius: '3px' }}></div>
                          <span className="text-sm" style={{ color: '#374151' }}>Haut goulot</span>
                        </div>
                        <span className="text-sm font-bold" style={{ color: '#ef4444' }}>
                          {niveaux.haut_goulot} ({Math.round((niveaux.haut_goulot / stats.total) * 100)}%)
                        </span>
                      </div>
                    )}
                    {niveaux.mi_goulot > 0 && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div style={{ width: '16px', height: '16px', backgroundColor: '#dc2626', borderRadius: '3px' }}></div>
                          <span className="text-sm" style={{ color: '#374151' }}>Mi-goulot</span>
                        </div>
                        <span className="text-sm font-bold" style={{ color: '#dc2626' }}>
                          {niveaux.mi_goulot} ({Math.round((niveaux.mi_goulot / stats.total) * 100)}%)
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bouton ajouter */}
          <div className="mt-8 pt-6 border-t-2 border-gray-200 text-center">
            <Link
              href={`/vins/${id}/bouteilles/nouvelle`}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-xl font-bold hover:shadow-lg hover:scale-105 transition-all"
            >
              + Ajouter une bouteille
            </Link>
          </div>
        </div>

        {/* Boutons actions */}
        <div className="flex gap-4">
          <Link
            href={`/vins/${id}/modifier`}
            className="flex-1 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 text-white py-6 rounded-2xl font-black hover:shadow-2xl hover:scale-105 transition-all text-center text-xl border-4 border-white shadow-xl"
          >
            ✏️ Modifier
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
