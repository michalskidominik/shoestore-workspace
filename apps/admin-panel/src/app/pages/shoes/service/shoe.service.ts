import {
  HttpClient,
  HttpErrorResponse,
  HttpParams,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  BulkStockUpdateDto,
  PagedResult,
  Shoe,
  ShoeCreateDto,
  ShoeQueryParams,
  ShoeUpdateDto,
} from '@shoestore/shared-models';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class ShoeService {
  private readonly apiUrl = '/api/shoes';

  constructor(private http: HttpClient) {}

  // Mocking
  getRawData(): Shoe[] {
    return [];
  }

  /**
   * Pobiera listę modeli butów z serwera, z opcjonalnymi filtrami, sortowaniem i paginacją.
   */
  getShoes(params: ShoeQueryParams = {}): Observable<PagedResult<Shoe>> {
    let httpParams = new HttpParams();

    if (params.search) {
      httpParams = httpParams.set('search', params.search);
    }
    if (params.brand) {
      httpParams = httpParams.set('brand', params.brand);
    }
    if (params.minAvailability !== undefined) {
      httpParams = httpParams.set(
        'minAvailability',
        params.minAvailability.toString()
      );
    }
    if (params.sortBy) {
      httpParams = httpParams.set('sortBy', params.sortBy);
      httpParams = httpParams.set('sortDir', params.sortDirection || 'asc');
    }
    if (params.page !== undefined) {
      httpParams = httpParams.set('page', params.page.toString());
      httpParams = httpParams.set(
        'pageSize',
        (params.pageSize || 10).toString()
      );
    }

    return this.http
      .get<PagedResult<Shoe>>(this.apiUrl, { params: httpParams })
      .pipe(catchError(this.handleError));
  }

  /**
   * Pobiera pojedynczy model buta po jego ID.
   */
  getShoeById(id: number): Observable<Shoe> {
    return this.http
      .get<Shoe>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Tworzy nowy model buta. DTO wysyłane jako multipart/form-data.
   */
  createShoe(dto: ShoeCreateDto): Observable<Shoe> {
    const formData = this.buildFormData(dto);
    return this.http
      .post<Shoe>(this.apiUrl, formData)
      .pipe(catchError(this.handleError));
  }

  /**
   * Aktualizuje istniejący model buta (PUT). DTO jako multipart/form-data.
   */
  updateShoe(id: number, dto: ShoeUpdateDto): Observable<Shoe> {
    const formData = this.buildFormData(dto);
    return this.http
      .put<Shoe>(`${this.apiUrl}/${id}`, formData)
      .pipe(catchError(this.handleError));
  }

  /**
   * Usuwa model buta o podanym ID.
   */
  deleteShoe(id: number): Observable<void> {
    return this.http
      .delete<void>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Buduje obiekt FormData z ShoeCreateDto/ShoeUpdateDto,
   * aby móc wysłać obraz + pola tekstowe w jednym zapytaniu multipart.
   */
  private buildFormData(dto: ShoeCreateDto | ShoeUpdateDto): FormData {
    const formData = new FormData();
    formData.append('code', dto.code);
    formData.append('name', dto.name);
    formData.append('visible', dto.visible ? 'true' : 'false');

    // Dodaj templateId jako pole tekstowe
    formData.append('templateId', dto.templateId.toString());

    // Jeśli w DTO jest plik (File), dołącz go
    if ((dto as ShoeCreateDto).imageFile) {
      formData.append(
        'image',
        (dto as ShoeCreateDto).imageFile!,
        (dto as ShoeCreateDto).imageFile!.name
      );
    }

    // Rozmiary serializujemy jako JSON
    formData.append('sizes', JSON.stringify(dto.sizes));

    return formData;
  }

  bulkUpdateStock(dto: BulkStockUpdateDto): Observable<void> {
    return this.http
      .put<void>(`${this.apiUrl}/bulk‐stock‐update`, dto)
      .pipe(catchError(this.handleError));
  }

  /**
   * Obsługa błędów HTTP.
   */
  private handleError(error: HttpErrorResponse) {
    let errorMsg = 'Nieznany błąd sieciowy';
    if (error.error instanceof ErrorEvent) {
      // Błąd po stronie klienta
      errorMsg = `Błąd klienta: ${error.error.message}`;
    } else {
      // Błąd po stronie serwera
      errorMsg = `Kod ${error.status}: ${error.message}`;
    }
    return throwError(() => new Error(errorMsg));
  }
}
