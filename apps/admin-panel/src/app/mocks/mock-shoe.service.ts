// apps/admin-panel/src/app/mocks/mock-shoe.service.ts
import { Injectable } from '@angular/core';
import { PagedResult, Shoe, ShoeQueryParams } from '@shoestore/shared-models';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';

// Przykładowe, statyczne dane
const MOCK_SHOES: Shoe[] = [
  {
    id: 1,
    code: 'SUPERSTAR',
    name: 'Adidas Superstar',
    basePrice: 299,
    visible: true,
    sizes: [
      { size: 36, price: 299, quantity: 12 },
      { size: 37, price: 299, quantity: 5 },
      { size: 38, price: 299, quantity: 0 },
    ],
  },
  {
    id: 2,
    code: 'AIRMAX',
    name: 'Nike Air Max',
    basePrice: 349,
    visible: true,
    sizes: [
      { size: 40, price: 349, quantity: 3 },
      { size: 41, price: 349, quantity: 10 },
      { size: 42, price: 349, quantity: 0 },
    ],
  },
  {
    id: 3,
    code: 'SUEDE',
    name: 'Puma Suede',
    basePrice: 279,
    visible: false,
    sizes: [
      { size: 39, price: 279, quantity: 4 },
      { size: 40, price: 279, quantity: 6 },
    ],
  },
  // dodać kolejne wedle potrzeby
];

@Injectable()
export class MockShoeService {
  private data = [...MOCK_SHOES];

  getShoes(params: ShoeQueryParams = {}): Observable<PagedResult<Shoe>> {
    // Proste filtrowanie i sortowanie w pamięci
    let items = this.data;

    if (params.search) {
      const term = params.search.toLowerCase();
      items = items.filter(
        (s) =>
          s.code.toLowerCase().includes(term) ||
          s.name.toLowerCase().includes(term)
      );
    }
    if (params.brand) {
      // jeśli brand to prefix kodu (np. 'ADIDAS'), można filtrować po code
      items = items.filter((s) =>
        s.code.toLowerCase().startsWith(params.brand!.toLowerCase())
      );
    }
    if (params.sortBy) {
      items = items.sort((a, b) => {
        const fieldA = (a as any)[params.sortBy!];
        const fieldB = (b as any)[params.sortBy!];
        if (fieldA < fieldB) return params.sortDirection === 'asc' ? -1 : 1;
        if (fieldA > fieldB) return params.sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    const total = items.length;
    const page = params.page ?? 1;
    const size = params.pageSize ?? 10;
    const start = (page - 1) * size;
    const paged = items.slice(start, start + size);

    const result: PagedResult<Shoe> = {
      items: paged,
      total,
      page,
      pageSize: size,
    };
    // Delay aby zasymulować asynchroniczność
    return of(result).pipe(delay(300));
  }

  deleteShoe(id: number): Observable<void> {
    const idx = this.data.findIndex((s) => s.id === id);
    if (idx < 0) {
      return throwError(() => new Error(`Model o id ${id} nie istnieje`));
    }
    this.data.splice(idx, 1);
    return of(void 0).pipe(delay(200));
  }
}
