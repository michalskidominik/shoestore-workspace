import { CommonModule } from '@angular/common';
import { Component, input, output, signal, computed, ChangeDetectionStrategy, inject, effect } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';
import { Shoe, SizeAvailability } from '@shoestore/shared-models';
import { CurrencyStore } from '../../../../shared/stores/currency.store';

export interface OrderData {
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
    <div class="dialog-content h-full flex flex-col bg-white">
      <!-- Mobile: Compact Header -->
      <div class="flex-shrink-0 px-4 lg:px-6 py-3 lg:py-4 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-white">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2 lg:gap-3">
            <div class="w-8 h-8 lg:w-10 lg:h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <i class="pi pi-shopping-cart text-blue-600 text-sm lg:text-base"></i>
            </div>
            <div>
              <h2 class="text-lg lg:text-xl font-bold text-slate-900">Quick Order</h2>
              <p class="text-xs lg:text-sm text-slate-600 hidden sm:block">Select sizes and quantities</p>
            </div>
          </div>
          <p-button
            icon="pi pi-times"
            severity="secondary"
            [text]="true"
            size="small"
            (onClick)="onCancel()"
            [attr.aria-label]="'Close order dialog'"
            styleClass="!w-8 !h-8 lg:!w-10 lg:!h-10 !p-0 hover:!bg-slate-100 !transition-colors !rounded-full">
          </p-button>
        </div>
      </div>

      <!-- Mobile: Compact Product Info -->
      <div class="flex-shrink-0 px-4 lg:px-6 py-2 lg:py-3 bg-slate-50 border-b border-slate-100">
        <div class="flex items-center gap-3 lg:gap-4">
          <div class="w-10 h-10 lg:w-12 lg:h-12 bg-white rounded-lg border border-slate-200 flex items-center justify-center overflow-hidden">
            <img
              [src]="product().imageUrl || 'https://via.placeholder.com/48x48/f1f5f9/64748b?text=No+Image'"
              [alt]="product().name"
              class="w-full h-full object-cover">
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="font-semibold text-slate-900 text-sm lg:text-base mb-1 truncate">{{ product().name }}</h3>
            <p class="text-xs lg:text-sm text-slate-500 font-mono">{{ product().code }}</p>
          </div>
        </div>
      </div>

