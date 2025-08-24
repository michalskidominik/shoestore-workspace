import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { RegistrationRequestStore } from '../../core/stores/registration-request.store';

@Component({
  selector: 'app-request-access-success',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ButtonModule,
    CardModule
  ],
  templateUrl: './request-access-success.component.html',
  styleUrl: './request-access-success.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RequestAccessSuccessComponent {
  private registrationStore = inject(RegistrationRequestStore);

  readonly lastSubmission = this.registrationStore.lastSubmission;
}
