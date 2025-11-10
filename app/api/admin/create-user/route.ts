import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Client Supabase avec la cle service_role pour les operations admin
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request: NextRequest) {
  try {
    const { email, password, full_name, role, channelIds } = await request.json()

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email et mot de passe requis' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 6 caracteres' },
        { status: 400 }
      )
    }

    // Creer l'utilisateur avec Supabase Auth Admin
    // IMPORTANT: email_confirm est dans l'objet principal, pas dans email_confirmed_at
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,  // Confirme automatiquement l'email
      user_metadata: {
        full_name: full_name || null
      }
    })

    // Si la creation reussit, forcer la confirmation de l'email
    if (authData?.user && !authError) {
      await supabaseAdmin.auth.admin.updateUserById(authData.user.id, {
        email_confirm: true
      })
    }

    if (authError) {
      console.error('Auth error:', authError)
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      )
    }

    // Creer le profil
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: email,
        full_name: full_name || null,
        role: role || 'standard'
      })

    if (profileError) {
      console.error('Profile error:', profileError)
      // Supprimer l'utilisateur Auth si la creation du profil echoue
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json(
        { error: 'Erreur lors de la creation du profil' },
        { status: 500 }
      )
    }

    // Assigner les canaux
    if (channelIds && channelIds.length > 0) {
      const userChannelsToInsert = channelIds.map((channelId: string) => ({
        user_id: authData.user.id,
        channel_id: channelId
      }))

      const { error: channelsError } = await supabaseAdmin
        .from('user_channels')
        .insert(userChannelsToInsert)

      if (channelsError) {
        console.error('Channels error:', channelsError)
        // On continue meme si l'assignation des canaux echoue
      }
    }

    return NextResponse.json({
      success: true,
      user: authData.user
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
