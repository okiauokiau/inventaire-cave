export interface Vin {
  id: string
  nom: string
  producteur?: string
  appellation?: string
  region?: string
  pays?: string
  millesime?: number
  couleur?: string
  cepage?: string
  degre_alcool?: number
  volume_bouteille?: string
  description?: string
  garde_optimale_min?: number
  garde_optimale_max?: number
  temperature_service?: string
  accords_mets?: string
  prix_achat_unitaire?: number
  commentaire_general?: string
  created_at?: string
  updated_at?: string
}

export interface Photo {
  id: string
  vin_id: string
  url: string
  commentaire?: string
  ordre: number
  created_at?: string
}

export interface Bouteille {
  id: string
  vin_id: string
  code_unique: string
  emplacement_cave?: string
  date_entree?: string
  etat_qualitatif: EtatQualitatif
  niveau_remplissage: NiveauRemplissage
  statut: Statut
  commentaire?: string
  created_at?: string
  updated_at?: string
}

export type EtatQualitatif = 
  | 'EXCELLENT'
  | 'BON'
  | 'CORRECT'
  | 'MOYEN'
  | 'MAUVAIS'
  | 'DIFFICULTE_EVOLUTION'

export type NiveauRemplissage = 
  | 'PLEIN'
  | 'HAUT_EPAULE'
  | 'MI_EPAULE'
  | 'BAS_EPAULE'
  | 'HAUT_GOULOT'
  | 'MI_GOULOT'

export type Statut = 
  | 'DISPONIBLE'
  | 'A_VENDRE'
  | 'VENDU'
  | 'CONSOMME'

export const ETATS_QUALITATIFS: { value: EtatQualitatif; label: string }[] = [
  { value: 'EXCELLENT', label: 'Excellent état' },
  { value: 'BON', label: 'Bon état' },
  { value: 'CORRECT', label: 'État correct' },
  { value: 'MOYEN', label: 'État moyen' },
  { value: 'MAUVAIS', label: 'Mauvais état' },
  { value: 'DIFFICULTE_EVOLUTION', label: 'Difficulté évolution' },
]

export const NIVEAUX_REMPLISSAGE: { value: NiveauRemplissage; label: string }[] = [
  { value: 'PLEIN', label: 'Plein (100%)' },
  { value: 'HAUT_EPAULE', label: 'Haut épaule (95%)' },
  { value: 'MI_EPAULE', label: 'Mi-épaule (90%)' },
  { value: 'BAS_EPAULE', label: 'Bas épaule (85%)' },
  { value: 'HAUT_GOULOT', label: 'Haut goulot (80%)' },
  { value: 'MI_GOULOT', label: 'Mi-goulot (70%)' },
]

export const COULEURS = [
  'Rouge',
  'Blanc',
  'Rosé',
  'Champagne',
  'Effervescent',
]

export const VOLUMES = [
  '37.5 cl',
  '75 cl',
  '150 cl (Magnum)',
  '300 cl (Jéroboam)',
  '450 cl (Réhoboam)',
  '600 cl (Mathusalem)',
]
