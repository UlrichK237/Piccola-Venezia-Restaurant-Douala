// Types pour la commande en ligne et la réservation de table

export interface CartItem {
  id: string; // Ex. "Antipasti::Bruschetta"
  platNom: string;
  categorie: string;
  prix: number; // en FCFA
  quantite: number;
  options?: string[];
  remarque?: string;
  image?: string;
}

export type ModeReception = 'a_emporter' | 'livraison';

export interface OrderFormData {
  nom: string;
  telephone: string;
  modeReception: ModeReception;
  quartier?: string;
  adresse?: string;
  heureSouhaitee?: string;
  remarquesGenerales?: string;
}

export interface ReservationFormData {
  nom: string;
  telephone: string;
  date: string; // AAAA-MM-JJ
  heure: string; // HH:MM
  personnes: number;
  occasion?: string;
  demandes?: string;
}
