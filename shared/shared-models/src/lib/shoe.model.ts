export interface Shoe {
  id: number;
  code: string; // unikalny kod/sku
  name: string; // pełna nazwa modelu
  basePrice: number; // cena bazowa (zł)
  sizes: SizeAvailability[]; // dostępność wg rozmiarów
  visible: boolean; // widoczność w sklepie
}

export interface SizeAvailability {
  size: number;
  price: number;
  quantity: number;
}

export interface ShoeQueryParams {
  search?: string; // wyszukiwanie po kodzie/nazwie
  brand?: string; // filtr po marce
  minAvailability?: number; // filtr przykładowy
  sortBy?: 'code' | 'name'; // sortowanie
  sortDirection?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

