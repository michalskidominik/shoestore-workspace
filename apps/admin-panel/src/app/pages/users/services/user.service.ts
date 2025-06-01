import {
  HttpClient,
  HttpErrorResponse,
  HttpParams,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { PagedResult, User } from '@shoestore/shared-models';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly apiUrl = '/api/users';

  constructor(private http: HttpClient) {}

  /**
   * Pobiera listę użytkowników (klientów B2B).
   * @param params opcjonalnie paginacja, filtrowanie
   */
  getUsers(
    params: { page?: number; pageSize?: number; search?: string } = {}
  ): Observable<PagedResult<User>> {
    let httpParams = new HttpParams();
    if (params.page != null)
      httpParams = httpParams.set('page', params.page.toString());
    if (params.pageSize != null)
      httpParams = httpParams.set('pageSize', params.pageSize.toString());
    if (params.search) httpParams = httpParams.set('search', params.search);

    return this.http
      .get<PagedResult<User>>(this.apiUrl, { params: httpParams })
      .pipe(catchError(this.handleError));
  }

  /**
   * Pobiera szczegóły pojedynczego użytkownika.
   */
  getUserById(id: number): Observable<User> {
    return this.http
      .get<User>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    let msg = 'Nieznany błąd sieciowy';
    if (error.error instanceof ErrorEvent) {
      msg = `Błąd klienta: ${error.error.message}`;
    } else {
      msg = `Kod ${error.status}: ${error.message}`;
    }
    return throwError(() => new Error(msg));
  }
}
