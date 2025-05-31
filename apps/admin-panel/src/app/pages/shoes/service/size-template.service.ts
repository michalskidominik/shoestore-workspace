import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { SizeTemplate } from '@shoestore/shared-models';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class SizeTemplateService {
  private readonly apiUrl = '/api/size-templates';

  constructor(private http: HttpClient) {}

  /**
   * Pobiera wszystkie dostępne szablony rozmiarówek z serwera.
   */
  getAllTemplates(): Observable<SizeTemplate[]> {
    return this.http
      .get<SizeTemplate[]>(this.apiUrl)
      .pipe(catchError(this.handleError));
  }

  /**
   * Pobiera szczegóły jednego szablonu po jego ID.
   */
  getTemplateById(id: number): Observable<SizeTemplate> {
    return this.http
      .get<SizeTemplate>(`${this.apiUrl}/${encodeURIComponent(id)}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Tworzy nowy szablon rozmiarówki.
   */
  createTemplate(dto: SizeTemplate): Observable<SizeTemplate> {
    return this.http
      .post<SizeTemplate>(this.apiUrl, dto)
      .pipe(catchError(this.handleError));
  }

  /**
   * Aktualizuje istniejący szablon rozmiarówki.
   */
  updateTemplate(id: number, dto: SizeTemplate): Observable<SizeTemplate> {
    return this.http
      .put<SizeTemplate>(`${this.apiUrl}/${encodeURIComponent(id)}`, dto)
      .pipe(catchError(this.handleError));
  }

  /**
   * Usuwa szablon rozmiarówki o podanym ID.
   */
  delete(id: number): Observable<void> {
    return this.http
      .delete<void>(`${this.apiUrl}/${encodeURIComponent(id)}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Obsługa błędów HTTP (zwraca Observable błędu).
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
