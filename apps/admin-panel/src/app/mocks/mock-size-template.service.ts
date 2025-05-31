import { Injectable } from '@angular/core';
import { SizeTemplate } from '@shoestore/shared-models';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';

const MOCK_TEMPLATES: SizeTemplate[] = [
  {
    id: 1,
    name: 'EU 36–46 ↔ US 4–12',
    pairs: [
      { eu: 36, us: 4 },
      { eu: 37, us: 4.5 },
      { eu: 38, us: 5 },
      { eu: 39, us: 6 },
      { eu: 40, us: 7 },
      { eu: 41, us: 8 },
      { eu: 42, us: 8.5 },
      { eu: 43, us: 9 },
      { eu: 44, us: 10 },
      { eu: 45, us: 11 },
      { eu: 46, us: 12 },
    ],
  },
  {
    id: 2,
    name: 'Tylko EU 30–35',
    pairs: [
      { eu: 30, us: undefined },
      { eu: 31, us: undefined },
      { eu: 32, us: undefined },
      { eu: 33, us: undefined },
      { eu: 34, us: undefined },
      { eu: 35, us: undefined },
    ],
  },
  {
    id: 3,
    name: 'Kids EU 25–30 ↔ US Kids 8–12',
    pairs: [
      { eu: 25, us: 8 },
      { eu: 26, us: 8.5 },
      { eu: 27, us: 9 },
      { eu: 28, us: 9.5 },
      { eu: 29, us: 10 },
      { eu: 30, us: 10.5 },
    ],
  },
];

@Injectable()
export class MockSizeTemplateService {
  private data = [...MOCK_TEMPLATES];

  getAllTemplates(): Observable<SizeTemplate[]> {
    return of(
      this.data.map((t) => ({
        ...t,
        pairs: t.pairs.map((p) => ({ ...p })),
      }))
    ).pipe(delay(200));
  }

  getTemplateById(id: number): Observable<SizeTemplate> {
    const found = this.data.find((t) => t.id === id);
    if (!found) {
      return throwError(
        () => new Error(`SizeTemplate o id ${id} nie istnieje`)
      );
    }
    return of({
      ...found,
      pairs: found.pairs.map((p) => ({ ...p })),
    }).pipe(delay(200));
  }

  createTemplate(dto: SizeTemplate): Observable<SizeTemplate> {
    const newId = this.data.length
      ? Math.max(...this.data.map((t) => t.id)) + 1
      : 1;
    const newTpl: SizeTemplate = {
      id: newId,
      name: dto.name,
      pairs: dto.pairs.map((p) => ({ eu: p.eu, us: p.us })),
    };
    this.data.push(newTpl);
    return of(newTpl).pipe(delay(200));
  }

  updateTemplate(id: number, dto: SizeTemplate): Observable<SizeTemplate> {
    const idx = this.data.findIndex((t) => t.id === id);
    if (idx === -1) {
      return throwError(
        () => new Error(`SizeTemplate o id ${id} nie istnieje`)
      );
    }
    const updated: SizeTemplate = {
      id,
      name: dto.name,
      pairs: dto.pairs.map((p) => ({ eu: p.eu, us: p.us })),
    };
    this.data[idx] = updated;
    return of(updated).pipe(delay(200));
  }

  delete(id: number): Observable<void> {
    const exists = this.data.some((t) => t.id === id);
    if (!exists) {
      return throwError(
        () => new Error(`SizeTemplate o id ${id} nie istnieje`)
      );
    }
    this.data = this.data.filter((t) => t.id !== id);
    return of(undefined).pipe(delay(200));
  }
}
