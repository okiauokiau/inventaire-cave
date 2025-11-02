'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Vin, Photo, Bouteille, ETATS_QUALITATIFS, NIVEAUX_REMPLISSAGE } from '@/types'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

export default function VinDetail() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [vin, setVin] = useState<Vin | null>(null)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [bouteilles, setBouteilles] = useState<Bouteille[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)

  useEffect(() => {
    if (id) fetchData()
  }, [id])

  async function fetchData() {
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

      setBouteilles(bouteillesData || [])
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteVin() {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce vin et toutes ses bouteilles ?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('vins')
        .delete()
        .eq('id', id)

      if (error) throw error

      alert('Vin supprimé avec succès')
      router.push('/')
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la suppression')
    }
  }

  async function handleDeleteBouteille(bouteilleId: string) {
    if (!confirm('Supprimer cette bouteille ?')) return

    try {
      const { error } = await supabase
        .from('bouteilles')
        .delete()
        .eq('id', bouteilleId)

      if (error) throw error

      setBouteilles(prev => prev.filter(b => b.id !== bouteilleId))
      alert('Bouteille supprimée')
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la suppression')
    }
  }

  // Compteurs états qualitatifs
  const statsEtats = ETATS_QUALITATIFS.map(etat => ({
    ...etat,
    count: bouteilles.filter(b => b.etat_qualitatif === etat.value).length
  }))

  // Compteurs niveaux
  const statsNiveaux = NIVEAUX_REMPLISSAGE.map(niveau => ({
    ...niveau,
    count: bouteilles.filter(b => b.niveau_remplissage === niveau.value).length
  }))

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Chargement...</div>
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-red-900 text-white py-6 px-8 shadow-md">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">{vin.nom}</h1>
            {vin.millesime && (
              <p className="text-xl opacity-90 mt-1">{vin.millesime}</p>
            )}
          </div>
          <div className="flex gap-4">
            <Link 
              href={`/vins/${id}/modifier`}
              className="bg-white text-red-900 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition"
            >
              ✏️ Modifier
            </Link>
            <button
              onClick={handleDeleteVin}
              className="bg-red-700 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-600 transition"
            >
              🗑️ Supprimer
            </button>
            <Link 
              href="/"
              className="text-white hover:underline px-4 py-2"
            >
              ← Retour
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-8">
        {/* SECTION 1: Informations du vin */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-red-900 mb-6 flex items-center gap-2">
            🍷 Informations du vin
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {vin.producteur && (
              <div>
                <div className="text-xs text-gray-500 uppercase mb-1">Producteur</div>
                <div className="font-medium">{vin.producteur}</div>
              </div>
            )}
            {vin.appellation && (
              <div>
                <div className="text-xs text-gray-500 uppercase mb-1">Appellation</div>
                <div className="font-medium">{vin.appellation}</div>
              </div>
            )}
            {vin.region && (
              <div>
                <div className="text-xs text-gray-500 uppercase mb-1">Région</div>
                <div className="font-medium">{vin.region}</div>
              </div>
            )}
            {vin.pays && (
              <div>
                <div className="text-xs text-gray-500 uppercase mb-1">Pays</div>
                <div className="font-medium">{vin.pays}</div>
              </div>
            )}
            {vin.couleur && (
              <div>
                <div className="text-xs text-gray-500 uppercase mb-1">Couleur</div>
                <div className="font-medium">{vin.couleur}</div>
              </div>
            )}
            {vin.cepage && (
              <div>
                <div className="text-xs text-gray-500 uppercase mb-1">Cépage</div>
                <div className="font-medium">{vin.cepage}</div>
              </div>
            )}
            {vin.volume_bouteille && (
              <div>
                <div className="text-xs text-gray-500 uppercase mb-1">Volume</div>
                <div className="font-medium">{vin.volume_bouteille}</div>
              </div>
            )}
            {vin.degre_alcool && (
              <div>
                <div className="text-xs text-gray-500 uppercase mb-1">Degré alcool</div>
                <div className="font-medium">{vin.degre_alcool}%</div>
              </div>
            )}
            {vin.prix_achat_unitaire && (
              <div>
                <div className="text-xs text-gray-500 uppercase mb-1">Prix d'achat</div>
                <div className="font-medium">{vin.prix_achat_unitaire} €</div>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 2: Carrousel photos */}
        {photos.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-red-900 mb-6 flex items-center gap-2">
              📸 Photos
            </h2>
            
            <div className="relative max-w-2xl mx-auto">
              {/* Image principale */}
              <div className="relative h-96 bg-gray-100 rounded-lg flex items-center justify-center">
                <img 
                  src={photos[currentPhotoIndex].url} 
                  alt={`Photo ${currentPhotoIndex + 1}`}
                  className="max-h-full max-w-full object-contain"
                />
                
                {/* Navigation */}
                {photos.length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentPhotoIndex(prev => (prev - 1 + photos.length) % photos.length)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
                    >
                      ‹
                    </button>
                    <button
                      onClick={() => setCurrentPhotoIndex(prev => (prev + 1) % photos.length)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
                    >
                      ›
                    </button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-1 rounded-full text-sm">
                      {currentPhotoIndex + 1} / {photos.length}
                    </div>
                  </>
                )}
              </div>

              {/* Commentaire */}
              {photos[currentPhotoIndex].commentaire && (
                <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                  <div className="text-xs text-gray-500 uppercase mb-1">Commentaire</div>
                  <div className="text-sm italic">{photos[currentPhotoIndex].commentaire}</div>
                </div>
              )}

              {/* Miniatures */}
              {photos.length > 1 && (
                <div className="flex gap-2 mt-4 justify-center overflow-x-auto pb-2">
                  {photos.map((photo, index) => (
                    <img
                      key={photo.id}
                      src={photo.url}
                      alt={`Miniature ${index + 1}`}
                      onClick={() => setCurrentPhotoIndex(index)}
                      className={`w-20 h-20 object-cover rounded cursor-pointer border-2 transition ${
                        index === currentPhotoIndex ? 'border-red-900' : 'border-gray-200 hover:border-red-900'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* SECTION 3: États qualitatifs */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-red-900 mb-6 flex items-center gap-2">
            📊 Inventaire par état qualitatif
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-red-900">
              <div className="text-3xl font-bold text-red-900">{bouteilles.length}</div>
              <div className="text-sm text-gray-600 mt-1">TOTAL</div>
            </div>
            {statsEtats.map(stat => (
              <div key={stat.value} className="bg-gray-50 p-4 rounded-lg border-l-4 border-gray-300">
                <div className="text-3xl font-bold text-red-900">{stat.count}</div>
                <div className="text-xs text-gray-600 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 4: Niveaux de remplissage */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-red-900 mb-6 flex items-center gap-2">
            🍾 Niveaux de remplissage
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {statsNiveaux.map(stat => (
              <div key={stat.value} className="bg-gray-50 p-4 rounded-lg border-l-4 border-gray-300">
                <div className="text-3xl font-bold text-red-900">{stat.count}</div>
                <div className="text-xs text-gray-600 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 5: Liste des bouteilles */}
        {bouteilles.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-red-900 mb-6 flex items-center gap-2">
              📋 Liste des bouteilles ({bouteilles.length})
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Code</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Emplacement</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">État</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Niveau</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {bouteilles.map(bouteille => (
                    <tr key={bouteille.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium">{bouteille.code_unique}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{bouteille.emplacement_cave || '-'}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                          {ETATS_QUALITATIFS.find(e => e.value === bouteille.etat_qualitatif)?.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {NIVEAUX_REMPLISSAGE.find(n => n.value === bouteille.niveau_remplissage)?.label}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDeleteBouteille(bouteille.id)}
                          className="text-red-600 hover:text-red-800 text-sm font-semibold"
                        >
                          🗑️ Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SECTION 6: Commentaire général */}
        {vin.commentaire_general && (
          <div className="bg-yellow-50 rounded-lg shadow-lg p-6 mb-8 border-l-4 border-yellow-500">
            <h2 className="text-2xl font-bold text-yellow-800 mb-4 flex items-center gap-2">
              📝 Commentaire général
            </h2>
            <div className="text-gray-800 whitespace-pre-wrap">{vin.commentaire_general}</div>
          </div>
        )}

        {/* Bouton ajouter bouteilles */}
        <div className="mt-8">
          <Link
            href={`/vins/${id}/bouteilles/nouvelle`}
            className="inline-block bg-red-900 text-white px-8 py-4 rounded-lg font-semibold hover:bg-red-800 transition"
          >
            + Ajouter des bouteilles
          </Link>
        </div>
      </div>
    </div>
  )
}
