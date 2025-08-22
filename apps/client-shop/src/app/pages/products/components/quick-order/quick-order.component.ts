import { CommonModule } from '@angular/common';
import { Component, input, output, signal, computed, ChangeDetectionStrategy, inject, effect } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';
import { Shoe, SizeAvailability } from '@shoestore/shared-models';

export interface QuickOrderData {
  productId: number;
  items: { size: number; quantity: number; unitPrice: number }[];
}

@Component({
  selector: 'app-quick-order',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    InputNumberModule,
    ProgressSpinnerModule,
    TagModule
  ],
  template: `
    <div class="quick-order-form bg-white border-2 border-slate-200 rounded-2xl shadow-xl p-6 mt-4">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <i class="pi pi-shopping-cart text-blue-600 text-sm"></i>
          </div>
          <h4 class="text-lg font-bold text-slate-900">Quick Order</h4>
        </div>
        <p-button
          icon="pi pi-times"
          severity="secondary"
          [text]="true"
          size="small"
          (onClick)="onCancel()"
          [attr.aria-label]="'Close quick order form'"
          styleClass="!w-8 !h-8 !p-0 hover:!bg-slate-100 !transition-colors">
        </p-button>
      </div>

      <!-- Product Info -->
      <div class="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
        <h5 class="text-sm font-bold text-slate-900 mb-1">{{ product().name }}</h5>
        <p class="text-sm text-slate-600 font-medium">{{ product().code }}</p>
      </div>

      @if (isFormReady()) {
        <!-- Quick Fill All Sizes -->
        <div class="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
          <div class="flex items-center gap-2 mb-3">
            <div class="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
              <i class="pi pi-copy text-blue-600 text-xs"></i>
            </div>
            <span class="text-sm font-semibold text-slate-800">Quick Fill All Sizes</span>
          </div>

          <div class="space-y-3">
            <!-- Input Row -->
            <div class="flex items-center gap-3">
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <span class="text-xs font-medium text-slate-600 w-12 flex-shrink-0">Qty:</span>
                  <p-inputNumber
                    id="applyToAll"
                    [(ngModel)]="applyToAllQuantity"
                    [showButtons]="true"
                    [min]="0"
                    [max]="100"
                    [step]="1"
                    inputId="apply-to-all"
                    styleClass="compact-input flex-1"
                    placeholder="0">
                  </p-inputNumber>
                </div>
              </div>
              <div class="text-xs text-slate-500 text-right min-w-0">
                <span class="truncate">for all available sizes</span>
              </div>
            </div>

            <!-- Action Button -->
            <div class="flex justify-center pt-1">
              <p-button
                label="Apply to All Sizes"
                icon="pi pi-check-circle"
                size="small"
                [disabled]="!applyToAllQuantity() || applyToAllQuantity() === 0"
                (onClick)="onApplyToAll()"
                styleClass="!bg-blue-600 !border-blue-600 hover:!bg-blue-700 !text-white !font-medium !px-6 !py-2 !rounded-lg !shadow-sm hover:!shadow-md !transition-all">
              </p-button>
            </div>

            <p class="text-xs text-slate-500 text-center">
              Sets the same quantity for all available sizes
            </p>
          </div>
        </div>
      }

      <!-- Size Quantities Form -->
      <form [formGroup]="quickOrderForm" (ngSubmit)="onSubmit()">
        @if (isFormReady()) {
          <div formArrayName="sizes">
            <div class="space-y-2 mb-6 max-h-56 overflow-y-auto">
              @for (sizeControl of sizeFormControls(); track $index) {
                <div class="flex items-center gap-2 py-2 px-3 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors duration-200">
                  <!-- Size -->
                  <div class="w-12 flex-shrink-0">
                    <span class="text-sm font-bold text-slate-800">
                      {{ getSizeDisplay(getAvailableSizes()[$index]) }}
                    </span>
                  </div>

                  <!-- Price -->
                  <div class="w-16 flex-shrink-0">
                    <span class="text-xs font-medium text-blue-600">
                      €{{ getAvailableSizes()[$index].price.toFixed(2) }}
                    </span>
                  </div>

                  <!-- Stock Status -->
                  <div class="flex-1 min-w-0">
                    @if (getAvailableSizes()[$index].quantity === 0) {
                      <div class="flex items-center gap-1">
                        <div class="w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0"></div>
                        <span class="text-xs text-red-600 truncate">Out of stock</span>
                      </div>
                    } @else if (getAvailableSizes()[$index].quantity <= 5) {
                      <div class="flex items-center gap-1">
                        <div class="w-1.5 h-1.5 bg-orange-500 rounded-full flex-shrink-0"></div>
                        <span class="text-xs text-orange-600 truncate">
                          {{ getAvailableSizes()[$index].quantity }} left
                        </span>
                      </div>
                    } @else {
                      <div class="flex items-center gap-1">
                        <div class="w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0"></div>
                        <span class="text-xs text-green-600 truncate">
                          {{ getAvailableSizes()[$index].quantity }}
                        </span>
                      </div>
                    }
                  </div>

                  <!-- Quantity Input -->
                  <div class="w-16 flex-shrink-0">
                    <p-inputNumber
                      [formControlName]="$index"
                      [showButtons]="true"
                      [min]="0"
                      [max]="getAvailableSizes()[$index].quantity"
                      [step]="1"
                      styleClass="compact-input"
                      placeholder="0"
                      [disabled]="getAvailableSizes()[$index].quantity === 0">
                    </p-inputNumber>
                  </div>
                </div>
              }
            </div>

            <!-- Validation Errors -->
            @if (hasValidationErrors()) {
              <div class="mb-4 p-3 bg-red-50 border-l-4 border-red-400 rounded-md">
                <div class="flex items-center">
                  <i class="pi pi-exclamation-triangle text-red-400 mr-2"></i>
                  <span class="text-sm text-red-700 font-medium">{{ getValidationMessage() }}</span>
                </div>
              </div>
            }

            <!-- Order Summary -->
            <div class="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <i class="pi pi-calculator text-blue-600"></i>
                  <span class="text-sm font-semibold text-slate-800">Order Total</span>
                </div>
                <div class="text-right">
                  <div class="text-xl font-bold text-blue-700">€{{ getTotalPrice().toFixed(2) }}</div>
                  <div class="text-sm text-slate-600">
                    {{ getTotalQuantity() }} {{ getTotalQuantity() === 1 ? 'item' : 'items' }}
                  </div>
                </div>
              </div>
              @if (getTotalQuantity() > 0) {
                <div class="mt-3 pt-3 border-t border-blue-200">
                  <div class="flex items-center gap-1 text-xs text-blue-600">
                    <i class="pi pi-info-circle"></i>
                    <span>Items will be added to your cart</span>
                  </div>
                </div>
              }
            </div>

            <!-- Action Buttons -->
            <div class="flex gap-3">
              <p-button
                type="button"
                label="Cancel"
                severity="secondary"
                [outlined]="true"
                styleClass="!text-sm !py-3 !px-6 flex-1 !font-medium"
                (onClick)="onCancel()">
              </p-button>
              <p-button
                type="submit"
                label="Add to Cart"
                icon="pi pi-shopping-cart"
                severity="primary"
                [disabled]="!canSubmit() || isSubmitting()"
                [loading]="isSubmitting()"
                styleClass="!text-sm !py-3 !px-6 flex-2 !font-semibold !shadow-lg hover:!shadow-xl !transition-all !duration-200">
              </p-button>
            </div>
          </div>
        } @else {
          <div class="flex items-center justify-center py-12">
            <div class="text-center">
              <div class="mb-4">
                <p-progressSpinner
                  styleClass="!w-12 !h-12"
                  strokeWidth="3"
                  fill="transparent"
                  animationDuration="1s">
                </p-progressSpinner>
              </div>
              <h3 class="text-sm font-semibold text-slate-700 mb-2">Loading sizes...</h3>
              <p class="text-xs text-slate-500">Please wait while we prepare your options</p>
            </div>
          </div>
        }
      </form>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .quick-order-form {
      animation: slideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      backdrop-filter: blur(8px);
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-20px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    /* Compact input styling */
    :host ::ng-deep .compact-input .p-inputnumber {
      width: 64px !important;
    }

    :host ::ng-deep .compact-input .p-inputnumber-input {
      padding: 4px 20px 4px 6px !important;
      font-size: 12px !important;
      text-align: center !important;
      width: 100% !important;
      border-radius: 6px !important;
    }

    :host ::ng-deep .compact-input .p-inputnumber-button-group {
      display: flex !important;
      flex-direction: column !important;
      position: absolute !important;
      right: 1px !important;
      top: 1px !important;
      bottom: 1px !important;
      width: 18px !important;
    }

    :host ::ng-deep .compact-input .p-inputnumber-button {
      width: 18px !important;
      height: 50% !important;
      padding: 0 !important;
      margin: 0 !important;
      border: none !important;
      background: #f1f5f9 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      border-radius: 0 !important;
    }

    :host ::ng-deep .compact-input .p-inputnumber-button:hover {
      background: #e2e8f0 !important;
    }

    :host ::ng-deep .compact-input .p-inputnumber-button:first-child {
      border-top-right-radius: 5px !important;
    }

    :host ::ng-deep .compact-input .p-inputnumber-button:last-child {
      border-bottom-right-radius: 5px !important;
    }

    :host ::ng-deep .compact-input .p-inputnumber-button .p-button-icon {
      font-size: 8px !important;
      color: #64748b !important;
    }

    /* Flex-2 utility class for buttons */
    .flex-2 {
      flex: 2;
    }

    /* Enhanced hover effects */
    .quick-order-form .hover\\:border-slate-200:hover {
      transform: translateY(-1px);
    }

    /* Input focus improvements */
    :host ::ng-deep .p-inputnumber input:focus {
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
      border-color: #3b82f6;
    }

    /* Button hover enhancements */
    :host ::ng-deep .p-button:hover {
      transform: translateY(-1px);
    }

    :host ::ng-deep .p-button:active {
      transform: translateY(0);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QuickOrderComponent {
  // Inputs
  readonly product = input.required<Shoe>();
  readonly sizeSystem = input<'eu' | 'us'>('eu');
  readonly isSubmitting = input<boolean>(false);

  // Outputs
  readonly addToCart = output<QuickOrderData>();
  readonly cancelOrder = output<void>();

  // Form and state management
  private readonly fb = inject(FormBuilder);
  protected readonly quickOrderForm: FormGroup;
  protected readonly applyToAllQuantity = signal<number>(0);

  // Computed values
  protected readonly availableSizes = computed(() => {
    const shoe = this.product();
    if (!shoe || !shoe.sizes || shoe.sizes.length === 0) return [];
    return shoe.sizes
      .filter(size => size.quantity >= 0) // Include out-of-stock items but show them as disabled
      .sort((a, b) => a.size - b.size);
  });

  protected readonly isFormReady = computed(() => {
    const sizes = this.availableSizes();
    const sizesArray = this.quickOrderForm.get('sizes') as FormArray;
    return sizes.length > 0 && sizesArray && sizesArray.controls.length === sizes.length;
  });

  protected readonly sizeFormControls = computed(() => {
    if (!this.isFormReady()) return [];
    const sizesArray = this.quickOrderForm.get('sizes') as FormArray;
    return sizesArray.controls;
  });

  constructor() {
    // Initialize form with empty size controls
    this.quickOrderForm = this.fb.group({
      sizes: this.fb.array([])
    });

    // Set up form controls when product input becomes available
    effect(() => {
      // This effect will run when the product input changes
      const product = this.product();
      if (product) {
        this.setupSizeControls();
      }
    });

    // Handle enabling/disabling controls when isSubmitting changes
    effect(() => {
      const submitting = this.isSubmitting();
      const sizesArray = this.quickOrderForm.get('sizes') as FormArray;

      if (sizesArray && sizesArray.controls.length > 0) {
        sizesArray.controls.forEach((control, index) => {
          const sizes = this.availableSizes();
          if (sizes[index]) {
            const size = sizes[index];
            const shouldDisable = size.quantity === 0 || submitting;
            if (shouldDisable && control.enabled) {
              control.disable();
            } else if (!shouldDisable && control.disabled) {
              control.enable();
            }
          }
        });
      }
    });
  }

  private setupSizeControls(): void {
    const sizesArray = this.quickOrderForm.get('sizes') as FormArray;
    sizesArray.clear();

    this.availableSizes().forEach((size) => {
      const isDisabled = size.quantity === 0 || this.isSubmitting();
      const control = this.fb.control(
        { value: 0, disabled: isDisabled },
        [
          Validators.min(0),
          Validators.max(size.quantity)
        ]
      );
      sizesArray.push(control);
    });
  }

  protected getAvailableSizes(): SizeAvailability[] {
    return this.availableSizes();
  }

  protected getSizeDisplay(size: SizeAvailability): string {
    // For now, just show EU size. Can be enhanced with US conversion later
    return `${size.size} EU`;
  }

  protected onApplyToAll(): void {
    const quantity = this.applyToAllQuantity();
    const sizesArray = this.quickOrderForm.get('sizes') as FormArray;
    const sizes = this.availableSizes();

    if (sizesArray && sizes.length > 0) {
      sizesArray.controls.forEach((control, index) => {
        const availableSize = sizes[index];
        if (availableSize && availableSize.quantity > 0) {
          const maxQuantity = Math.min(quantity, availableSize.quantity);
          control.setValue(maxQuantity);
        }
      });
    }
  }

  protected getTotalQuantity(): number {
    if (!this.isFormReady()) return 0;
    const sizesArray = this.quickOrderForm.get('sizes') as FormArray;
    return sizesArray.value.reduce((total: number, quantity: number) => total + (quantity || 0), 0);
  }

  protected getTotalPrice(): number {
    const sizesArray = this.quickOrderForm.get('sizes') as FormArray;
    const sizes = this.availableSizes();

    if (!sizesArray || sizes.length === 0) return 0;

    return sizesArray.value.reduce((total: number, quantity: number, index: number) => {
      const size = sizes[index];
      return size ? total + ((quantity || 0) * size.price) : total;
    }, 0);
  }

  protected canSubmit(): boolean {
    return this.isFormReady() && this.getTotalQuantity() > 0 && this.quickOrderForm.valid;
  }

  protected hasValidationErrors(): boolean {
    return this.quickOrderForm.invalid && this.quickOrderForm.touched;
  }

  protected getValidationMessage(): string {
    if (!this.quickOrderForm.valid) {
      const sizesArray = this.quickOrderForm.get('sizes') as FormArray;
      const sizes = this.availableSizes();

      if (!sizesArray || sizes.length === 0) return 'Form is not ready';

      const errors = sizesArray.controls
        .map((control, index) => {
          if (control.errors && sizes[index]) {
            const size = sizes[index];
            if (control.errors['max']) {
              return `Size ${size.size}: Maximum ${size.quantity} available`;
            }
            if (control.errors['min']) {
              return `Size ${size.size}: Minimum quantity is 0`;
            }
          }
          return null;
        })
        .filter(Boolean);

      if (errors.length > 0) {
        return errors[0] as string;
      }
    }
    return 'Please correct the errors above';
  }

  protected onSubmit(): void {
    if (!this.canSubmit()) return;

    const sizesArray = this.quickOrderForm.get('sizes') as FormArray;
    const sizes = this.availableSizes();

    if (!sizesArray || sizes.length === 0) return;

    const items = sizesArray.value
      .map((quantity: number, index: number) => {
        if (!quantity || quantity <= 0) return null;
        const size = sizes[index];
        return size ? {
          size: size.size,
          quantity,
          unitPrice: size.price
        } : null;
      })
      .filter(Boolean);

    if (items.length === 0) return;

    const orderData: QuickOrderData = {
      productId: this.product().id,
      items
    };

    this.addToCart.emit(orderData);
  }

  protected onCancel(): void {
    this.cancelOrder.emit();
  }
}
