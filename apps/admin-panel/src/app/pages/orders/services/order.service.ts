import {
  HttpClient,
  HttpErrorResponse,
  HttpParams,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  Order,
  OrderCreateDto,
  OrderQueryParams,
  OrderUpdateStatusDto,
  PagedResult,
} from '@shoestore/shared-models';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly apiUrl = '/api/orders';

  constructor(private http: HttpClient) {}

  /**
   * Pobiera listę zamówień z opcjonalnymi filtrami, sortowaniem i paginacją.
   */
  getOrders(params: OrderQueryParams = {}): Observable<PagedResult<Order>> {
    let httpParams = new HttpParams();
    if (params.status) {
      httpParams = httpParams.set('status', params.status);
    }
    if (params.search) {
      httpParams = httpParams.set('search', params.search);
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
      .get<PagedResult<Order>>(this.apiUrl, { params: httpParams })
      .pipe(catchError(this.handleError));
  }

  /**
   * Pobiera szczegóły jednego zamówienia (wraz z danymi użytkownika).
   */
  getOrderById(id: number): Observable<Order> {
    return this.http
      .get<Order>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Tworzy nowe zamówienie.
   */
  createOrder(dto: OrderCreateDto): Observable<Order> {
    return this.http
      .post<Order>(this.apiUrl, dto)
      .pipe(catchError(this.handleError));
  }

  /**
   * Aktualizuje status zamówienia (PATCH /orders/:id/status).
   */
  updateOrderStatus(id: number, dto: OrderUpdateStatusDto): Observable<Order> {
    return this.http
      .patch<Order>(`${this.apiUrl}/${id}/status`, dto)
      .pipe(catchError(this.handleError));
  }

  /**
   * Obsługa błędów HTTP.
   */
  private handleError(error: HttpErrorResponse) {
    let errorMsg = 'Nieznany błąd sieciowy';
    if (error.error instanceof ErrorEvent) {
      errorMsg = `Błąd klienta: ${error.error.message}`;
    } else {
      errorMsg = `Kod ${error.status}: ${error.message}`;
    }
    return throwError(() => new Error(errorMsg));
  }
}
