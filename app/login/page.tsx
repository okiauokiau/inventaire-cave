'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSignUp, setIsSignUp] = useState(false)
  const router = useRouter()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (isSignUp) {
        // Inscription
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        })

        if (error) throw error

        if (data.user) {
          setError('Compte créé avec succès ! Vous pouvez maintenant vous connecter.')
          setIsSignUp(false)
        }
      } else {
        // Connexion
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) throw error

        if (data.session) {
          router.push('/')
          router.refresh()
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Une erreur est survenue')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f3f4f6' }}>
      <div className="max-w-md w-full" style={{ backgroundColor: '#ffffff', padding: '32px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h1 className="text-2xl font-bold text-center mb-6" style={{ color: '#111827' }}>
          {isSignUp ? 'Créer un compte' : 'Connexion'}
        </h1>

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="w-full px-3 py-2 border rounded-md"
              style={{
                borderColor: '#d1d5db',
                backgroundColor: loading ? '#f9fafb' : '#ffffff',
                color: '#111827'
              }}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              minLength={6}
              className="w-full px-3 py-2 border rounded-md"
              style={{
                borderColor: '#d1d5db',
                backgroundColor: loading ? '#f9fafb' : '#ffffff',
                color: '#111827'
              }}
            />
            {isSignUp && (
              <p className="text-xs mt-1" style={{ color: '#6b7280' }}>
                Minimum 6 caractères
              </p>
            )}
          </div>

          {error && (
            <div
              className="p-3 rounded-md text-sm"
              style={{
                backgroundColor: error.includes('succès') ? '#d1fae5' : '#fee2e2',
                color: error.includes('succès') ? '#065f46' : '#991b1b'
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 rounded-md font-medium"
            style={{
              backgroundColor: loading ? '#9ca3af' : '#2563eb',
              color: '#ffffff',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Chargement...' : (isSignUp ? 'Créer un compte' : 'Se connecter')}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp)
              setError(null)
            }}
            disabled={loading}
            className="text-sm"
            style={{ color: '#2563eb', cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {isSignUp ? 'Déjà un compte ? Se connecter' : 'Pas de compte ? Créer un compte'}
          </button>
        </div>
      </div>
    </div>
  )
}
