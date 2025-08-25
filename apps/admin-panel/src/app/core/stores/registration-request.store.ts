import { signalStore, withState, withMethods, patchState, withComputed } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { inject, computed } from '@angular/core';
import { 
  RegistrationRequestDocument, 
  RegistrationRequestUpdateDto,
  UserCredentials
} from '@shoestore/shared-models';
import { RegistrationRequestService } from '../../services/registration-request.service';

interface RegistrationRequestState {
  requests: RegistrationRequestDocument[];
  isLoading: boolean;
  error: string | null;
  selectedRequest: RegistrationRequestDocument | null;
  lastActionResult: { 
    success: boolean; 
    message?: string; 
    credentials?: UserCredentials 
  } | null;
}

const initialState: RegistrationRequestState = {
  requests: [],
  isLoading: false,
  error: null,
  selectedRequest: null,
  lastActionResult: null
};

export const RegistrationRequestStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => ({
    pendingRequests: computed(() => 
      store.requests().filter(req => req.status === 'pending')
    ),
    approvedRequests: computed(() => 
      store.requests().filter(req => req.status === 'approved')
    ),
    rejectedRequests: computed(() => 
      store.requests().filter(req => req.status === 'rejected')
    ),
    requestCounts: computed(() => {
      const requests = store.requests();
      return {
        total: requests.length,
        pending: requests.filter(req => req.status === 'pending').length,
        approved: requests.filter(req => req.status === 'approved').length,
        rejected: requests.filter(req => req.status === 'rejected').length
      };
    })
  })),
  withMethods((store) => {
    const registrationService = inject(RegistrationRequestService);

    return {
      // Load all registration requests
      loadRequests: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { 
            isLoading: true, 
            error: null 
          })),
          switchMap(() =>
            registrationService.getRegistrationRequests().pipe(
              tapResponse({
                next: (requests) => patchState(store, {
                  requests,
                  isLoading: false
                }),
                error: (error: Error) => patchState(store, {
                  error: error.message || 'Failed to load registration requests',
                  isLoading: false
                })
              })
            )
          )
        )
      ),

      // Approve a registration request
      approveRequest: rxMethod<{ id: string; reviewedBy: string; notes?: string }>(
        pipe(
          tap(() => patchState(store, { 
            isLoading: true, 
            error: null,
            lastActionResult: null
          })),
          switchMap(({ id, reviewedBy, notes }) =>
            registrationService.approveRequest(id, reviewedBy, notes).pipe(
              tapResponse({
                next: (result) => {
                  // Update the request in the store
                  const updatedRequests = store.requests().map(req => 
                    req.id === id 
                      ? { 
                          ...req, 
                          status: 'approved' as const, 
                          reviewedBy,
                          reviewedAt: new Date(),
                          notes
                        }
                      : req
                  );
                  
                  patchState(store, {
                    requests: updatedRequests,
                    isLoading: false,
                    lastActionResult: result
                  });
                },
                error: (error: Error) => patchState(store, {
                  error: error.message || 'Failed to approve request',
                  isLoading: false
                })
              })
            )
          )
        )
      ),

      // Reject a registration request
      rejectRequest: rxMethod<{ 
        id: string; 
        reviewedBy: string; 
        rejectionReason: string; 
        notes?: string 
      }>(
        pipe(
          tap(() => patchState(store, { 
            isLoading: true, 
            error: null,
            lastActionResult: null
          })),
          switchMap(({ id, reviewedBy, rejectionReason, notes }) =>
            registrationService.rejectRequest(id, reviewedBy, rejectionReason, notes).pipe(
              tapResponse({
                next: (result) => {
                  // Update the request in the store
                  const updatedRequests = store.requests().map(req => 
                    req.id === id 
                      ? { 
                          ...req, 
                          status: 'rejected' as const, 
                          reviewedBy,
                          reviewedAt: new Date(),
                          rejectionReason,
                          notes
                        }
                      : req
                  );
                  
                  patchState(store, {
                    requests: updatedRequests,
                    isLoading: false,
                    lastActionResult: result
                  });
                },
                error: (error: Error) => patchState(store, {
                  error: error.message || 'Failed to reject request',
                  isLoading: false
                })
              })
            )
          )
        )
      ),

      // Select a request for detailed view
      selectRequest(request: RegistrationRequestDocument | null): void {
        patchState(store, { selectedRequest: request });
      },

      // Clear error state
      clearError(): void {
        patchState(store, { error: null });
      },

      // Clear last action result
      clearActionResult(): void {
        patchState(store, { lastActionResult: null });
      }
    };
  })
);