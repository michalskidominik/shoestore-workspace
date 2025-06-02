export interface BulkStockUpdateItem {
  shoeId: number;
  size: number;
  deltaQuantity: number; // dodatnia lub ujemna zmiana stanu
}

export interface BulkStockUpdateDto {
  items: BulkStockUpdateItem[];
}
