'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Vin, ETATS_QUALITATIFS, NIVEAUX_REMPLISSAGE } from '@/types'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NouvelleBouteille() {
  const params = useParams()
  const router = useRouter()
  const vinId = params.id as string

  const [vin, setVin] = useState<Vin | null>(null)
  const [loading, setLoading] = useState(false)
  const [quantity, setQuantity] = useState(1)

  const [formData, setFormData] = useState({
    code_unique_base: '',
    emplacement_cave: '',
    date_entree: new Date().toISOString().split('T')[0],
    etat_qualitatif: 'EXCELLENT',
    niveau_remplissage: 'PLEIN',
    commentaire: '',
  })

  useEffect(() => {
    fetchVin()
  }, [])

  async function fetchVin() {
    const { data } = await supabase
      .from('vins')
      .select('*')
      .eq('id', vinId)
      .single()
    
    setVin(data)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const bouteilles = []
      
      for (let i = 1; i <= quantity; i++) {
        const codeUnique = quantity === 1 
          ? formData.code_unique_base 
          : `${formData.code_unique_base}-${i.toString().padStart(3, '0')}`

        bouteilles.push({
          vin_id: vinId,
          code_unique: codeUnique,
          emplacement_cave: formData.emplacement_cave || null,
          date_entree: formData.date_entree || null,
          etat_qualitatif: formData.etat_qualitatif,
          niveau_remplissage: formData.niveau_remplissage,
          statut: 'DISPONIBLE',
          commentaire: formData.commentaire || null,
        })
      }

      const { error } = await supabase
        .from('bouteilles')
        .insert(bouteilles)

      if (error) throw error

      alert(`${quantity} bouteille(s) ajoutée(s) avec succès !`)
      router.push(`/vins/${vinId}`)
    } catch (error: any) {
      console.error('Erreur:', error)
      if (error.code === '23505') {
        alert('Erreur : Un code bouteille existe déjà. Utilisez un code unique.')
      } else {
        alert('Erreur lors de l\'ajout des bouteilles')
      }
    } finally {
      setLoading(false)
    }
  }

  if (!vin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-red-900 text-white py-6 px-8 shadow-md">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Ajouter des bouteilles</h1>
            <p className="text-lg opacity-90 mt-1">{vin.nom} {vin.millesime}</p>
          </div>
          <Link 
            href={`/vins/${vinId}`}
            className="text-white hover:underline"
          >
            ← Retour
          </Link>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto p-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8">
          
          {/* Quantité */}
          <div className="mb-8 bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
            <label className="block text-lg font-bold text-gray-900 mb-2">
              Nombre de bouteilles à créer
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value))}
              className="w-32 px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-red-900 focus:outline-none text-xl font-bold"
            />
            <p className="text-sm text-gray-600 mt-2">
              {quantity > 1 
                ? `Les codes seront automatiquement numérotés (ex: VIN-001, VIN-002, VIN-003...)` 
                : 'Une seule bouteille sera créée avec le code exact saisi'
              }
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Code unique */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Code unique {quantity > 1 ? '(base)' : ''} *
              </label>
              <input
                type="text"
                required
                value={formData.code_unique_base}
                onChange={(e) => setFormData({ ...formData, code_unique_base: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-red-900 focus:outline-none"
                placeholder={quantity > 1 ? "VIN-2024" : "VIN-2024-001"}
              />
            </div>

            {/* Emplacement */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Emplacement cave
              </label>
              <input
                type="text"
                value={formData.emplacement_cave}
                onChange={(e) => setFormData({ ...formData, emplacement_cave: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-red-900 focus:outline-none"
                placeholder="Étagère A, Rang 3"
              />
            </div>

            {/* Date d'entrée */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Date d'entrée
              </label>
              <input
                type="date"
                value={formData.date_entree}
                onChange={(e) => setFormData({ ...formData, date_entree: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-red-900 focus:outline-none"
              />
            </div>

            {/* État qualitatif */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                État qualitatif *
              </label>
              <select
                required
                value={formData.etat_qualitatif}
                onChange={(e) => setFormData({ ...formData, etat_qualitatif: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-red-900 focus:outline-none"
              >
                {ETATS_QUALITATIFS.map(etat => (
                  <option key={etat.value} value={etat.value}>
                    {etat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Niveau de remplissage */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Niveau de remplissage *
              </label>
              <select
                required
                value={formData.niveau_remplissage}
                onChange={(e) => setFormData({ ...formData, niveau_remplissage: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-red-900 focus:outline-none"
              >
                {NIVEAUX_REMPLISSAGE.map(niveau => (
                  <option key={niveau.value} value={niveau.value}>
                    {niveau.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Commentaire */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Commentaire
              </label>
              <textarea
                value={formData.commentaire}
                onChange={(e) => setFormData({ ...formData, commentaire: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-red-900 focus:outline-none"
                placeholder="Notes sur cette/ces bouteille(s)..."
              />
            </div>
          </div>

          {/* Récapitulatif */}
          <div className="mb-8 bg-gray-50 p-6 rounded-lg">
            <h3 className="font-bold text-lg mb-4">Récapitulatif</h3>
            <div className="space-y-2 text-sm">
              <div>✅ <strong>{quantity}</strong> bouteille(s) seront créées</div>
              <div>📍 État : <strong>{ETATS_QUALITATIFS.find(e => e.value === formData.etat_qualitatif)?.label}</strong></div>
              <div>🍾 Niveau : <strong>{NIVEAUX_REMPLISSAGE.find(n => n.value === formData.niveau_remplissage)?.label}</strong></div>
              {formData.emplacement_cave && (
                <div>📦 Emplacement : <strong>{formData.emplacement_cave}</strong></div>
              )}
            </div>
          </div>

          {/* Boutons */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-red-900 text-white py-3 rounded-lg font-semibold hover:bg-red-800 transition disabled:opacity-50"
            >
              {loading ? 'Ajout en cours...' : `Ajouter ${quantity} bouteille(s)`}
            </button>
            <Link
              href={`/vins/${vinId}`}
              className="px-6 py-3 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition text-center"
            >
              Annuler
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
