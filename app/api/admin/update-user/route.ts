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
    const { userId, email, password, full_name, role, channelIds } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'ID utilisateur requis' },
        { status: 400 }
      )
    }

    // Mettre a jour l'authentification si necessaire
    const authUpdateData: any = {}
    if (email) {
      authUpdateData.email = email
    }
    if (password) {
      authUpdateData.password = password
    }

    if (Object.keys(authUpdateData).length > 0) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        authUpdateData
      )

      if (authError) {
        console.error('Auth error:', authError)
        return NextResponse.json(
          { error: authError.message },
          { status: 400 }
        )
      }
    }

    // Mettre a jour le profil
    const profileUpdateData: any = {}
    if (email !== undefined) profileUpdateData.email = email
    if (full_name !== undefined) profileUpdateData.full_name = full_name
    if (role !== undefined) profileUpdateData.role = role

    if (Object.keys(profileUpdateData).length > 0) {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update(profileUpdateData)
        .eq('id', userId)

      if (profileError) {
        console.error('Profile error:', profileError)
        return NextResponse.json(
          { error: 'Erreur lors de la mise a jour du profil' },
          { status: 500 }
        )
      }
    }

    // Mettre a jour les canaux si fournis
    if (channelIds !== undefined) {
      // Supprimer les anciennes assignations
      await supabaseAdmin
        .from('user_channels')
        .delete()
        .eq('user_id', userId)

      // Ajouter les nouvelles assignations
      if (channelIds.length > 0) {
        const userChannelsToInsert = channelIds.map((channelId: string) => ({
          user_id: userId,
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
    }

    return NextResponse.json({
      success: true
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
