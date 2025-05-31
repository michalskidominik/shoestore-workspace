import { Injectable } from '@angular/core';
import {
  PagedResult,
  Shoe,
  ShoeCreateDto,
  ShoeQueryParams,
  ShoeUpdateDto,
} from '@shoestore/shared-models';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';

let NEXT_ID = 4; // Zakładamy, że w MOCK_SHOES są id: 1,2,3

const MOCK_SHOES: Shoe[] = [
  {
    id: 1,
    code: 'SUPERSTAR',
    name: 'Adidas Superstar',
    visible: true,
    templateId: 1,
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
    visible: true,
    templateId: 2,
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
    visible: false,
    templateId: 1,
    sizes: [
      { size: 39, price: 279, quantity: 4 },
      { size: 40, price: 279, quantity: 6 },
    ],
  },
];

@Injectable()
export class MockShoeService {
  private data = [...MOCK_SHOES];

  getShoes(params: ShoeQueryParams = {}): Observable<PagedResult<Shoe>> {
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
      items: paged.map((i) => ({ ...i })),
      total,
      page,
      pageSize: size,
    };
    return of(result).pipe(delay(300));
  }

  getShoeById(id: number): Observable<Shoe> {
    const found = this.data.find((s) => s.id === id);
    if (!found) {
      return throwError(() => new Error(`Model o id ${id} nie istnieje`));
    }
    return of({ ...found, sizes: found.sizes.map((sz) => ({ ...sz })) }).pipe(
      delay(200)
    );
  }

  createShoe(dto: ShoeCreateDto): Observable<Shoe> {
    if (
      this.data.some((s) => s.code.toLowerCase() === dto.code.toLowerCase())
    ) {
      return throwError(() => new Error(`Kod ${dto.code} już istnieje`));
    }

    const newShoe: Shoe = {
      id: NEXT_ID++,
      code: dto.code,
      name: dto.name,
      visible: dto.visible,
      templateId: dto.templateId,
      sizes: dto.sizes.map((sz) => ({
        size: sz.size,
        price: sz.price,
        quantity: sz.quantity,
      })),
    };

    this.data.push(newShoe);
    return of({
      ...newShoe,
      sizes: newShoe.sizes.map((sz) => ({ ...sz })),
    }).pipe(delay(300));
  }

  updateShoe(id: number, dto: ShoeUpdateDto): Observable<Shoe> {
    const idx = this.data.findIndex((s) => s.id === id);
    if (idx < 0) {
      return throwError(() => new Error(`Model o id ${id} nie istnieje`));
    }

    if (
      this.data.some(
        (s) => s.id !== id && s.code.toLowerCase() === dto.code.toLowerCase()
      )
    ) {
      return throwError(() => new Error(`Kod ${dto.code} jest już używany`));
    }

    const updated: Shoe = {
      id,
      code: dto.code,
      name: dto.name,
      visible: dto.visible,
      templateId: dto.templateId,
      sizes: dto.sizes.map((sz) => ({
        size: sz.size,
        price: sz.price,
        quantity: sz.quantity,
      })),
    };

    this.data[idx] = updated;
    return of({
      ...updated,
      sizes: updated.sizes.map((sz) => ({ ...sz })),
    }).pipe(delay(300));
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