      <!-- Scrollable Content Area -->
      <div class="flex-1 overflow-y-auto px-4 lg:px-6 py-3 lg:py-4 pb-20 lg:pb-4">
        @if (isFormReady()) {
          <!-- Quick Fill All Sizes - Compact on Mobile -->
          <div class="mb-4 lg:mb-6 p-3 lg:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg lg:rounded-xl">
            <div class="flex items-center gap-2 mb-2 lg:mb-3">
              <div class="w-5 h-5 lg:w-6 lg:h-6 bg-blue-100 rounded-full flex items-center justify-center">
                <i class="pi pi-copy text-blue-600 text-xs"></i>
              </div>
              <span class="text-xs lg:text-sm font-semibold text-slate-800">Quick Fill All</span>
            </div>

            <div class="flex items-center gap-2 lg:gap-3">
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <span class="text-xs font-medium text-slate-600 w-8 lg:w-12 flex-shrink-0">Qty:</span>
                  <p-inputNumber
                    [(ngModel)]="applyToAllQuantity"
                    [showButtons]="true"
                    [min]="0"
                    [max]="100"
                    [step]="1"
                    styleClass="mobile-compact-input flex-1"
                    placeholder="0">
                  </p-inputNumber>
                </div>
              </div>
              <p-button
                label="Apply"
                icon="pi pi-check"
                size="small"
                [disabled]="!applyToAllQuantity() || applyToAllQuantity() === 0"
                (onClick)="onApplyToAll()"
                styleClass="!bg-blue-600 !border-blue-600 hover:!bg-blue-700 !text-white !font-medium !px-3 lg:!px-6 !py-1 lg:!py-2 !rounded-md lg:!rounded-lg !text-xs lg:!text-sm">
              </p-button>
            </div>
          </div>

          <!-- Size Quantities Form -->
          <form [formGroup]="orderForm" (ngSubmit)="onSubmit()">
            <div formArrayName="sizes">
              <!-- Desktop Grid Layout -->
              <div class="hidden lg:block mb-6 max-h-96 overflow-y-auto pr-2">
                <div class="grid grid-cols-2 xl:grid-cols-3 gap-4">
                  @for (sizeControl of sizeFormControls(); track $index) {
                    <div class="bg-white border-2 border-slate-200 rounded-xl p-4 hover:border-blue-300 hover:bg-blue-50/50 transition-all duration-200 group">
                      <!-- Size Header -->
                      <div class="flex items-center justify-between mb-3">
                        <div class="flex items-center gap-2">
                          <span class="text-lg font-bold text-slate-900 group-hover:text-blue-700">
                            {{ getSizeDisplay(getAvailableSizes()[$index]) }}
                          </span>
                          <span class="text-sm font-semibold text-blue-600">
                            {{ currencyStore.formatWithSymbol(getAvailableSizes()[$index].price) }}
                          </span>
                        </div>
                      </div>

                      <!-- Stock Status -->
                      <div class="mb-3">
                        @if (getAvailableSizes()[$index].quantity === 0) {
                          <div class="flex items-center gap-2 px-2 py-1 bg-red-50 rounded-lg border border-red-200">
                            <div class="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></div>
                            <span class="text-sm text-red-600 font-medium">Out of stock</span>
                          </div>
                        } @else if (getAvailableSizes()[$index].quantity <= 5) {
                          <div class="flex items-center gap-2 px-2 py-1 bg-orange-50 rounded-lg border border-orange-200">
                            <div class="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0"></div>
                            <span class="text-sm text-orange-600 font-medium">
                              {{ getAvailableSizes()[$index].quantity }} left
                            </span>
                          </div>
                        } @else {
                          <div class="flex items-center gap-2 px-2 py-1 bg-green-50 rounded-lg border border-green-200">
                            <div class="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                            <span class="text-sm text-green-600 font-medium">
                              {{ getAvailableSizes()[$index].quantity }} in stock
                            </span>
                          </div>
                        }
                      </div>

                      <!-- Quantity Input -->
                      <div class="space-y-2">
                        <span class="text-xs font-medium text-slate-600 block">Quantity:</span>
                        <p-inputNumber
                          [formControlName]="$index"
                          [showButtons]="true"
                          [min]="0"
                          [max]="getAvailableSizes()[$index].quantity"
                          [step]="1"
                          styleClass="grid-compact-input w-full"
                          placeholder="0"
                          [disabled]="getAvailableSizes()[$index].quantity === 0">
                        </p-inputNumber>
                      </div>
                    </div>
                  }
                </div>
              </div>

              <!-- Mobile Compact List Layout -->
              <div class="lg:hidden space-y-2">
                @for (sizeControl of sizeFormControls(); track $index) {
                  <div class="flex items-center gap-2 py-2 px-3 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors">
                    <!-- Size -->
                    <div class="w-12 flex-shrink-0">
                      <span class="text-sm font-bold text-slate-800">
                        {{ getSizeDisplay(getAvailableSizes()[$index]) }}
                      </span>
                    </div>

                    <!-- Price -->
                    <div class="w-16 flex-shrink-0">
                      <span class="text-xs font-medium text-blue-600">
                        {{ currencyStore.formatWithSymbol(getAvailableSizes()[$index].price) }}
                      </span>
                    </div>

                    <!-- Stock Status -->
                    <div class="flex-1 min-w-0">
                      @if (getAvailableSizes()[$index].quantity === 0) {
                        <div class="flex items-center gap-1">
                          <div class="w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0"></div>
                          <span class="text-xs text-red-600 truncate">Out</span>
                        </div>
                      } @else if (getAvailableSizes()[$index].quantity <= 5) {
                        <div class="flex items-center gap-1">
                          <div class="w-1.5 h-1.5 bg-orange-500 rounded-full flex-shrink-0"></div>
                          <span class="text-xs text-orange-600 truncate">
                            {{ getAvailableSizes()[$index].quantity }}
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
                        styleClass="mobile-compact-input"
                        placeholder="0"
                        [disabled]="getAvailableSizes()[$index].quantity === 0">
                      </p-inputNumber>
                    </div>
                  </div>
                }
              </div>

              <!-- Validation Errors -->
              @if (hasValidationErrors()) {
                <div class="mt-3 p-2 lg:p-3 bg-red-50 border-l-4 border-red-400 rounded-md">
                  <div class="flex items-center">
                    <i class="pi pi-exclamation-triangle text-red-400 mr-2 text-sm"></i>
                    <span class="text-xs lg:text-sm text-red-700 font-medium">{{ getValidationMessage() }}</span>
                  </div>
                </div>
              }
            </div>
          </form>
        } @else {
          <div class="flex items-center justify-center py-12 lg:py-16">
            <div class="text-center">
              <div class="mb-3 lg:mb-4">
                <p-progressSpinner
                  styleClass="!w-12 !h-12 lg:!w-16 lg:!h-16"
                  strokeWidth="3"
                  fill="transparent"
                  animationDuration="1s">
                </p-progressSpinner>
              </div>
              <h3 class="text-base lg:text-lg font-semibold text-slate-700 mb-1 lg:mb-2">Loading sizes...</h3>
              <p class="text-xs lg:text-sm text-slate-500">Please wait while we prepare your options</p>
            </div>
          </div>
        }
      </div>

      <!-- Mobile: Sticky Bottom Actions -->
      <div class="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-3 safe-area-bottom">
        @if (isFormReady()) {
          <!-- Mobile Order Summary -->
          <div class="flex items-center justify-between mb-3 p-3 bg-slate-50 rounded-lg">
            <div class="flex items-center gap-2">
              <i class="pi pi-calculator text-blue-600 text-sm"></i>
              <span class="text-sm font-semibold text-slate-800">Total</span>
            </div>
            <div class="text-right">
              <div class="text-lg font-bold text-blue-700">{{ currencyStore.formatWithSymbol(getTotalPrice()) }}</div>
              <div class="text-xs text-slate-600">
                {{ getTotalQuantity() }} {{ getTotalQuantity() === 1 ? 'item' : 'items' }}
              </div>
            </div>
          </div>

          <!-- Mobile Action Buttons -->
          <div class="flex gap-3">
            <p-button
              type="button"
              label="Cancel"
              severity="secondary"
              [outlined]="true"
              size="large"
              styleClass="!text-sm !py-3 !px-4 flex-1 !font-medium"
              (onClick)="onCancel()">
            </p-button>
            <p-button
              type="submit"
              label="Add to Cart"
              icon="pi pi-shopping-cart"
              severity="primary"
              size="large"
              [disabled]="!canSubmit() || isSubmitting()"
              [loading]="isSubmitting()"
              (onClick)="onSubmit()"
              styleClass="!text-sm !py-3 !px-4 flex-2 !font-semibold">
            </p-button>
          </div>
        }
      </div>

      <!-- Desktop: Standard Footer -->
      <div class="hidden lg:block flex-shrink-0 px-6 py-4 border-t border-slate-200 bg-slate-50">
        @if (isFormReady()) {
          <!-- Order Summary -->
          <div class="mb-4 p-4 bg-white border border-slate-200 rounded-xl">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <i class="pi pi-calculator text-blue-600"></i>
                <span class="text-base font-semibold text-slate-800">Order Total</span>
              </div>
              <div class="text-right">
                <div class="text-2xl font-bold text-blue-700">{{ currencyStore.formatWithSymbol(getTotalPrice()) }}</div>
                <div class="text-sm text-slate-600">
                  {{ getTotalQuantity() }} {{ getTotalQuantity() === 1 ? 'item' : 'items' }}
                </div>
              </div>
            </div>
            @if (getTotalQuantity() > 0) {
              <div class="mt-3 pt-3 border-t border-slate-200">
                <div class="flex items-center gap-1 text-sm text-blue-600">
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
              size="large"
              styleClass="!text-sm !py-3 !px-8 flex-1 !font-medium"
              (onClick)="onCancel()">
            </p-button>
            <p-button
              type="submit"
              label="Add to Cart"
              icon="pi pi-shopping-cart"
              severity="primary"
              size="large"
              [disabled]="!canSubmit() || isSubmitting()"
              [loading]="isSubmitting()"
              (onClick)="onSubmit()"
              styleClass="!text-sm !py-3 !px-8 flex-2 !font-semibold !shadow-lg hover:!shadow-xl !transition-all !duration-200">
            </p-button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }

    .dialog-content {
      min-height: 600px;
      max-height: 90vh;
      overflow: hidden;
      border-radius: inherit; /* Inherit from parent dialog */
    }

    @media (min-width: 1024px) {
      .dialog-content {
        min-height: 650px;
        max-height: 90vh;
      }
    }

    /* Smooth animations for dialog content */
    .dialog-content {
      animation: dialogSlideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    @keyframes dialogSlideIn {
      from {
        opacity: 0;
        transform: translateY(-10px) scale(0.98);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    /* Mobile compact input styling */
    :host ::ng-deep .mobile-compact-input .p-inputnumber {
      width: 60px !important;
    }

    :host ::ng-deep .mobile-compact-input .p-inputnumber-input {
      padding: 4px 18px 4px 6px !important;
      font-size: 12px !important;
      text-align: center !important;
      width: 100% !important;
      border-radius: 4px !important;
      border: 1px solid #d1d5db !important;
      font-weight: 600 !important;
    }

    :host ::ng-deep .mobile-compact-input .p-inputnumber-input:focus {
      border-color: #3b82f6 !important;
      box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.2) !important;
    }

    :host ::ng-deep .mobile-compact-input .p-inputnumber-button-group {
      display: flex !important;
      flex-direction: column !important;
      position: absolute !important;
      right: 1px !important;
      top: 1px !important;
      bottom: 1px !important;
      width: 16px !important;
    }

    :host ::ng-deep .mobile-compact-input .p-inputnumber-button {
      width: 16px !important;
      height: 50% !important;
      padding: 0 !important;
      margin: 0 !important;
      border: none !important;
      background: #f8fafc !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      border-radius: 0 !important;
      transition: background-color 0.15s ease !important;
    }

    :host ::ng-deep .mobile-compact-input .p-inputnumber-button:hover {
      background: #e2e8f0 !important;
    }

    :host ::ng-deep .mobile-compact-input .p-inputnumber-button:first-child {
      border-top-right-radius: 3px !important;
    }

    :host ::ng-deep .mobile-compact-input .p-inputnumber-button:last-child {
      border-bottom-right-radius: 3px !important;
    }

    :host ::ng-deep .mobile-compact-input .p-inputnumber-button .p-button-icon {
      font-size: 8px !important;
      color: #64748b !important;
    }

    /* Enhanced scroll styling */
    .overflow-y-auto {
      scrollbar-width: thin;
      scrollbar-color: #cbd5e1 #f1f5f9;
      -webkit-overflow-scrolling: touch;
    }

    .overflow-y-auto::-webkit-scrollbar {
      width: 6px;
    }

    .overflow-y-auto::-webkit-scrollbar-track {
      background: #f1f5f9;
      border-radius: 3px;
    }

    .overflow-y-auto::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 3px;
    }

    .overflow-y-auto::-webkit-scrollbar-thumb:hover {
      background: #94a3b8;
    }

    /* Mobile specific overrides */
    @media (max-width: 1023px) {
      .dialog-content {
        min-height: 100vh;
        max-height: 100vh;
        display: flex;
        flex-direction: column;
        border-radius: 0 !important; /* Remove border radius on mobile for full screen */
      }

      .overflow-y-auto {
        overscroll-behavior: contain;
        -webkit-overflow-scrolling: touch;
        scroll-behavior: smooth;
      }

      /* Safe area support for mobile */
      .safe-area-bottom {
        padding-bottom: max(12px, env(safe-area-inset-bottom));
      }

      /* Ensure mobile dialog takes full screen */
      :host {
        border-radius: 0 !important;
      }

      /* Override any parent dialog border radius on mobile */
      :host ::ng-deep .p-dialog {
        border-radius: 0 !important;
      }

      :host ::ng-deep .p-dialog-content {
        border-radius: 0 !important;
      }

      /* Ensure header doesn't have top border radius on mobile */
      .flex-shrink-0:first-child {
        border-top-left-radius: 0 !important;
        border-top-right-radius: 0 !important;
      }

      /* Ensure mobile actions bar at bottom doesn't have border radius */
      .fixed.bottom-0 {
        border-bottom-left-radius: 0 !important;
        border-bottom-right-radius: 0 !important;
      }
    }

    /* Desktop border radius inheritance */
    @media (min-width: 1024px) {
      .flex-shrink-0:first-child {
        border-top-left-radius: inherit;
        border-top-right-radius: inherit;
      }

      .flex-shrink-0:last-child {
        border-bottom-left-radius: inherit;
        border-bottom-right-radius: inherit;
      }
    }

    /* Flex-2 utility class for buttons */
    .flex-2 {
      flex: 2;
    }

    /* Grid-specific input styling for desktop */
    :host ::ng-deep .grid-compact-input .p-inputnumber {
      width: 100% !important;
    }

    :host ::ng-deep .grid-compact-input .p-inputnumber-input {
      padding: 8px 28px 8px 12px !important;
      font-size: 14px !important;
      text-align: center !important;
      width: 100% !important;
      border-radius: 8px !important;
      border: 2px solid #e2e8f0 !important;
      font-weight: 600 !important;
    }

    :host ::ng-deep .grid-compact-input .p-inputnumber-input:focus {
      border-color: #3b82f6 !important;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
    }

    :host ::ng-deep .grid-compact-input .p-inputnumber-button-group {
      display: flex !important;
      flex-direction: column !important;
      position: absolute !important;
      right: 2px !important;
      top: 2px !important;
      bottom: 2px !important;
      width: 24px !important;
    }

    :host ::ng-deep .grid-compact-input .p-inputnumber-button {
      width: 24px !important;
      height: 50% !important;
      padding: 0 !important;
      margin: 0 !important;
      border: none !important;
      background: #f1f5f9 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      border-radius: 0 !important;
      transition: background-color 0.15s ease !important;
    }

    :host ::ng-deep .grid-compact-input .p-inputnumber-button:hover {
      background: #e2e8f0 !important;
    }

    :host ::ng-deep .grid-compact-input .p-inputnumber-button:first-child {
      border-top-right-radius: 6px !important;
    }

    :host ::ng-deep .grid-compact-input .p-inputnumber-button:last-child {
      border-bottom-right-radius: 6px !important;
    }

    :host ::ng-deep .grid-compact-input .p-inputnumber-button .p-button-icon {
      font-size: 10px !important;
      color: #64748b !important;
    }

    /* Button hover enhancements */
    :host ::ng-deep .p-button:hover:not(:disabled) {
      transform: translateY(-1px);
      transition: all 0.15s ease;
    }

    :host ::ng-deep .p-button:active:not(:disabled) {
      transform: translateY(0);
    }

    /* Loading spinner */
    :host ::ng-deep .p-progressspinner {
      margin: 0 auto;
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
  readonly placeOrder = output<OrderData>();
  readonly cancelOrder = output<void>();

  // Form and state management
  private readonly fb = inject(FormBuilder);
  protected readonly currencyStore = inject(CurrencyStore);
  protected readonly orderForm: FormGroup;
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
    const sizesArray = this.orderForm.get('sizes') as FormArray;
    return sizes.length > 0 && sizesArray && sizesArray.controls.length === sizes.length;
  });

  protected readonly sizeFormControls = computed(() => {
    if (!this.isFormReady()) return [];
    const sizesArray = this.orderForm.get('sizes') as FormArray;
    return sizesArray.controls;
  });

  constructor() {
    // Initialize form with empty size controls
    this.orderForm = this.fb.group({
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
      const sizesArray = this.orderForm.get('sizes') as FormArray;

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
    const sizesArray = this.orderForm.get('sizes') as FormArray;
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
    const sizesArray = this.orderForm.get('sizes') as FormArray;
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
    const sizesArray = this.orderForm.get('sizes') as FormArray;
    return sizesArray.value.reduce((total: number, quantity: number) => total + (quantity || 0), 0);
  }

  protected getTotalPrice(): number {
    const sizesArray = this.orderForm.get('sizes') as FormArray;
    const sizes = this.availableSizes();

    if (!sizesArray || sizes.length === 0) return 0;

    return sizesArray.value.reduce((total: number, quantity: number, index: number) => {
      const size = sizes[index];
      return size ? total + ((quantity || 0) * size.price) : total;
    }, 0);
  }

  protected canSubmit(): boolean {
    return this.isFormReady() && this.getTotalQuantity() > 0 && this.orderForm.valid;
  }

  protected hasValidationErrors(): boolean {
    return this.orderForm.invalid && this.orderForm.touched;
  }

  protected getValidationMessage(): string {
    if (!this.orderForm.valid) {
      const sizesArray = this.orderForm.get('sizes') as FormArray;
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

    const sizesArray = this.orderForm.get('sizes') as FormArray;
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

    const orderData: OrderData = {
      productId: this.product().id,
      items
    };

    this.placeOrder.emit(orderData);
  }

  protected onCancel(): void {
    this.cancelOrder.emit();
  }
}
