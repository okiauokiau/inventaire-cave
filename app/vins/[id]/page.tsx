'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Vin, Photo, Bouteille } from '@/types'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Navbar } from '@/components/navbar'
import Link from 'next/link'
import { colors, shadows, borderRadius, spacing } from '@/lib/design-system'

export default function VinDetail() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { profile } = useAuth()

  const [vin, setVin] = useState<Vin | null>(null)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [bouteilles, setBouteilles] = useState<Bouteille[]>([])
  const [channel, setChannel] = useState<{ id: string; name: string } | null>(null)
  const [channels, setChannels] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState<number | null>(null)

  const [stats, setStats] = useState({
    total: 0,
    excellent: 0,
    bon: 0,
    correct: 0,
    moyen: 0,
    mauvais: 0,
    difficulte: 0
  })

  const [niveaux, setNiveaux] = useState({
    plein: 0,
    haut_epaule: 0,
    mi_epaule: 0,
    bas_epaule: 0,
    haut_goulot: 0,
    mi_goulot: 0
  })

  useEffect(() => {
    fetchVin()
  }, [id])

  async function fetchVin() {
    try {
      const { data: vinData, error: vinError } = await supabase
        .from('vins')
        .select('*')
        .eq('id', id)
        .single()

      if (vinError) throw vinError
      setVin(vinData)

      // Charger le canal de vente si spécifié
      if (vinData.channel_id) {
        const { data: channelData } = await supabase
          .from('sales_channels')
          .select('*')
          .eq('id', vinData.channel_id)
          .single()

        setChannel(channelData)
      }

      // Récupérer les canaux assignés au vin
      const { data: vinChannels } = await supabase
        .from('vin_channels')
        .select(`
          channel_id,
          sales_channels (
            id,
            name,
            description
          )
        `)
        .eq('vin_id', id)

      const channelsData = vinChannels?.map(vc => vc.sales_channels).filter(Boolean) || []
      setChannels(channelsData)

      const { data: photosData } = await supabase
        .from('photos')
        .select('*')
        .eq('vin_id', id)
        .order('ordre', { ascending: true })

      setPhotos(photosData || [])

      const { data: bouteillesData } = await supabase
        .from('bouteilles')
        .select('*')
        .eq('vin_id', id)
        .order('created_at', { ascending: false })

      setBouteilles(bouteillesData || [])

      if (bouteillesData) {
        const statsCalc = {
          total: bouteillesData.length,
          excellent: bouteillesData.filter(b => b.etat_qualitatif === 'EXCELLENT').length,
          bon: bouteillesData.filter(b => b.etat_qualitatif === 'BON').length,
          correct: bouteillesData.filter(b => b.etat_qualitatif === 'CORRECT').length,
          moyen: bouteillesData.filter(b => b.etat_qualitatif === 'MOYEN').length,
          mauvais: bouteillesData.filter(b => b.etat_qualitatif === 'MAUVAIS').length,
          difficulte: bouteillesData.filter(b => b.etat_qualitatif === 'DIFFICULTE_EVOLUTION').length
        }
        setStats(statsCalc)

        const niveauxCalc = {
          plein: bouteillesData.filter(b => b.niveau_remplissage === 'PLEIN').length,
          haut_epaule: bouteillesData.filter(b => b.niveau_remplissage === 'HAUT_EPAULE').length,
          mi_epaule: bouteillesData.filter(b => b.niveau_remplissage === 'MI_EPAULE').length,
          bas_epaule: bouteillesData.filter(b => b.niveau_remplissage === 'BAS_EPAULE').length,
          haut_goulot: bouteillesData.filter(b => b.niveau_remplissage === 'HAUT_GOULOT').length,
          mi_goulot: bouteillesData.filter(b => b.niveau_remplissage === 'MI_GOULOT').length
        }
        setNiveaux(niveauxCalc)
      }
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteVin = async () => {
    if (!confirm('Supprimer ce vin et toutes ses bouteilles ?')) return

    try {
      const { error } = await supabase.from('vins').delete().eq('id', id)
      if (error) throw error
      alert('Vin supprimé')
      router.push('/')
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la suppression')
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ backgroundColor: colors.neutral[50] }}
        >
          <div
            className="text-2xl font-bold"
            style={{ color: colors.primary[600] }}
          >
            Chargement...
          </div>
        </div>
      </>
    )
  }

  if (!vin) {
    return (
      <>
        <Navbar />
        <div className="p-8">
          <div
            className="text-xl font-semibold"
            style={{ color: colors.neutral[700] }}
          >
            Vin non trouvé
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div
        className="min-h-screen"
        style={{ backgroundColor: colors.neutral[50] }}
      >
        {/* Header Section */}
        <div
          className="shadow-md"
          style={{
            background: `linear-gradient(135deg, ${colors.primary[600]} 0%, ${colors.accent[600]} 100%)`,
            color: '#ffffff'
          }}
        >
          <div className="max-w-7xl mx-auto py-6 sm:py-8 md:py-12 px-4 sm:px-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div className="flex-1">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2">
                  {vin.nom} {vin.millesime}
                </h1>
                {vin.producteur && (
                  <p
                    className="text-lg sm:text-xl"
                    style={{ color: 'rgba(255, 255, 255, 0.9)' }}
                  >
                    {vin.producteur}
                  </p>
                )}
              </div>
              <div className="flex gap-2 sm:gap-3 flex-wrap">
                {profile?.role && ['admin', 'moderator'].includes(profile.role) && (
                  <Link
                    href={`/vins/${id}/modifier`}
                    className="px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold transition-all"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      color: '#ffffff'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'
                      e.currentTarget.style.transform = 'translateY(-2px)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'
                      e.currentTarget.style.transform = 'translateY(0)'
                    }}
                  >
                    Modifier
                  </Link>
                )}
                <Link
                  href="/"
                  className="px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold transition-all"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    color: '#ffffff'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  Retour
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 space-y-6">

          {/* SECTION 1 : Informations */}
          <div
            className="rounded-xl p-6 sm:p-8 transition-all hover:shadow-lg"
            style={{
              backgroundColor: '#ffffff',
              boxShadow: shadows.card,
              borderRadius: borderRadius.xl
            }}
          >
            <h2
              className="text-2xl sm:text-3xl font-bold mb-6 flex items-center gap-3"
              style={{ color: colors.neutral[900] }}
            >
              <span
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center text-xl sm:text-2xl"
                style={{
                  background: `linear-gradient(135deg, ${colors.primary[500]} 0%, ${colors.primary[700]} 100%)`,
                  color: '#ffffff',
                  boxShadow: shadows.md
                }}
              >
                📋
              </span>
              Informations du vin
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {vin.producteur && (
                <div>
                  <div
                    className="text-xs font-bold uppercase mb-1"
                    style={{ color: colors.neutral[600] }}
                  >
                    Producteur
                  </div>
                  <div
                    className="text-base sm:text-lg font-semibold"
                    style={{ color: colors.neutral[900] }}
                  >
                    {vin.producteur}
                  </div>
                </div>
              )}
              {vin.appellation && (
                <div>
                  <div
                    className="text-xs font-bold uppercase mb-1"
                    style={{ color: colors.neutral[600] }}
                  >
                    Appellation
                  </div>
                  <div
                    className="text-base sm:text-lg font-semibold"
                    style={{ color: colors.neutral[900] }}
                  >
                    {vin.appellation}
                  </div>
                </div>
              )}
              {vin.region && (
                <div>
                  <div
                    className="text-xs font-bold uppercase mb-1"
                    style={{ color: colors.neutral[600] }}
                  >
                    Région
                  </div>
                  <div
                    className="text-base sm:text-lg font-semibold"
                    style={{ color: colors.neutral[900] }}
                  >
                    {vin.region}
                  </div>
                </div>
              )}
              {vin.pays && (
                <div>
                  <div
                    className="text-xs font-bold uppercase mb-1"
                    style={{ color: colors.neutral[600] }}
                  >
                    Pays
                  </div>
                  <div
                    className="text-base sm:text-lg font-semibold"
                    style={{ color: colors.neutral[900] }}
                  >
                    {vin.pays}
                  </div>
                </div>
              )}
              {vin.couleur && (
                <div>
                  <div
                    className="text-xs font-bold uppercase mb-1"
                    style={{ color: colors.neutral[600] }}
                  >
                    Couleur
                  </div>
                  <div
                    className="text-base sm:text-lg font-semibold"
                    style={{ color: colors.neutral[900] }}
                  >
                    {vin.couleur}
                  </div>
                </div>
              )}
              {vin.cepage && (
                <div>
                  <div
                    className="text-xs font-bold uppercase mb-1"
                    style={{ color: colors.neutral[600] }}
                  >
                    Cépage
                  </div>
                  <div
                    className="text-base sm:text-lg font-semibold"
                    style={{ color: colors.neutral[900] }}
                  >
                    {vin.cepage}
                  </div>
                </div>
              )}
              {vin.volume_bouteille && (
                <div>
                  <div
                    className="text-xs font-bold uppercase mb-1"
                    style={{ color: colors.neutral[600] }}
                  >
                    Volume
                  </div>
                  <div
                    className="text-base sm:text-lg font-semibold"
                    style={{ color: colors.neutral[900] }}
                  >
                    {vin.volume_bouteille}
                  </div>
                </div>
              )}
              {vin.degre_alcool && (
                <div>
                  <div
                    className="text-xs font-bold uppercase mb-1"
                    style={{ color: colors.neutral[600] }}
                  >
                    Degré
                  </div>
                  <div
                    className="text-base sm:text-lg font-semibold"
                    style={{ color: colors.neutral[900] }}
                  >
                    {vin.degre_alcool}%
                  </div>
                </div>
              )}
              {channel && (
                <div className="sm:col-span-2 lg:col-span-3">
                  <div
                    className="text-xs font-bold uppercase mb-1"
                    style={{ color: colors.neutral[600] }}
                  >
                    Canal de vente
                  </div>
                  <div
                    className="text-base sm:text-lg font-semibold mb-4"
                    style={{ color: colors.neutral[900] }}
                  >
                    {channel.name}
                  </div>

                  {/* Checkbox conditionnelle selon le canal */}
                  {(() => {
                    const channelNameNormalized = channel.name
                      .toLowerCase()
                      .trim()
                      .normalize('NFD')
                      .replace(/[\u0300-\u036f]/g, '')

                    const handleStatusChange = async (newStatus: 'accepte' | 'vendu' | 'en_vente') => {
                      try {
                        const updateData: any = {
                          status: newStatus
                        }

                        // Gestion des dates selon le statut
                        if (newStatus === 'accepte') {
                          // Ajouter date d'acceptation si elle n'existe pas, supprimer date de vente
                          if (!vin.date_acceptation) {
                            updateData.date_acceptation = new Date().toISOString()
                          }
                          updateData.date_vente = null
                        } else if (newStatus === 'vendu') {
                          // Ajouter date de vente si elle n'existe pas, supprimer date d'acceptation
                          if (!vin.date_vente) {
                            updateData.date_vente = new Date().toISOString()
                          }
                          updateData.date_acceptation = null
                        } else if (newStatus === 'en_vente') {
                          // Supprimer les deux dates si on revient à "en_vente"
                          updateData.date_acceptation = null
                          updateData.date_vente = null
                        }

                        const { error } = await supabase
                          .from('vins')
                          .update(updateData)
                          .eq('id', id)

                        if (error) throw error

                        // Recharger les données
                        await fetchVin()
                      } catch (error) {
                        console.error('Erreur:', error)
                        alert('Erreur lors de la mise à jour du statut')
                      }
                    }

                    // Les checkboxes sont accessibles à tous les utilisateurs authentifiés
                    if (channelNameNormalized.includes('hotel') && channelNameNormalized.includes('vente')) {
                      return (
                        <div
                          className="rounded-lg p-4"
                          style={{
                            backgroundColor: colors.neutral[50],
                            border: `2px solid ${colors.neutral[200]}`
                          }}
                        >
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={vin.status === 'accepte'}
                              onChange={(e) => handleStatusChange(e.target.checked ? 'accepte' : 'en_vente')}
                              className="w-5 h-5 rounded focus:ring-2 transition-all"
                              style={{
                                accentColor: colors.primary[600]
                              }}
                            />
                            <span
                              className="text-sm sm:text-base font-semibold"
                              style={{ color: colors.neutral[900] }}
                            >
                              Accepté par l'Hôtel de vente
                            </span>
                          </label>
                        </div>
                      )
                    } else if (channelNameNormalized.includes('bon') && channelNameNormalized.includes('coin')) {
                      return (
                        <div
                          className="rounded-lg p-4"
                          style={{
                            backgroundColor: colors.neutral[50],
                            border: `2px solid ${colors.neutral[200]}`
                          }}
                        >
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={vin.status === 'vendu'}
                              onChange={(e) => handleStatusChange(e.target.checked ? 'vendu' : 'en_vente')}
                              className="w-5 h-5 rounded focus:ring-2 transition-all"
                              style={{
                                accentColor: colors.primary[600]
                              }}
                            />
                            <span
                              className="text-sm sm:text-base font-semibold"
                              style={{ color: colors.neutral[900] }}
                            >
                              Vendu
                            </span>
                          </label>
                        </div>
                      )
                    } else {
                      // Pour les autres canaux ou si pas de canal, afficher le badge de statut normal
                      return vin.status ? (
                        <div>
                          <div
                            className="text-xs font-bold uppercase mb-1"
                            style={{ color: colors.neutral[600] }}
                          >
                            Statut
                          </div>
                          <span
                            className="px-4 py-2 rounded-full text-sm font-semibold inline-block"
                            style={{
                              backgroundColor:
                                vin.status === 'en_vente' ? colors.info.DEFAULT :
                                vin.status === 'accepte' ? colors.warning.DEFAULT :
                                vin.status === 'vendu' ? colors.success.DEFAULT : colors.neutral[400],
                              color: '#ffffff'
                            }}
                          >
                            {vin.status === 'en_vente' ? 'En vente' :
                             vin.status === 'accepte' ? 'Accepté' :
                             vin.status === 'vendu' ? 'Vendu' : 'Archivé'}
                          </span>
                        </div>
                      ) : null
                    }
                  })()}
                </div>
              )}
            </div>

            {/* Canaux de vente */}
            {channels.length > 0 && (
              <div
                className="mt-6 pt-6"
                style={{ borderTop: `2px solid ${colors.neutral[200]}` }}
              >
                <div
                  className="text-xs font-bold uppercase mb-3"
                  style={{ color: colors.neutral[600] }}
                >
                  Canaux de vente
                </div>
                <div className="flex flex-wrap gap-2">
                  {channels.map((ch: any) => (
                    <span
                      key={ch.id}
                      className="px-4 py-2 rounded-full text-sm font-semibold"
                      style={{
                        backgroundColor: '#fed7aa',
                        color: '#c2410c'
                      }}
                    >
                      {ch.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Dates d'acceptation et de vente */}
            {(vin.date_acceptation || vin.date_vente) && (
              <div
                className="mt-6 pt-6"
                style={{ borderTop: `2px solid ${colors.neutral[200]}` }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {vin.date_acceptation && (
                    <div>
                      <div
                        className="text-xs font-bold uppercase mb-1"
                        style={{ color: colors.neutral[600] }}
                      >
                        Date d'acceptation
                      </div>
                      <div
                        className="text-base sm:text-lg font-semibold"
                        style={{ color: colors.neutral[900] }}
                      >
                        {new Date(vin.date_acceptation).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                  )}
                  {vin.date_vente && (
                    <div>
                      <div
                        className="text-xs font-bold uppercase mb-1"
                        style={{ color: colors.neutral[600] }}
                      >
                        Date de vente
                      </div>
                      <div
                        className="text-base sm:text-lg font-semibold"
                        style={{ color: colors.neutral[900] }}
                      >
                        {new Date(vin.date_vente).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2 : États qualitatifs */}
          <div
            className="rounded-xl p-6 sm:p-8 transition-all hover:shadow-lg"
            style={{
              backgroundColor: '#ffffff',
              boxShadow: shadows.card,
              borderRadius: borderRadius.xl
            }}
          >
            <h2
              className="text-2xl sm:text-3xl font-bold mb-6 flex items-center gap-3"
              style={{ color: colors.neutral[900] }}
            >
              <span
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center text-xl sm:text-2xl"
                style={{
                  background: `linear-gradient(135deg, ${colors.success.DEFAULT} 0%, ${colors.success.dark} 100%)`,
                  color: '#ffffff',
                  boxShadow: shadows.md
                }}
              >
                📊
              </span>
              Inventaire par état qualitatif
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              <div
                className="rounded-xl p-4 sm:p-6 text-center transition-all hover:shadow-md"
                style={{
                  backgroundColor: colors.success.light,
                  border: `3px solid ${colors.success.DEFAULT}`
                }}
              >
                <div
                  className="text-3xl sm:text-4xl md:text-5xl font-bold"
                  style={{ color: colors.success.dark }}
                >
                  {stats.total}
                </div>
                <div
                  className="text-xs sm:text-sm font-semibold mt-2"
                  style={{ color: colors.neutral[700] }}
                >
                  TOTAL
                </div>
              </div>
              <div
                className="rounded-xl p-4 sm:p-6 text-center transition-all hover:shadow-md"
                style={{
                  backgroundColor: '#ffffff',
                  border: `2px solid ${colors.neutral[200]}`
                }}
              >
                <div
                  className="text-2xl sm:text-3xl md:text-4xl font-bold"
                  style={{ color: colors.success.DEFAULT }}
                >
                  {stats.excellent}
                </div>
                <div
                  className="text-xs sm:text-sm font-semibold mt-2"
                  style={{ color: colors.neutral[600] }}
                >
                  Excellent
                </div>
              </div>
              <div
                className="rounded-xl p-4 sm:p-6 text-center transition-all hover:shadow-md"
                style={{
                  backgroundColor: '#ffffff',
                  border: `2px solid ${colors.neutral[200]}`
                }}
              >
                <div
                  className="text-2xl sm:text-3xl md:text-4xl font-bold"
                  style={{ color: colors.info.DEFAULT }}
                >
                  {stats.bon}
                </div>
                <div
                  className="text-xs sm:text-sm font-semibold mt-2"
                  style={{ color: colors.neutral[600] }}
                >
                  Bon
                </div>
              </div>
              <div
                className="rounded-xl p-4 sm:p-6 text-center transition-all hover:shadow-md"
                style={{
                  backgroundColor: '#ffffff',
                  border: `2px solid ${colors.neutral[200]}`
                }}
              >
                <div
                  className="text-2xl sm:text-3xl md:text-4xl font-bold"
                  style={{ color: colors.warning.DEFAULT }}
                >
                  {stats.correct}
                </div>
                <div
                  className="text-xs sm:text-sm font-semibold mt-2"
                  style={{ color: colors.neutral[600] }}
                >
                  Correct
                </div>
              </div>
              <div
                className="rounded-xl p-4 sm:p-6 text-center transition-all hover:shadow-md"
                style={{
                  backgroundColor: '#ffffff',
                  border: `2px solid ${colors.neutral[200]}`
                }}
              >
                <div
                  className="text-2xl sm:text-3xl md:text-4xl font-bold"
                  style={{ color: '#f97316' }}
                >
                  {stats.moyen}
                </div>
                <div
                  className="text-xs sm:text-sm font-semibold mt-2"
                  style={{ color: colors.neutral[600] }}
                >
                  Moyen
                </div>
              </div>
              <div
                className="rounded-xl p-4 sm:p-6 text-center transition-all hover:shadow-md"
                style={{
                  backgroundColor: '#ffffff',
                  border: `2px solid ${colors.neutral[200]}`
                }}
              >
                <div
                  className="text-2xl sm:text-3xl md:text-4xl font-bold"
                  style={{ color: '#dc2626' }}
                >
                  {stats.mauvais}
                </div>
                <div
                  className="text-xs sm:text-sm font-semibold mt-2"
                  style={{ color: colors.neutral[600] }}
                >
                  Mauvais
                </div>
              </div>
              <div
                className="rounded-xl p-4 sm:p-6 text-center transition-all hover:shadow-md"
                style={{
                  backgroundColor: '#ffffff',
                  border: `2px solid ${colors.neutral[200]}`
                }}
              >
                <div
                  className="text-2xl sm:text-3xl md:text-4xl font-bold"
                  style={{ color: colors.accent[600] }}
                >
                  {stats.difficulte}
                </div>
                <div
                  className="text-xs sm:text-sm font-semibold mt-2"
                  style={{ color: colors.neutral[600] }}
                >
                  Difficulté
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3 : Niveaux */}
          <div
            className="rounded-xl p-6 sm:p-8 transition-all hover:shadow-lg"
            style={{
              backgroundColor: '#ffffff',
              boxShadow: shadows.card,
              borderRadius: borderRadius.xl
            }}
          >
            <h2
              className="text-2xl sm:text-3xl font-bold mb-6 flex items-center gap-3"
              style={{ color: colors.neutral[900] }}
            >
              <span
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center text-xl sm:text-2xl"
                style={{
                  background: `linear-gradient(135deg, ${colors.info.DEFAULT} 0%, ${colors.info.dark} 100%)`,
                  color: '#ffffff',
                  boxShadow: shadows.md
                }}
              >
                🍾
              </span>
              Niveaux de remplissage
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              <div
                className="rounded-xl p-4 sm:p-6 text-center transition-all hover:shadow-md"
                style={{
                  backgroundColor: '#ffffff',
                  border: `2px solid ${colors.neutral[200]}`
                }}
              >
                <div
                  className="text-2xl sm:text-3xl md:text-4xl font-bold"
                  style={{ color: colors.success.DEFAULT }}
                >
                  {niveaux.plein}
                </div>
                <div
                  className="text-xs sm:text-sm font-semibold mt-2"
                  style={{ color: colors.neutral[600] }}
                >
                  Plein
                </div>
              </div>
              <div
                className="rounded-xl p-4 sm:p-6 text-center transition-all hover:shadow-md"
                style={{
                  backgroundColor: '#ffffff',
                  border: `2px solid ${colors.neutral[200]}`
                }}
              >
                <div
                  className="text-2xl sm:text-3xl md:text-4xl font-bold"
                  style={{ color: '#22c55e' }}
                >
                  {niveaux.haut_epaule}
                </div>
                <div
                  className="text-xs sm:text-sm font-semibold mt-2"
                  style={{ color: colors.neutral[600] }}
                >
                  Haut épaule
                </div>
              </div>
              <div
                className="rounded-xl p-4 sm:p-6 text-center transition-all hover:shadow-md"
                style={{
                  backgroundColor: '#ffffff',
                  border: `2px solid ${colors.neutral[200]}`
                }}
              >
                <div
                  className="text-2xl sm:text-3xl md:text-4xl font-bold"
                  style={{ color: colors.warning.DEFAULT }}
                >
                  {niveaux.mi_epaule}
                </div>
                <div
                  className="text-xs sm:text-sm font-semibold mt-2"
                  style={{ color: colors.neutral[600] }}
                >
                  Mi-épaule
                </div>
              </div>
              <div
                className="rounded-xl p-4 sm:p-6 text-center transition-all hover:shadow-md"
                style={{
                  backgroundColor: '#ffffff',
                  border: `2px solid ${colors.neutral[200]}`
                }}
              >
                <div
                  className="text-2xl sm:text-3xl md:text-4xl font-bold"
                  style={{ color: '#f97316' }}
                >
                  {niveaux.bas_epaule}
                </div>
                <div
                  className="text-xs sm:text-sm font-semibold mt-2"
                  style={{ color: colors.neutral[600] }}
                >
                  Bas épaule
                </div>
              </div>
              <div
                className="rounded-xl p-4 sm:p-6 text-center transition-all hover:shadow-md"
                style={{
                  backgroundColor: '#ffffff',
                  border: `2px solid ${colors.neutral[200]}`
                }}
              >
                <div
                  className="text-2xl sm:text-3xl md:text-4xl font-bold"
                  style={{ color: '#ef4444' }}
                >
                  {niveaux.haut_goulot}
                </div>
                <div
                  className="text-xs sm:text-sm font-semibold mt-2"
                  style={{ color: colors.neutral[600] }}
                >
                  Haut goulot
                </div>
              </div>
              <div
                className="rounded-xl p-4 sm:p-6 text-center transition-all hover:shadow-md"
                style={{
                  backgroundColor: '#ffffff',
                  border: `2px solid ${colors.neutral[200]}`
                }}
              >
                <div
                  className="text-2xl sm:text-3xl md:text-4xl font-bold"
                  style={{ color: '#dc2626' }}
                >
                  {niveaux.mi_goulot}
                </div>
                <div
                  className="text-xs sm:text-sm font-semibold mt-2"
                  style={{ color: colors.neutral[600] }}
                >
                  Mi-goulot
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4 : GALERIE SIMPLE */}
          {photos.length > 0 && (
            <div
              className="rounded-xl p-6 sm:p-8 transition-all hover:shadow-lg"
              style={{
                backgroundColor: '#ffffff',
                boxShadow: shadows.card,
                borderRadius: borderRadius.xl
              }}
            >
              <h3
                className="text-xl sm:text-2xl font-bold mb-4 flex items-center gap-2"
                style={{ color: colors.neutral[900] }}
              >
                <span>📷</span> Photos ({photos.length})
              </h3>

              {/* Grille de miniatures */}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {photos.map((photo, index) => (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => setCurrentPhotoIndex(index)}
                    className="relative aspect-square rounded-lg overflow-hidden transition-all"
                    style={{
                      border: `2px solid ${colors.neutral[200]}`
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = colors.primary[400]
                      e.currentTarget.style.transform = 'scale(1.05)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = colors.neutral[200]
                      e.currentTarget.style.transform = 'scale(1)'
                    }}
                  >
                    <img
                      src={photo.url}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {/* Overlay au survol */}
                    <div
                      className="absolute inset-0 flex items-center justify-center transition-all"
                      style={{
                        backgroundColor: 'rgba(0, 0, 0, 0)',
                        color: '#ffffff'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.3)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0)'
                      }}
                    >
                      <span className="text-2xl opacity-0 hover:opacity-100 transition-opacity">🔍</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Modal simple (affichage grande image) */}
              {currentPhotoIndex !== null && (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center p-4"
                  style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
                  onClick={() => setCurrentPhotoIndex(null)}
                >
                  <div
                    className="relative max-w-4xl max-h-[90vh] rounded-xl overflow-hidden"
                    style={{
                      backgroundColor: '#ffffff',
                      boxShadow: shadows.xl
                    }}
                  >
                    <img
                      src={photos[currentPhotoIndex]?.url}
                      alt="Photo agrandie"
                      className="w-full h-full object-contain"
                      onClick={(e) => e.stopPropagation()}
                    />
                    {photos[currentPhotoIndex]?.commentaire && (
                      <div
                        className="absolute bottom-0 left-0 right-0 p-4"
                        style={{
                          backgroundColor: 'rgba(0, 0, 0, 0.7)',
                          color: '#ffffff'
                        }}
                      >
                        <p className="text-sm">{photos[currentPhotoIndex].commentaire}</p>
                      </div>
                    )}
                    <button
                      onClick={() => setCurrentPhotoIndex(null)}
                      className="absolute top-4 right-4 rounded-full w-10 h-10 flex items-center justify-center transition-all"
                      style={{
                        backgroundColor: '#ffffff',
                        boxShadow: shadows.lg
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = colors.neutral[100]
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#ffffff'
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SECTION 5 : Commentaire */}
          {vin.commentaire_general && (
            <div
              className="rounded-xl p-6 sm:p-8 transition-all hover:shadow-lg"
              style={{
                backgroundColor: '#ffffff',
                boxShadow: shadows.card,
                borderRadius: borderRadius.xl
              }}
            >
              <h2
                className="text-2xl sm:text-3xl font-bold mb-6 flex items-center gap-3"
                style={{ color: colors.neutral[900] }}
              >
                <span
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center text-xl sm:text-2xl"
                  style={{
                    background: `linear-gradient(135deg, ${colors.warning.DEFAULT} 0%, ${colors.warning.dark} 100%)`,
                    color: '#ffffff',
                    boxShadow: shadows.md
                  }}
                >
                  📝
                </span>
                Notes & commentaires
              </h2>
              <div
                className="rounded-lg p-4 sm:p-6"
                style={{
                  backgroundColor: colors.neutral[50],
                  border: `2px solid ${colors.neutral[200]}`
                }}
              >
                <p
                  className="whitespace-pre-wrap"
                  style={{ color: colors.neutral[800] }}
                >
                  {vin.commentaire_general}
                </p>
              </div>
            </div>
          )}

          {/* SECTION 6 : Graphiques en camembert */}
          <div
            className="rounded-xl p-6 sm:p-8 transition-all hover:shadow-lg"
            style={{
              backgroundColor: '#ffffff',
              boxShadow: shadows.card,
              borderRadius: borderRadius.xl
            }}
          >
            <h2
              className="text-xl sm:text-2xl font-bold mb-6 flex items-center gap-2"
              style={{ color: colors.neutral[900] }}
            >
              📊 Répartition des {stats.total} bouteilles
            </h2>

            {stats.total === 0 ? (
              <div
                className="text-center py-12 text-lg"
                style={{ color: colors.neutral[400] }}
              >
                Aucune bouteille dans cet inventaire
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* États qualitatifs - Camembert */}
                <div>
                  <h3
                    className="text-lg font-bold mb-4 pb-2"
                    style={{
                      color: colors.neutral[800],
                      borderBottom: `2px solid ${colors.neutral[200]}`
                    }}
                  >
                    États qualitatifs
                  </h3>
                  <div className="flex flex-col items-center">
                    <svg width="300" height="300" viewBox="0 0 300 300">
                      {(() => {
                        const centerX = 150
                        const centerY = 150
                        const radius = 120
                        let currentAngle = -90

                        const categories = [
                          { value: stats.excellent, color: '#16a34a', label: 'Excellent' },
                          { value: stats.bon, color: '#3b82f6', label: 'Bon' },
                          { value: stats.correct, color: '#eab308', label: 'Correct' },
                          { value: stats.moyen, color: '#f97316', label: 'Moyen' },
                          { value: stats.mauvais, color: '#dc2626', label: 'Mauvais' },
                          { value: stats.difficulte, color: '#9333ea', label: 'Difficulté' }
                        ].filter(cat => cat.value > 0)

                        // Si une seule catégorie à 100%, dessiner un cercle complet
                        if (categories.length === 1) {
                          return (
                            <circle
                              cx={centerX}
                              cy={centerY}
                              r={radius}
                              fill={categories[0].color}
                              stroke="#ffffff"
                              strokeWidth="2"
                            />
                          )
                        }

                        return categories.map((cat, index) => {
                          const percentage = (cat.value / stats.total) * 100
                          const angle = (percentage / 100) * 360
                          const startAngle = currentAngle
                          const endAngle = currentAngle + angle

                          const startRad = (startAngle * Math.PI) / 180
                          const endRad = (endAngle * Math.PI) / 180

                          const x1 = centerX + radius * Math.cos(startRad)
                          const y1 = centerY + radius * Math.sin(startRad)
                          const x2 = centerX + radius * Math.cos(endRad)
                          const y2 = centerY + radius * Math.sin(endRad)

                          const largeArc = angle > 180 ? 1 : 0

                          const pathData = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`

                          currentAngle += angle

                          return (
                            <path
                              key={index}
                              d={pathData}
                              fill={cat.color}
                              stroke="#ffffff"
                              strokeWidth="2"
                            />
                          )
                        })
                      })()}
                    </svg>

                    <div className="mt-4 w-full space-y-2">
                      {stats.excellent > 0 && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div style={{ width: '16px', height: '16px', backgroundColor: '#16a34a', borderRadius: '3px' }}></div>
                            <span className="text-sm" style={{ color: colors.neutral[700] }}>Excellent</span>
                          </div>
                          <span className="text-sm font-bold" style={{ color: '#16a34a' }}>
                            {stats.excellent} ({Math.round((stats.excellent / stats.total) * 100)}%)
                          </span>
                        </div>
                      )}
                      {stats.bon > 0 && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div style={{ width: '16px', height: '16px', backgroundColor: '#3b82f6', borderRadius: '3px' }}></div>
                            <span className="text-sm" style={{ color: colors.neutral[700] }}>Bon</span>
                          </div>
                          <span className="text-sm font-bold" style={{ color: '#2563eb' }}>
                            {stats.bon} ({Math.round((stats.bon / stats.total) * 100)}%)
                          </span>
                        </div>
                      )}
                      {stats.correct > 0 && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div style={{ width: '16px', height: '16px', backgroundColor: '#eab308', borderRadius: '3px' }}></div>
                            <span className="text-sm" style={{ color: colors.neutral[700] }}>Correct</span>
                          </div>
                          <span className="text-sm font-bold" style={{ color: '#ca8a04' }}>
                            {stats.correct} ({Math.round((stats.correct / stats.total) * 100)}%)
                          </span>
                        </div>
                      )}
                      {stats.moyen > 0 && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div style={{ width: '16px', height: '16px', backgroundColor: '#f97316', borderRadius: '3px' }}></div>
                            <span className="text-sm" style={{ color: colors.neutral[700] }}>Moyen</span>
                          </div>
                          <span className="text-sm font-bold" style={{ color: '#ea580c' }}>
                            {stats.moyen} ({Math.round((stats.moyen / stats.total) * 100)}%)
                          </span>
                        </div>
                      )}
                      {stats.mauvais > 0 && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div style={{ width: '16px', height: '16px', backgroundColor: '#dc2626', borderRadius: '3px' }}></div>
                            <span className="text-sm" style={{ color: colors.neutral[700] }}>Mauvais</span>
                          </div>
                          <span className="text-sm font-bold" style={{ color: '#dc2626' }}>
                            {stats.mauvais} ({Math.round((stats.mauvais / stats.total) * 100)}%)
                          </span>
                        </div>
                      )}
                      {stats.difficulte > 0 && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div style={{ width: '16px', height: '16px', backgroundColor: '#9333ea', borderRadius: '3px' }}></div>
                            <span className="text-sm" style={{ color: colors.neutral[700] }}>Difficulté</span>
                          </div>
                          <span className="text-sm font-bold" style={{ color: '#9333ea' }}>
                            {stats.difficulte} ({Math.round((stats.difficulte / stats.total) * 100)}%)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Niveaux de remplissage - Camembert */}
                <div>
                  <h3
                    className="text-lg font-bold mb-4 pb-2"
                    style={{
                      color: colors.neutral[800],
                      borderBottom: `2px solid ${colors.neutral[200]}`
                    }}
                  >
                    Niveaux de remplissage
                  </h3>
                  <div className="flex flex-col items-center">
                    <svg width="300" height="300" viewBox="0 0 300 300">
                      {(() => {
                        const centerX = 150
                        const centerY = 150
                        const radius = 120
                        let currentAngle = -90

                        const categories = [
                          { value: niveaux.plein, color: '#16a34a', label: 'Plein' },
                          { value: niveaux.haut_epaule, color: '#22c55e', label: 'Haut épaule' },
                          { value: niveaux.mi_epaule, color: '#eab308', label: 'Mi-épaule' },
                          { value: niveaux.bas_epaule, color: '#f97316', label: 'Bas épaule' },
                          { value: niveaux.haut_goulot, color: '#ef4444', label: 'Haut goulot' },
                          { value: niveaux.mi_goulot, color: '#dc2626', label: 'Mi-goulot' }
                        ].filter(cat => cat.value > 0)

                        // Si une seule catégorie à 100%, dessiner un cercle complet
                        if (categories.length === 1) {
                          return (
                            <circle
                              cx={centerX}
                              cy={centerY}
                              r={radius}
                              fill={categories[0].color}
                              stroke="#ffffff"
                              strokeWidth="2"
                            />
                          )
                        }

                        return categories.map((cat, index) => {
                          const percentage = (cat.value / stats.total) * 100
                          const angle = (percentage / 100) * 360
                          const startAngle = currentAngle
                          const endAngle = currentAngle + angle

                          const startRad = (startAngle * Math.PI) / 180
                          const endRad = (endAngle * Math.PI) / 180

                          const x1 = centerX + radius * Math.cos(startRad)
                          const y1 = centerY + radius * Math.sin(startRad)
                          const x2 = centerX + radius * Math.cos(endRad)
                          const y2 = centerY + radius * Math.sin(endRad)

                          const largeArc = angle > 180 ? 1 : 0

                          const pathData = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`

                          currentAngle += angle

                          return (
                            <path
                              key={index}
                              d={pathData}
                              fill={cat.color}
                              stroke="#ffffff"
                              strokeWidth="2"
                            />
                          )
                        })
                      })()}
                    </svg>

                    <div className="mt-4 w-full space-y-2">
                      {niveaux.plein > 0 && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div style={{ width: '16px', height: '16px', backgroundColor: '#16a34a', borderRadius: '3px' }}></div>
                            <span className="text-sm" style={{ color: colors.neutral[700] }}>Plein</span>
                          </div>
                          <span className="text-sm font-bold" style={{ color: '#16a34a' }}>
                            {niveaux.plein} ({Math.round((niveaux.plein / stats.total) * 100)}%)
                          </span>
                        </div>
                      )}
                      {niveaux.haut_epaule > 0 && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div style={{ width: '16px', height: '16px', backgroundColor: '#22c55e', borderRadius: '3px' }}></div>
                            <span className="text-sm" style={{ color: colors.neutral[700] }}>Haut épaule</span>
                          </div>
                          <span className="text-sm font-bold" style={{ color: '#22c55e' }}>
                            {niveaux.haut_epaule} ({Math.round((niveaux.haut_epaule / stats.total) * 100)}%)
                          </span>
                        </div>
                      )}
                      {niveaux.mi_epaule > 0 && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div style={{ width: '16px', height: '16px', backgroundColor: '#eab308', borderRadius: '3px' }}></div>
                            <span className="text-sm" style={{ color: colors.neutral[700] }}>Mi-épaule</span>
                          </div>
                          <span className="text-sm font-bold" style={{ color: '#eab308' }}>
                            {niveaux.mi_epaule} ({Math.round((niveaux.mi_epaule / stats.total) * 100)}%)
                          </span>
                        </div>
                      )}
                      {niveaux.bas_epaule > 0 && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div style={{ width: '16px', height: '16px', backgroundColor: '#f97316', borderRadius: '3px' }}></div>
                            <span className="text-sm" style={{ color: colors.neutral[700] }}>Bas épaule</span>
                          </div>
                          <span className="text-sm font-bold" style={{ color: '#f97316' }}>
                            {niveaux.bas_epaule} ({Math.round((niveaux.bas_epaule / stats.total) * 100)}%)
                          </span>
                        </div>
                      )}
                      {niveaux.haut_goulot > 0 && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div style={{ width: '16px', height: '16px', backgroundColor: '#ef4444', borderRadius: '3px' }}></div>
                            <span className="text-sm" style={{ color: colors.neutral[700] }}>Haut goulot</span>
                          </div>
                          <span className="text-sm font-bold" style={{ color: '#ef4444' }}>
                            {niveaux.haut_goulot} ({Math.round((niveaux.haut_goulot / stats.total) * 100)}%)
                          </span>
                        </div>
                      )}
                      {niveaux.mi_goulot > 0 && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div style={{ width: '16px', height: '16px', backgroundColor: '#dc2626', borderRadius: '3px' }}></div>
                            <span className="text-sm" style={{ color: colors.neutral[700] }}>Mi-goulot</span>
                          </div>
                          <span className="text-sm font-bold" style={{ color: '#dc2626' }}>
                            {niveaux.mi_goulot} ({Math.round((niveaux.mi_goulot / stats.total) * 100)}%)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Bouton ajouter */}
            {profile?.role && ['admin', 'moderator'].includes(profile.role) && (
              <div
                className="mt-8 pt-6 text-center"
                style={{ borderTop: `2px solid ${colors.neutral[200]}` }}
              >
                <Link
                  href={`/vins/${id}/bouteilles/nouvelle`}
                  className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold transition-all"
                  style={{
                    background: `linear-gradient(135deg, ${colors.primary[600]} 0%, ${colors.accent[600]} 100%)`,
                    color: '#ffffff',
                    boxShadow: shadows.md
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = shadows.lg
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = shadows.md
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  + Ajouter une bouteille
                </Link>
              </div>
            )}
          </div>

          {/* Boutons actions */}
          {profile?.role && ['admin', 'moderator'].includes(profile.role) && (
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Link
                href={`/vins/${id}/modifier`}
                className="flex-1 py-4 sm:py-6 rounded-xl font-bold text-center text-lg sm:text-xl transition-all"
                style={{
                  background: `linear-gradient(135deg, ${colors.primary[600]} 0%, ${colors.accent[600]} 100%)`,
                  color: '#ffffff',
                  boxShadow: shadows.md,
                  border: `3px solid #ffffff`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = shadows.xl
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = shadows.md
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                Modifier
              </Link>
              <button
                onClick={deleteVin}
                className="px-8 sm:px-10 py-4 sm:py-6 rounded-xl font-bold transition-all"
                style={{
                  backgroundColor: '#ffffff',
                  border: `3px solid #fecaca`,
                  color: '#dc2626',
                  boxShadow: shadows.md
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#fef2f2'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#ffffff'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                Supprimer
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
