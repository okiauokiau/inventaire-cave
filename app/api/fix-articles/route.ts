import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // 1. Supprimer les relations orphelines dans article_channels
    const { data: orphanedRelations } = await supabase
      .from('article_channels')
      .select('id, article_id')

    console.log('Relations trouvées:', orphanedRelations?.length)

    if (orphanedRelations && orphanedRelations.length > 0) {
      for (const relation of orphanedRelations) {
        // Vérifier si l'article existe
        const { data: article } = await supabase
          .from('standard_articles')
          .select('id')
          .eq('id', relation.article_id)
          .single()

        if (!article) {
          // Article n'existe pas, supprimer la relation
          await supabase
            .from('article_channels')
            .delete()
            .eq('id', relation.id)
          console.log('Relation orpheline supprimée:', relation.id)
        }
      }
    }

    // 2. Récupérer les canaux de vente existants
    const { data: channels } = await supabase
      .from('sales_channels')
      .select('id, name')

    console.log('Canaux trouvés:', channels)

    const brocantesChannel = channels?.find(c => c.name === 'Brocantes Antiquités')
    const hotelChannel = channels?.find(c => c.name === 'Hôtel de vente')

    if (!brocantesChannel || !hotelChannel) {
      return NextResponse.json({
        success: false,
        error: 'Canaux "Brocantes Antiquités" ou "Hôtel de vente" non trouvés'
      }, { status: 400 })
    }

    // 3. Récupérer l'utilisateur admin
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin')
      .limit(1)
      .single()

    if (!adminProfile) {
      return NextResponse.json({
        success: false,
        error: 'Aucun utilisateur admin trouvé'
      }, { status: 400 })
    }

    // 4. Créer les 2 articles
    const articles = [
      {
        nom: 'Peinture Buffet 55',
        description: 'Article standard de test',
        prix_achat: null,
        prix_vente: null,
        quantite: 1,
        categorie: null,
        created_by: adminProfile.id,
        status: 'en_vente'
      },
      {
        nom: 'peinture monterisso 1955',
        description: 'Article standard de test',
        prix_achat: null,
        prix_vente: null,
        quantite: 1,
        categorie: null,
        created_by: adminProfile.id,
        status: 'en_vente'
      }
    ]

    const createdArticles = []

    for (const article of articles) {
      const { data: newArticle, error: articleError } = await supabase
        .from('standard_articles')
        .insert(article)
        .select()
        .single()

      if (articleError) {
        console.error('Erreur création article:', articleError)
        continue
      }

      console.log('Article créé:', newArticle)
      createdArticles.push(newArticle)

      // 5. Créer les relations avec les canaux
      await supabase
        .from('article_channels')
        .insert([
          { article_id: newArticle.id, channel_id: brocantesChannel.id },
          { article_id: newArticle.id, channel_id: hotelChannel.id }
        ])

      console.log('Relations créées pour article:', newArticle.id)
    }

    return NextResponse.json({
      success: true,
      message: 'Articles créés et relations nettoyées',
      articles: createdArticles,
      orphanedRelationsDeleted: orphanedRelations?.length || 0
    })
  } catch (error: any) {
    console.error('Erreur:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
