// apps/admin-panel/src/app/service/size-template.service.ts

import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { SizeTemplate } from '@shoestore/shared-models';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class SizeTemplateService {
  private readonly apiUrl = '/api/size-templates';

  constructor(private http: HttpClient) {}

  getAllTemplates(): Observable<SizeTemplate[]> {
    return this.http
      .get<SizeTemplate[]>(this.apiUrl)
      .pipe(catchError(this.handleError));
  }

  getTemplateById(id: number): Observable<SizeTemplate> {
    return this.http
      .get<SizeTemplate>(`${this.apiUrl}/${encodeURIComponent(id)}`)
      .pipe(catchError(this.handleError));
  }

  createTemplate(dto: SizeTemplate): Observable<SizeTemplate> {
    return this.http
      .post<SizeTemplate>(this.apiUrl, dto)
      .pipe(catchError(this.handleError));
  }

  updateTemplate(id: number, dto: SizeTemplate): Observable<SizeTemplate> {
    return this.http
      .put<SizeTemplate>(`${this.apiUrl}/${encodeURIComponent(id)}`, dto)
      .pipe(catchError(this.handleError));
  }

  delete(id: number): Observable<void> {
    return this.http
      .delete<void>(`${this.apiUrl}/${encodeURIComponent(id)}`)
      .pipe(catchError(this.handleError));
  }

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
