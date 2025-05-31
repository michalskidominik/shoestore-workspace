/**
 * Model buta (z pełnymi danymi, np. zwrócone z backendu).
 */
export interface Shoe {
  id: number;
  code: string;              // unikalny kod produktu
  name: string;
  imageUrl?: string;         // URL do obrazka (opcjonalnie)
  visible: boolean;          // czy widoczny w sklepie
  templateId: number;        // ID wybranego szablonu rozmiarówki
  sizes: SizeAvailability[]; // tablica z cenami i stanami per rozmiar
}

/**
 * Informacje o jednym rozmiarze dla danego buta:
 * - size: numer rozmiaru
 * - price: cena tego rozmiaru
 * - quantity: dostępna ilość w magazynie
 */
export interface SizeAvailability {
  size: number;
  price: number;
  quantity: number;
}

/**
 * DTO do tworzenia nowego buta:
 * - code, name, visible, templateId
 * - optionalnie: imageFile (File) do wysłania multipart/form‐data
 * - sizes: lista obiektów { size, price, quantity }
 */
export interface ShoeCreateDto {
  code: string;
  name: string;
  imageFile?: File;
  visible: boolean;
  templateId: number;
  sizes: { size: number; price: number; quantity: number }[];
}

export type ShoeUpdateDto = ShoeCreateDto

/**
 * Parametry zapytania do listy butów (filtry, sortowanie, paginacja).
 */
export interface ShoeQueryParams {
  search?: string;            // wyszukiwanie po kodzie/nazwie
  brand?: string;             // filtr po marce
  minAvailability?: number;   // filtr po minimalnej dostępności (np. ile w magazynie)
  sortBy?: 'code' | 'name';   // sortowanie
  sortDirection?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}
