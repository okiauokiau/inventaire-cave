'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Vin } from '@/types'
import Link from 'next/link'

export default function Home() {
  const [vins, setVins] = useState<Vin[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchVins()
  }, [])

  async function fetchVins() {
    try {
      const { data, error } = await supabase
        .from('vins')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setVins(data || [])
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredVins = vins.filter(vin => 
    vin.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vin.producteur?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vin.millesime?.toString().includes(searchTerm)
  )

  if (loading) {
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
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-bold">🍷 Inventaire Cave</h1>
          <Link 
            href="/vins/nouveau"
            className="bg-white text-red-900 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition"
          >
            + Nouveau vin
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-8">
        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="🔍 Rechercher un vin..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-900 focus:outline-none"
          />
        </div>

        {/* Stats */}
        <div className="mb-6 text-gray-600">
          {filteredVins.length} vin{filteredVins.length > 1 ? 's' : ''} trouvé{filteredVins.length > 1 ? 's' : ''}
        </div>

        {/* Liste des vins */}
        {filteredVins.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-xl text-gray-500 mb-4">Aucun vin trouvé</p>
            <Link 
              href="/vins/nouveau"
              className="text-red-900 hover:underline font-semibold"
            >
              Créer votre premier vin
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVins.map((vin) => (
              <Link 
                key={vin.id} 
                href={`/vins/${vin.id}`}
                className="bg-white rounded-lg shadow hover:shadow-xl transition-all p-6 border-2 border-transparent hover:border-red-900"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-bold text-gray-900">{vin.nom}</h3>
                  {vin.millesime && (
                    <span className="text-lg font-bold text-red-900">{vin.millesime}</span>
                  )}
                </div>
                
                {vin.producteur && (
                  <p className="text-gray-600 mb-2">{vin.producteur}</p>
                )}
                
                <div className="flex flex-wrap gap-2 mt-4">
                  {vin.couleur && (
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                      {vin.couleur}
                    </span>
                  )}
                  {vin.region && (
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                      {vin.region}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
