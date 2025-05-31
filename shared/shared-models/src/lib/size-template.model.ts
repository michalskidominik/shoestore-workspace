/** Para rozmiarowa: EU → US */
export interface SizePair {
  eu: number;
  us?: number; // opcjonalnie: może być niepodane
}

export interface SizeTemplate {
  id: number;          // unikalny identyfikator (np. 1, 2, 3)
  name: string;        // np. "EU 36–46"
  pairs: SizePair[];   // lista par { eu, us }
}
