'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { ProtectedRoute } from '@/components/protected-route'
import { Navbar } from '@/components/navbar'

type Profile = {
  id: string
  email: string
  full_name: string | null
  role: 'admin' | 'moderator' | 'standard'
  created_at: string
  updated_at: string
}

type SalesChannel = {
  id: string
  name: string
}

type UserChannel = {
  id: string
  user_id: string
  channel_id: string
  assigned_at: string
}

export default function ComptesPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <ComptesContent />
    </ProtectedRoute>
  )
}

function ComptesContent() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [channels, setChannels] = useState<SalesChannel[]>([])
  const [userChannels, setUserChannels] = useState<UserChannel[]>([])
  const [loading, setLoading] = useState(true)
  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [editingRole, setEditingRole] = useState<'admin' | 'moderator' | 'standard'>('standard')
  const [editingChannels, setEditingChannels] = useState<string[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      // Charger les profils
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (profilesError) throw profilesError
      setProfiles(profilesData || [])

      // Charger les canaux
      const { data: channelsData, error: channelsError } = await supabase
        .from('sales_channels')
        .select('*')
        .order('name')

      if (channelsError) throw channelsError
      setChannels(channelsData || [])

      // Charger les assignations utilisateur-canal
      const { data: userChannelsData, error: userChannelsError } = await supabase
        .from('user_channels')
        .select('*')

      if (userChannelsError) throw userChannelsError
      setUserChannels(userChannelsData || [])
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEditUser = (user: Profile) => {
    setEditingUser(user.id)
    setEditingRole(user.role)
    const userChannelIds = userChannels
      .filter(uc => uc.user_id === user.id)
      .map(uc => uc.channel_id)
    setEditingChannels(userChannelIds)
  }

  const handleSaveUser = async (userId: string) => {
    try {
      // Mettre à jour le rôle
      const { error: roleError } = await supabase
        .from('profiles')
        .update({ role: editingRole })
        .eq('id', userId)

      if (roleError) throw roleError

      // Supprimer les anciennes assignations
      const { error: deleteError } = await supabase
        .from('user_channels')
        .delete()
        .eq('user_id', userId)

      if (deleteError) throw deleteError

      // Créer les nouvelles assignations
      if (editingChannels.length > 0) {
        const { error: insertError } = await supabase
          .from('user_channels')
          .insert(
            editingChannels.map(channelId => ({
              user_id: userId,
              channel_id: channelId
            }))
          )

        if (insertError) throw insertError
      }

      await fetchData()
      setEditingUser(null)
      alert('Utilisateur mis à jour avec succès')
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la mise à jour')
    }
  }

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ${email} ?`)) return

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)

      if (error) throw error

      await fetchData()
      alert('Utilisateur supprimé avec succès')
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la suppression')
    }
  }

  const toggleChannel = (channelId: string) => {
    if (editingChannels.includes(channelId)) {
      setEditingChannels(editingChannels.filter(id => id !== channelId))
    } else {
      setEditingChannels([...editingChannels, channelId])
    }
  }

  const getRoleColor = (role: string) => {
    const colors = {
      admin: '#dc2626',
      moderator: '#2563eb',
      standard: '#16a34a'
    }
    return colors[role as keyof typeof colors] || '#6b7280'
  }

  const getRoleLabel = (role: string) => {
    const labels = {
      admin: 'Admin',
      moderator: 'Modérateur',
      standard: 'Standard'
    }
    return labels[role as keyof typeof labels] || role
  }

  const getUserChannels = (userId: string) => {
    return userChannels
      .filter(uc => uc.user_id === userId)
      .map(uc => channels.find(c => c.id === uc.channel_id)?.name)
      .filter(Boolean)
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-xl">Chargement...</div>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-red-900 text-white py-6 px-8 shadow-md">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold">👥 Gestion des Comptes</h1>
            <p className="text-red-100 mt-2">Administration des utilisateurs et de leurs permissions</p>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto p-8">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Total utilisateurs</h3>
              <p className="text-3xl font-bold text-gray-900">{profiles.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Administrateurs</h3>
              <p className="text-3xl font-bold text-red-600">{profiles.filter(p => p.role === 'admin').length}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Modérateurs</h3>
              <p className="text-3xl font-bold text-blue-600">{profiles.filter(p => p.role === 'moderator').length}</p>
            </div>
          </div>

          {/* Liste des utilisateurs */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rôle</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Canaux</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Inscrit le</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {profiles.map(profile => (
                  <tr key={profile.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{profile.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">{profile.full_name || '-'}</div>
                    </td>
                    <td className="px-6 py-4">
                      {editingUser === profile.id ? (
                        <select
                          value={editingRole}
                          onChange={(e) => setEditingRole(e.target.value as any)}
                          className="px-3 py-1 border rounded text-sm"
                        >
                          <option value="standard">Standard</option>
                          <option value="moderator">Modérateur</option>
                          <option value="admin">Admin</option>
                        </select>
                      ) : (
                        <span
                          className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                          style={{ backgroundColor: getRoleColor(profile.role) }}
                        >
                          {getRoleLabel(profile.role)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingUser === profile.id ? (
                        <div className="space-y-1">
                          {channels.map(channel => (
                            <label key={channel.id} className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={editingChannels.includes(channel.id)}
                                onChange={() => toggleChannel(channel.id)}
                                className="rounded"
                              />
                              {channel.name}
                            </label>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">
                          {getUserChannels(profile.id).length > 0 ? (
                            getUserChannels(profile.id).join(', ')
                          ) : (
                            <span className="text-gray-400">Aucun</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">
                        {new Date(profile.created_at).toLocaleDateString('fr-FR')}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {editingUser === profile.id ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleSaveUser(profile.id)}
                            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                          >
                            ✓ Sauver
                          </button>
                          <button
                            onClick={() => setEditingUser(null)}
                            className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
                          >
                            ✕ Annuler
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEditUser(profile)}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                          >
                            ✏️ Modifier
                          </button>
                          <button
                            onClick={() => handleDeleteUser(profile.id, profile.email)}
                            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                          >
                            🗑️ Supprimer
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}
