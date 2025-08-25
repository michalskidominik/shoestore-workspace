import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  RegistrationRequestDocument, 
  RegistrationRequestUpdateDto,
  UserCredentials,
  ApiResponse 
} from '@shoestore/shared-models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RegistrationRequestService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  /**
   * Get all registration requests
   */
  getRegistrationRequests(): Observable<RegistrationRequestDocument[]> {
    return this.http.get<RegistrationRequestDocument[]>(`${this.apiUrl}/auth/registration-requests`);
  }

  /**
   * Update registration request status (approve or reject)
   */
  updateRegistrationRequest(
    id: string, 
    update: RegistrationRequestUpdateDto
  ): Observable<{ success: boolean; message?: string; credentials?: UserCredentials }> {
    return this.http.put<{ success: boolean; message?: string; credentials?: UserCredentials }>(
      `${this.apiUrl}/auth/registration-requests/${id}`, 
      update
    );
  }

  /**
   * Approve registration request
   */
  approveRequest(
    id: string, 
    reviewedBy: string, 
    notes?: string
  ): Observable<{ success: boolean; message?: string; credentials?: UserCredentials }> {
    return this.updateRegistrationRequest(id, {
      status: 'approved',
      reviewedBy,
      notes
    });
  }

  /**
   * Reject registration request
   */
  rejectRequest(
    id: string, 
    reviewedBy: string, 
    rejectionReason: string, 
    notes?: string
  ): Observable<{ success: boolean; message?: string; credentials?: UserCredentials }> {
    return this.updateRegistrationRequest(id, {
      status: 'rejected',
      reviewedBy,
      rejectionReason,
      notes
    });
  }
}