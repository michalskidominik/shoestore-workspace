// set-price-dialog.component.ts
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-set-price-dialog',
  standalone: true,
  imports: [CommonModule, DialogModule, FormsModule, InputNumberModule, ButtonModule],
  template: `
    <p-dialog
      header="Ustaw cenę dla wszystkich"
      [(visible)]="visible"
      [modal]="true"
      [closable]="true"
      [dismissableMask]="true"
      [style]="{ width: '350px' }"
      (onHide)="onCancelClick()"
    >
      <div class="space-y-4">
        <p-inputNumber
          [(ngModel)]="price"
          [autofocus]="true"
          [showClear]="true"
          [mode]="'currency'"
          currency="EUR"
          locale="pl-PL"
          [min]="0"
          inputId="price"
          placeholder="Cena"
          class="w-full"
        ></p-inputNumber>

        <div class="flex justify-end space-x-2">
          <!-- eslint-disable-next-line @angular-eslint/template/elements-content -->
          <button
            pButton
            label="Anuluj"
            icon="pi pi-times"
            class="p-button-text"
            (click)="onCancelClick()"
          ></button>
          <!-- eslint-disable-next-line @angular-eslint/template/elements-content -->
          <button
            pButton
            label="Zastosuj"
            icon="pi pi-check"
            class="p-button-primary"
            (click)="onConfirmClick()"
            [disabled]="price === null || price < 0"
          ></button>
        </div>
      </div>
    </p-dialog>
  `,
})
export class SetPriceDialogComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() priceSet = new EventEmitter<number>();

  price: number | null = null;

  onCancelClick() {
    this.visible = false;
    this.price = null; // Reset price when dialog is closed
    this.visibleChange.emit(false);
  }

  onConfirmClick() {
    if (this.price !== null && this.price >= 0) {
      this.priceSet.emit(this.price);
      this.onCancelClick();
    }
  }
}
