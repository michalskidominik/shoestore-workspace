import { Injectable } from '@angular/core';
import { SizeTemplate } from '@shoestore/shared-models';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';

const MOCK_TEMPLATES: SizeTemplate[] = [
  {
    id: 1,
    name: 'EU 36–46',
    sizes: [36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46],
  },
  {
    id: 2,
    name: 'US 4–12',
    sizes: [4, 5, 6, 7, 8, 9, 10, 11, 12],
  },
  {
    id: 3,
    name: 'Dziecięca 25–35',
    sizes: [25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35],
  },
];

@Injectable()
export class MockSizeTemplateService {
  private data = [...MOCK_TEMPLATES];

  /**
   * Zwraca wszystkie mockowane szablony rozmiarówek.
   */
  getAllTemplates(): Observable<SizeTemplate[]> {
    return of(this.data).pipe(delay(200));
  }

  /**
   * Zwraca mockowany szablon o podanym ID lub błąd, jeśli nie istnieje.
   */
  getTemplateById(id: number): Observable<SizeTemplate> {
    const found = this.data.find((t) => t.id === id);
    if (!found) {
      return throwError(
        () => new Error(`SizeTemplate o id ${id} nie istnieje`)
      );
    }
    return of(found).pipe(delay(200));
  }

  /**
   * Tworzy nowy szablon (przypisując nowy ID).
   */
  createTemplate(dto: SizeTemplate): Observable<SizeTemplate> {
    const newId = this.data.length
      ? Math.max(...this.data.map((t) => t.id)) + 1
      : 1;
    const newTemplate: SizeTemplate = { ...dto, id: newId };
    this.data.push(newTemplate);
    return of(newTemplate).pipe(delay(200));
  }

  /**
   * Aktualizuje istniejący szablon.
   */
  updateTemplate(id: number, dto: SizeTemplate): Observable<SizeTemplate> {
    const index = this.data.findIndex((t) => t.id === id);
    if (index === -1) {
      return throwError(() => new Error(`Nie znaleziono SizeTemplate o id ${id}`));
    }
    this.data[index] = { ...dto, id };
    return of(this.data[index]).pipe(delay(200));
  }

  /**
   * Usuwa szablon o podanym ID.
   */
  delete(id: number): Observable<void> {
    const exists = this.data.some((t) => t.id === id);
    if (!exists) {
      return throwError(() => new Error(`SizeTemplate o id ${id} nie istnieje`));
    }
    this.data = this.data.filter((t) => t.id !== id);
    return of(undefined).pipe(delay(200));
  }
}
