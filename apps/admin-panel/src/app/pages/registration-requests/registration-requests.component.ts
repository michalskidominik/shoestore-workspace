import { Component, inject, OnInit, ChangeDetectionStrategy, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

// PrimeNG imports
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextarea } from 'primeng/inputtextarea';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { FieldsetModule } from 'primeng/fieldset';

import { ConfirmationService, MessageService } from 'primeng/api';
import { RegistrationRequestStore } from '../../core/stores/registration-request.store';
import { RegistrationRequestDocument, UserCredentials } from '@shoestore/shared-models';

@Component({
  selector: 'app-registration-requests',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    TagModule,
    DialogModule,
    InputTextModule,
    InputTextarea,
    ToastModule,
    ConfirmDialogModule,
    CardModule,
    DividerModule,
    FieldsetModule
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './registration-requests.component.html',
  styleUrl: './registration-requests.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegistrationRequestsComponent implements OnInit {
  private readonly store = inject(RegistrationRequestStore);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);
  private readonly fb = inject(FormBuilder);

  // Store selectors
  readonly requests = this.store.requests;
  readonly isLoading = this.store.isLoading;
  readonly error = this.store.error;
  readonly requestCounts = this.store.requestCounts;
  readonly lastActionResult = this.store.lastActionResult;

  // Dialog state
  readonly showRejectDialog = signal(false);
  readonly showCredentialsDialog = signal(false);
  readonly selectedRequest = signal<RegistrationRequestDocument | null>(null);
  readonly generatedCredentials = signal<UserCredentials | null>(null);

  // Forms
  rejectForm: FormGroup;

  constructor() {
    this.rejectForm = this.fb.group({
      rejectionReason: ['', [Validators.required, Validators.minLength(10)]],
      notes: ['']
    });
  }

  ngOnInit(): void {
    // Load requests on component init
    this.store.loadRequests();

    // Watch for action results to show credentials or messages
    effect(() => {
      const result = this.store.lastActionResult();
      if (result) {
        if (result.success && result.credentials) {
          this.generatedCredentials.set(result.credentials);
          this.showCredentialsDialog.set(true);
        }
        
        if (result.message) {
          if (result.success) {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: result.message
            });
          } else {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: result.message
            });
          }
        }
      }
    });
  }

  /**
   * Get severity for status tag
   */
  getStatusSeverity(status: string): 'success' | 'info' | 'warning' | 'danger' {
    switch (status) {
      case 'approved': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'danger';
      default: return 'info';
    }
  }

  /**
   * Approve a registration request
   */
  approveRequest(request: RegistrationRequestDocument): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to approve the registration request for ${request.companyName}?`,
      header: 'Confirm Approval',
      icon: 'pi pi-check-circle',
      acceptButtonStyleClass: 'p-button-success',
      accept: () => {
        // TODO: Get current admin user ID from auth store
        const adminUserId = 'current-admin'; // Replace with actual admin ID
        this.store.approveRequest({ 
          id: request.id, 
          reviewedBy: adminUserId,
          notes: `Approved by admin on ${new Date().toISOString()}`
        });
      }
    });
  }

  /**
   * Start rejection process
   */
  startRejectRequest(request: RegistrationRequestDocument): void {
    this.selectedRequest.set(request);
    this.rejectForm.reset();
    this.showRejectDialog.set(true);
  }

  /**
   * Submit rejection
   */
  submitRejection(): void {
    if (this.rejectForm.valid && this.selectedRequest()) {
      const formValue = this.rejectForm.value;
      const request = this.selectedRequest()!;
      
      // TODO: Get current admin user ID from auth store
      const adminUserId = 'current-admin'; // Replace with actual admin ID
      
      this.store.rejectRequest({
        id: request.id,
        reviewedBy: adminUserId,
        rejectionReason: formValue.rejectionReason,
        notes: formValue.notes
      });

      this.showRejectDialog.set(false);
      this.selectedRequest.set(null);
    }
  }

  /**
   * Close credentials dialog
   */
  closeCredentialsDialog(): void {
    this.showCredentialsDialog.set(false);
    this.generatedCredentials.set(null);
    this.store.clearActionResult();
  }

  /**
   * Copy credentials to clipboard
   */
  copyCredentials(): void {
    const credentials = this.generatedCredentials();
    if (credentials) {
      const text = `Email: ${credentials.email}\nPassword: ${credentials.temporaryPassword}`;
      navigator.clipboard.writeText(text).then(() => {
        this.messageService.add({
          severity: 'info',
          summary: 'Copied',
          detail: 'Credentials copied to clipboard'
        });
      });
    }
  }

  /**
   * Format date for display
   */
  formatDate(date: Date | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString() + ' ' + new Date(date).toLocaleTimeString();
  }

  /**
   * Refresh requests
   */
  refreshRequests(): void {
    this.store.loadRequests();
  }

  /**
   * View request details
   */
  viewRequestDetails(request: RegistrationRequestDocument): void {
    this.selectedRequest.set(request);
    // TODO: Implement detailed view dialog or navigate to detail page
    console.log('Viewing request details:', request);
  }
}