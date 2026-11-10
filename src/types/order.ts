// Types pour la commande en ligne et la réservation de table

export interface CartItem {
  id: string; // Ex. "Antipasti::Bruschetta"
  platNom: string;
  categorie: string;
  prix: number; // en FCFA
  quantite: number;
  image?: string;
}

export type ModeReception = 'sur_place' | 'a_emporter' | 'livraison';
export type ModePaiement = 'especes' | 'momo' | 'om';

export interface OrderData {
  orderNumber: string; // Ex. "PV-20261110-4821"
  clientName: string;
  clientPhone: string;
  modeReception: ModeReception;
  quartier?: string;
  adresse?: string;
  notes?: string;
  modePaiement: ModePaiement;
  items: CartItem[];
  sousTotal: number;
  fraisLivraison: number;
  total: number;
  dateCreation: string; // ISO string
}

export interface ReservationData {
  reservationNumber: string; // Ex. "RES-20261110-3914"
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  date: string; // AAAA-MM-JJ
  heure: string; // HH:MM
  personnes: number;
  occasion?: string;
  demandes?: string;
  dateCreation: string; // ISO string
}
