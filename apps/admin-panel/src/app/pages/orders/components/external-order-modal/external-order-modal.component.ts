import { CommonModule } from '@angular/common';
import {
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import {
  BulkStockUpdateDto,
  OrderCreateDto,
  Shoe,
  User,
} from '@shoestore/shared-models';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { PanelModule } from 'primeng/panel';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { ShoeService } from '../../../shoes/service/shoe.service';
import { UserService } from '../../../users/services/user.service';
import { OrderService } from '../../services/order.service';

@Component({
  selector: 'app-external-order-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CheckboxModule,
    SelectModule,
    InputTextModule,
    MultiSelectModule,
    InputNumberModule,
    ButtonModule,
    TableModule,
    PanelModule,
    DialogModule,
  ],
  templateUrl: './external-order-modal.component.html',
  styleUrls: ['./external-order-modal.component.scss'],
})
export class ExternalOrderModalComponent implements OnInit {
  private orderService = inject(OrderService);
  private shoeService = inject(ShoeService);
  private userService = inject(UserService);
  private message = inject(MessageService);
  private confirmation = inject(ConfirmationService);
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);

  /** Widoczność modalnego okna */
  visible = signal(false);

  /** Lista wszystkich butów (do wyboru pozycji) */
  allShoes = signal<Shoe[]>([]);
  /** Opcje do MultiSelect (buty) */
  shoeOptions = computed(() =>
    this.allShoes().map((s) => ({
      label: s.code + ' – ' + s.name,
      value: s.id,
    }))
  );

  /** Lista użytkowników (opcjonalnie do dropdown) */
  allUsers = signal<User[]>([]);
  userOptions = computed(() =>
    this.allUsers().map((u) => ({
      label: u.invoiceInfo.companyName + ' (' + u.email + ')',
      value: u.id,
    }))
  );

  orderPlaced = output<void>();

  /** Reactive form */
  form = this.fb.group({
    // 1) czy bez klienta
    isGuest: new FormControl<boolean>(false),
    // 2) wybór istniejącego usera
    userId: new FormControl<number | null>(null),
    // 3) dane gościa (walidowane tylko gdy isGuest = true)
    guestName: new FormControl<string | null>(null, Validators.required),
    guestEmail: new FormControl<string | null>(null, [
      Validators.required,
      Validators.email,
    ]),
    guestPhone: new FormControl<string | null>(null),
    guestShippingStreet: new FormControl<string | null>(
      null,
      Validators.required
    ),
    guestShippingCity: new FormControl<string | null>(
      null,
      Validators.required
    ),
    guestShippingPostalCode: new FormControl<string | null>(
      null,
      Validators.required
    ),
    guestShippingCountry: new FormControl<string | null>(
      null,
      Validators.required
    ),
    guestBillingStreet: new FormControl<string | null>(
      null,
      Validators.required
    ),
    guestBillingCity: new FormControl<string | null>(null, Validators.required),
    guestBillingPostalCode: new FormControl<string | null>(
      null,
      Validators.required
    ),
    guestBillingCountry: new FormControl<string | null>(
      null,
      Validators.required
    ),

    // 4) lista wybranych butów do zamówienia
    selectedShoes: new FormControl<number[]>([], Validators.required),

    // 5) szczegóły pozycji: FormArray { shoeId, sizeLines: [ { size, currentQuantity, unitPrice, orderQuantity } ] }
    details: this.fb.array<
      FormGroup<{
        shoeId: FormControl<number>;
        sizeLines: FormArray<
          FormGroup<{
            size: FormControl<number>;
            currentQuantity: FormControl<number>;
            unitPrice: FormControl<number>;
            orderQuantity: FormControl<number>;
          }>
        >;
      }>
    >([]),
  });

  get details(): FormArray {
    return this.form.get('details') as FormArray;
  }

  ngOnInit(): void {
    // Na starcie wyłączamy walidatory "guest*" (bo isGuest = false)
    this.enableGuestFields(false);

    // 1) Pobierz wszystkie buty (max rekordu np. 1000 na potrzeby wyboru)
    this.shoeService
      .getShoes({ pageSize: 1000 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => this.allShoes.set(res.items),
        error: () =>
          this.message.add({
            severity: 'error',
            summary: 'Błąd',
            detail: 'Nie można pobrać listy butów',
          }),
      });

    // 2) Pobierz listę użytkowników
    this.userService
      .getAllUsers()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (users) => this.allUsers.set(users),
        error: () =>
          this.message.add({
            severity: 'warn',
            summary: 'Uwaga',
            detail: 'Nie udało się pobrać klientów',
          }),
      });

    // 3) Gdy `selectedShoes` się zmienia, odświeżamy grupy w details
    this.form.controls.selectedShoes.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((shoeIds) => {
        this.buildDetailsFromSelection(shoeIds || []);
      });

    // 4) Kiedy zmienia się isGuest: włączamy/wyłączamy walidację pól gościa
    this.form.controls.isGuest.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((isGuest) => {
        if (isGuest) {
          // jeśli gość: wyzeruj userId i włącz walidatory dla pola gościa
          this.form.controls.userId.setValue(null);
          this.enableGuestFields(true);
        } else {
          // jeśli nie-gość: wyłącz walidatory pól gościa
          this.enableGuestFields(false);
        }
      });
  }

  /** Włącza lub wyłącza walidatory dla pól "guest*" */
  private enableGuestFields(enable: boolean) {
    const guestFields = [
      'guestName',
      'guestEmail',
      'guestPhone',
      'guestShippingStreet',
      'guestShippingCity',
      'guestShippingPostalCode',
      'guestShippingCountry',
      'guestBillingStreet',
      'guestBillingCity',
      'guestBillingPostalCode',
      'guestBillingCountry',
    ];
    for (const f of guestFields) {
      const ctrl = this.form.get(f)!;
      if (enable) {
        // jeśli włączamy – przypisz oryginalnego walidatora (który ustawiliśmy w konstruktorze)
        ctrl.setValidators(ctrl.validator ?? []);
      } else {
        // jeśli wyłączamy – czyść walidatory i wartość
        ctrl.clearValidators();
        ctrl.setValue(null);
      }
      ctrl.updateValueAndValidity();
    }
  }

  /** Buduje FormArray „details” na podstawie wybranych ID butów */
  private buildDetailsFromSelection(selectedIds: number[]) {
    // 1) Usuń grupy, których ID już nie ma w selectedIds
    for (let i = this.details.length - 1; i >= 0; i--) {
      const grp = this.details.at(i);
      const shoeId = grp.get('shoeId')!.value;
      if (!selectedIds.includes(shoeId)) {
        this.details.removeAt(i);
      }
    }

    // 2) Dodaj brakujące grupy
    selectedIds.forEach((id) => {
      const exists = this.details.controls.some(
        (g) => g.get('shoeId')!.value === id
      );
      if (!exists) {
        this.shoeService
          .getShoeById(id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: (shoe: Shoe) => {
              const sizeLinesArr = this.fb.array<
                FormGroup<{
                  size: FormControl<number>;
                  currentQuantity: FormControl<number>;
                  unitPrice: FormControl<number>;
                  orderQuantity: FormControl<number>;
                }>
              >([]);

              shoe.sizes.forEach((sz) => {
                sizeLinesArr.push(
                  this.fb.group({
                    size: new FormControl<number>(sz.size, {
                      nonNullable: true,
                    }),
                    currentQuantity: new FormControl<number>(sz.quantity, {
                      nonNullable: true,
                    }),
                    unitPrice: new FormControl<number>(sz.price, {
                      nonNullable: true,
                    }),
                    orderQuantity: new FormControl<number>(0, {
                      nonNullable: true,
                      validators: [
                        Validators.min(0),
                        Validators.max(sz.quantity),
                      ],
                    }),
                  })
                );
              });

              const shoeGroup = this.fb.group({
                shoeId: new FormControl<number>(id, { nonNullable: true }),
                sizeLines: sizeLinesArr,
              });
              this.details.push(shoeGroup);
            },
            error: () =>
              this.message.add({
                severity: 'error',
                summary: 'Błąd',
                detail: `Nie udało się pobrać buta o ID ${id}`,
              }),
          });
      }
    });
  }

  /** Zwraca nazwę buta po jego ID (szuka w allShoes) */
  getShoeNameById(id: number | null): string {
    if (!id) return '';
    const found = this.allShoes().find((s) => s.id === id);
    return found ? found.name : '';
  }

  /** Pobiera tablicę FormGroup<sizeLine> z grupy details */
  getSizeLinesControls(group: AbstractControl): FormGroup<any>[] {
    return (group.get('sizeLines') as FormArray).controls as FormGroup<any>[];
  }

  /** Waliduje, czy dla każdego wybranego buta co najmniej jedna pozycja ma quantity > 0 i jest poprawna */
  validQuantities(): boolean {
    for (const grp of this.details.controls as FormGroup<any>[]) {
      const sizeLines = grp.get('sizeLines') as FormArray;
      const quantities = sizeLines.controls.map(
        (line) => line.get('orderQuantity')!.value!
      );

      // Sprawdź, czy przynajmniej jedna pozycja ma > 0
      const hasAtLeastOne = quantities.some((q) => q > 0);
      if (!hasAtLeastOne) {
        return false;
      }

      // Sprawdź poprawność wszystkich wprowadzonych wartości (>0 i ≤ dostępne)
      for (const line of sizeLines.controls as FormGroup<any>[]) {
        const control = line.get('orderQuantity')!;
        const value = control.value!;
        if (value > 0 && control.invalid) {
          return false;
        }
      }
    }
    return true;
  }

  /** Wywoływane po kliknięciu „Zapisz zamówienie” */
  onSubmitExternalOrder() {
    if (this.form.invalid || !this.validQuantities()) {
      this.form.markAllAsTouched();
      this.message.add({
        severity: 'warn',
        summary: 'Uwaga',
        detail: 'Wypełnij wszystkie wymagane pola',
      });
      return;
    }

    // Budujemy DTO
    const dto: OrderCreateDto = { userId: undefined as any, items: [] };

    if (!this.form.get('isGuest')?.value && this.form.get('userId')!.value) {
      dto.userId = this.form.controls.userId.value!;
    } else {
      // gość → wstawiamy ręcznie dane
      dto.userId = undefined as any; // w mocku zostanie potraktowany jako guest
      (dto as any).guestName = this.form.get('guestName')!.value!;
      (dto as any).guestEmail = this.form.get('guestEmail')!.value!;
      (dto as any).guestPhone = this.form.get('guestPhone')!.value!;
      (dto as any).guestShippingAddress = {
        street: this.form.get('guestShippingStreet')!.value!,
        city: this.form.get('guestShippingCity')!.value!,
        postalCode: this.form.get('guestShippingPostalCode')!.value!,
        country: this.form.get('guestShippingCountry')!.value!,
      };
      (dto as any).guestBillingAddress = {
        street: this.form.get('guestBillingStreet')!.value!,
        city: this.form.get('guestBillingCity')!.value!,
        postalCode: this.form.get('guestBillingPostalCode')!.value!,
        country: this.form.get('guestBillingCountry')!.value!,
      };
    }

    // Zbieramy pozycje: { shoeId, size, quantity }
    this.details.controls.forEach((grp) => {
      const shoeId = grp.get('shoeId')!.value;
      const sizeLines = grp.get('sizeLines') as FormArray;
      sizeLines.controls.forEach((line) => {
        const quantity = line.get('orderQuantity')!.value!;
        if (quantity > 0) {
          dto.items.push({
            shoeId,
            size: line.get('size')!.value!,
            quantity,
          });
        }
      });
    });

    if (dto.items.length === 0) {
      this.message.add({
        severity: 'warn',
        summary: 'Brak pozycji',
        detail: 'Dodaj co najmniej jedną pozycję do zamówienia',
      });
      return;
    }

    // Potwierdzenie zapisania zamówienia
    this.confirmation.confirm({
      header: 'Potwierdź wystawienie zamówienia',
      message: `Czy wystawić zamówienie i oznaczyć je jako „zrealizowane poza systemem”?`,
      accept: () => {
        // 1) Tworzymy zamówienie w statusie completed
        this.orderService.createOrder(dto).subscribe({
          next: (created: any) => {
            this.message.add({
              severity: 'success',
              summary: 'Zapisano',
              detail: `Zamówienie #${created.id} wystawione, stany magazynowe zaktualizowane.`,
            });
            this.onCancel();
            this.orderPlaced.emit();
          },
          error: (err) =>
            this.message.add({
              severity: 'error',
              summary: 'Błąd',
              detail: err.message,
            }),
        });
      },
    });
  }

  onCancel() {
    this.visible.set(false);
    this.form.reset({
      isGuest: false,
      userId: null,
      guestName: null,
      guestEmail: null,
      guestPhone: null,
      guestShippingStreet: null,
      guestShippingCity: null,
      guestShippingPostalCode: null,
      guestShippingCountry: null,
      guestBillingStreet: null,
      guestBillingCity: null,
      guestBillingPostalCode: null,
      guestBillingCountry: null,
      selectedShoes: [],
      details: [],
    });
    this.details.clear();

    // Ponownie wyłączamy walidatory pól gościa po zamknięciu
    this.enableGuestFields(false);
  }

  /** Otwiera modalne okno od zewnątrz */
  openModal() {
    this.visible.set(true);
  }
}
