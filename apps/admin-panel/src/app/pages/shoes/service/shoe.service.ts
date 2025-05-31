import {
  HttpClient,
  HttpErrorResponse,
  HttpParams,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { PagedResult, Shoe, ShoeQueryParams } from '@shoestore/shared-models';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';



@Injectable({ providedIn: 'root' })
export class ShoeService {
  private readonly apiUrl = '/api/shoes';

  constructor(private http: HttpClient) {}

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
   * Usuwa model buta o podanym ID.
   */
  deleteShoe(id: number): Observable<void> {
    return this.http
      .delete<void>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Obsługa błędów HTTP.
   */
  private handleError(error: HttpErrorResponse) {
    // Można dodać globalny serwis logowania błędów
    let errorMsg = 'Nieznany błąd sieciowy';
    if (error.error instanceof ErrorEvent) {
      // Błąd po stronie klienta
      errorMsg = `Błąd klienta: ${error.error.message}`;
    } else {
      // Błąd po stronie serwera
      errorMsg = `Kod ${error.status}: ${error.message}`;
    }
    // Dodatkowo można skorzystać z serwisu Toast do wyświetlenia
    return throwError(() => new Error(errorMsg));
  }
}
