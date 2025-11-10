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
  const [editingEmail, setEditingEmail] = useState('')
  const [editingPassword, setEditingPassword] = useState('')
  const [editingFullName, setEditingFullName] = useState('')

  // États pour le formulaire de création
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'standard' as 'admin' | 'moderator' | 'standard',
    channelIds: [] as string[]
  })

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
    setEditingEmail(user.email)
    setEditingFullName(user.full_name || '')
    setEditingPassword('')
    const userChannelIds = userChannels
      .filter(uc => uc.user_id === user.id)
      .map(uc => uc.channel_id)
    setEditingChannels(userChannelIds)
  }

  async function handleSaveUser(userId: string) {
    try {
      // Appeler l'API route
      const response = await fetch('/api/admin/update-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          email: editingEmail,
          password: editingPassword || undefined,
          full_name: editingFullName,
          role: editingRole,
          channelIds: editingChannels
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la mise a jour du compte')
      }

      alert('Compte mis a jour avec succes !')
      setEditingUser(null)
      setEditingPassword('')
      fetchData()
    } catch (error: any) {
      console.error('Erreur:', error)
      alert(error.message || 'Erreur lors de la mise a jour du compte')
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

  async function handleConfirmEmail(userId: string) {
    if (!confirm('Confirmer l\'email de cet utilisateur ?')) {
      return
    }

    try {
      const response = await fetch('/api/admin/confirm-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la confirmation')
      }

      alert('Email confirme avec succes !')
      fetchData()
    } catch (error: any) {
      console.error('Erreur:', error)
      alert(error.message || 'Erreur lors de la confirmation de l\'email')
    }
  }

  const toggleChannel = (channelId: string) => {
    if (editingChannels.includes(channelId)) {
      setEditingChannels(editingChannels.filter(id => id !== channelId))
    } else {
      setEditingChannels([...editingChannels, channelId])
    }
  }

  const toggleNewUserChannel = (channelId: string) => {
    if (newUser.channelIds.includes(channelId)) {
      setNewUser({
        ...newUser,
        channelIds: newUser.channelIds.filter(id => id !== channelId)
      })
    } else {
      setNewUser({
        ...newUser,
        channelIds: [...newUser.channelIds, channelId]
      })
    }
  }

  async function handleCreateUser() {
    try {
      // Validation
      if (!newUser.email || !newUser.password) {
        alert('Email et mot de passe requis')
        return
      }

      if (newUser.password.length < 6) {
        alert('Le mot de passe doit contenir au moins 6 caracteres')
        return
      }

      // Appeler l'API route
      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: newUser.email,
          password: newUser.password,
          full_name: newUser.full_name,
          role: newUser.role,
          channelIds: newUser.channelIds
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la creation du compte')
      }

      alert('Compte cree avec succes !')
      setShowCreateForm(false)
      setNewUser({ email: '', password: '', full_name: '', role: 'standard', channelIds: [] })
      fetchData()
    } catch (error: any) {
      console.error('Erreur:', error)
      alert(error.message || 'Erreur lors de la creation du compte')
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
          {/* Formulaire de création */}
          <div className="mb-8 bg-white rounded-lg shadow overflow-hidden">
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="w-full px-6 py-4 flex items-center justify-between bg-red-900 hover:bg-red-800 text-white font-semibold transition-colors"
            >
              <span>{showCreateForm ? '➖' : '➕'} Nouveau compte</span>
              <span className="text-sm">{showCreateForm ? 'Masquer' : 'Afficher'}</span>
            </button>

            {showCreateForm && (
              <div className="p-6 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      placeholder="utilisateur@exemple.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      required
                    />
                  </div>

                  {/* Mot de passe */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mot de passe <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      placeholder="Minimum 6 caractères"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      required
                      minLength={6}
                    />
                  </div>

                  {/* Nom complet */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom complet
                    </label>
                    <input
                      type="text"
                      value={newUser.full_name}
                      onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                      placeholder="Optionnel"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>

                  {/* Rôle */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rôle
                    </label>
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser({ ...newUser, role: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    >
                      <option value="standard">Standard</option>
                      <option value="moderator">Modérateur</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  {/* Canaux de vente */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Canaux de vente
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 bg-gray-50 rounded-md">
                      {channels.map(channel => (
                        <label key={channel.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-100 p-2 rounded">
                          <input
                            type="checkbox"
                            checked={newUser.channelIds.includes(channel.id)}
                            onChange={() => toggleNewUserChannel(channel.id)}
                            className="rounded text-red-600 focus:ring-red-500"
                          />
                          <span>{channel.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Boutons d'action */}
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={handleCreateUser}
                    className="px-6 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition-colors"
                  >
                    Créer le compte
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateForm(false)
                      setNewUser({ email: '', password: '', full_name: '', role: 'standard', channelIds: [] })
                    }}
                    className="px-6 py-2 bg-gray-300 text-gray-700 font-semibold rounded-md hover:bg-gray-400 transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}
          </div>

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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mot de passe</th>
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
                      {editingUser === profile.id ? (
                        <input
                          type="email"
                          value={editingEmail}
                          onChange={(e) => setEditingEmail(e.target.value)}
                          className="w-full px-3 py-1 border rounded text-sm"
                          placeholder="email@exemple.com"
                        />
                      ) : (
                        <div className="text-sm font-medium text-gray-900">{profile.email}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingUser === profile.id ? (
                        <input
                          type="text"
                          value={editingFullName}
                          onChange={(e) => setEditingFullName(e.target.value)}
                          className="w-full px-3 py-1 border rounded text-sm"
                          placeholder="Nom complet"
                        />
                      ) : (
                        <div className="text-sm text-gray-500">{profile.full_name || '-'}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingUser === profile.id ? (
                        <input
                          type="password"
                          value={editingPassword}
                          onChange={(e) => setEditingPassword(e.target.value)}
                          className="w-full px-3 py-1 border rounded text-sm"
                          placeholder="Nouveau mot de passe (optionnel)"
                        />
                      ) : (
                        <div className="text-sm text-gray-400">••••••••</div>
                      )}
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
                            onClick={() => handleConfirmEmail(profile.id)}
                            className="px-3 py-1 text-white text-sm rounded hover:bg-[#059669]"
                            style={{ backgroundColor: '#10b981' }}
                          >
                            ✅ Confirmer l'email
                          </button>
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
