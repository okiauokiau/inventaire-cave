'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'

export default function DebugArticlesPage() {
  const { profile } = useAuth()
  const [articles, setArticles] = useState<any[]>([])
  const [articleChannels, setArticleChannels] = useState<any[]>([])
  const [userChannels, setUserChannels] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [fixing, setFixing] = useState(false)
  const [fixResult, setFixResult] = useState<any>(null)

  useEffect(() => {
    async function fetchDebugData() {
      if (!profile?.id) return

      // Récupérer les canaux de l'utilisateur
      const { data: userChannelsData } = await supabase
        .from('user_channels')
        .select(`
          channel_id,
          sales_channels (
            id,
            name
          )
        `)
        .eq('user_id', profile.id)

      setUserChannels(userChannelsData || [])

      // Récupérer tous les articles
      const { data: articlesData } = await supabase
        .from('standard_articles')
        .select('id, nom, status, channel_id')

      setArticles(articlesData || [])

      // Récupérer toutes les relations article_channels
      const { data: articleChannelsData } = await supabase
        .from('article_channels')
        .select(`
          article_id,
          channel_id,
          sales_channels (name)
        `)

      setArticleChannels(articleChannelsData || [])
      setLoading(false)
    }

    fetchDebugData()
  }, [profile])

  async function fixArticles() {
    setFixing(true)
    setFixResult(null)
    try {
      const response = await fetch('/api/fix-articles', {
        method: 'POST'
      })
      const result = await response.json()
      setFixResult(result)

      if (result.success) {
        // Rafraîchir les données
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      }
    } catch (error) {
      setFixResult({ success: false, error: 'Erreur lors de la requête' })
    } finally {
      setFixing(false)
    }
  }

  if (loading) return <div className="p-8">Chargement...</div>

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Debug Articles & Canaux</h1>
        <button
          onClick={fixArticles}
          disabled={fixing}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {fixing ? 'Correction en cours...' : '🔧 Nettoyer et recréer les articles'}
        </button>
      </div>

      {/* Résultat de la correction */}
      {fixResult && (
        <div className={`mb-6 p-4 rounded ${fixResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {fixResult.success ? (
            <div>
              <p className="font-bold">✅ Correction réussie !</p>
              <p>Articles créés: {fixResult.articles?.length || 0}</p>
              <p>Relations orphelines supprimées: {fixResult.orphanedRelationsDeleted || 0}</p>
              <p className="text-sm mt-2">La page va se recharger dans 2 secondes...</p>
            </div>
          ) : (
            <div>
              <p className="font-bold">❌ Erreur</p>
              <p>{fixResult.error}</p>
            </div>
          )}
        </div>
      )}

      {/* Infos utilisateur */}
      <div className="mb-8 bg-blue-50 p-4 rounded">
        <h2 className="text-xl font-bold mb-2">👤 Utilisateur actuel</h2>
        <p><strong>Email:</strong> {profile?.email}</p>
        <p><strong>Role:</strong> {profile?.role}</p>
        <p><strong>ID:</strong> <span className="font-mono text-xs">{profile?.id}</span></p>
      </div>

      {/* Canaux de l'utilisateur */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">🔗 Canaux de l'utilisateur ({userChannels.length})</h2>
        <div className="bg-white rounded shadow overflow-auto max-h-96">
          <table className="w-full text-sm">
            <thead className="bg-gray-200">
              <tr>
                <th className="p-2 text-left">Channel ID</th>
                <th className="p-2 text-left">Nom du canal</th>
              </tr>
            </thead>
            <tbody>
              {userChannels.map((uc, idx) => (
                <tr key={idx} className="border-t">
                  <td className="p-2 font-mono text-xs">{uc.channel_id}</td>
                  <td className="p-2">{uc.sales_channels?.name || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Articles */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">📦 Articles standards ({articles.length})</h2>
        <div className="bg-white rounded shadow overflow-auto max-h-96">
          <table className="w-full text-sm">
            <thead className="bg-gray-200">
              <tr>
                <th className="p-2 text-left">ID</th>
                <th className="p-2 text-left">Nom</th>
                <th className="p-2 text-left">Status</th>
                <th className="p-2 text-left">channel_id (ancien)</th>
              </tr>
            </thead>
            <tbody>
              {articles.map(article => (
                <tr key={article.id} className="border-t">
                  <td className="p-2 font-mono text-xs">{article.id.substring(0, 8)}...</td>
                  <td className="p-2">{article.nom}</td>
                  <td className="p-2">{article.status || 'N/A'}</td>
                  <td className="p-2 font-mono text-xs">{article.channel_id ? article.channel_id.substring(0, 8) + '...' : 'NULL'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Relations article_channels */}
      <div>
        <h2 className="text-xl font-bold mb-4">🔗 Relations article_channels ({articleChannels.length})</h2>
        <div className="bg-white rounded shadow overflow-auto max-h-96">
          <table className="w-full text-sm">
            <thead className="bg-gray-200">
              <tr>
                <th className="p-2 text-left">Article ID</th>
                <th className="p-2 text-left">Channel ID</th>
                <th className="p-2 text-left">Nom du canal</th>
              </tr>
            </thead>
            <tbody>
              {articleChannels.map((ac, idx) => (
                <tr key={idx} className="border-t">
                  <td className="p-2 font-mono text-xs">{ac.article_id.substring(0, 8)}...</td>
                  <td className="p-2 font-mono text-xs">{ac.channel_id.substring(0, 8)}...</td>
                  <td className="p-2">{ac.sales_channels?.name || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
