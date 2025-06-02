import { CommonModule } from '@angular/common';
import {
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
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

import { BulkStockUpdateDto, Shoe } from '@shoestore/shared-models';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { MultiSelectModule } from 'primeng/multiselect';
import { TableModule } from 'primeng/table';
import { ShoeService } from '../../service/shoe.service';
import { PanelModule } from 'primeng/panel';
import { TooltipModule } from 'primeng/tooltip';
import { SelectButtonModule } from 'primeng/selectbutton';

@Component({
  selector: 'app-bulk-delivery',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MultiSelectModule,
    DialogModule,
    TableModule,
    InputNumberModule,
    ButtonModule,
    PanelModule,
    TooltipModule,
    SelectButtonModule,
  ],
  templateUrl: './bulk-delivery.component.html',
  styleUrls: ['./bulk-delivery.component.scss'],
})
export class BulkDeliveryComponent implements OnInit {
  private shoeService = inject(ShoeService);
  private message = inject(MessageService);
  private confirmation = inject(ConfirmationService);
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);

  // sygnał: czy okno modalne jest otwarte
  displayModal = signal(false);

  // lista wszystkich butów (krótko: id i kod)
  allShoes = signal<Shoe[]>([]);
  // opcje do MultiSelect: { label: code, value: id }
  shoeOptions = computed(() =>
    this.allShoes().map((s) => ({
      label: s.code + ' – ' + s.name,
      value: s.id,
    }))
  );
  /** Opcje SelectButton: „Dodaj” lub „Odejmij” */
  opOptions = [
    { label: '+', value: 'add' as const, tooltip: 'Dodaj' },
    { label: '−', value: 'subtract' as const, tooltip: 'Odejmij' },
  ];

  // form: contains:
  // - selectedShoes: lista id butów wybranych w oberu
  // - details: FormArray – każda grupa dotyczy jednego Buta (shoe), wewnątrz rozmiary
  form = this.fb.group({
    selectedShoes: new FormControl<number[]>([], Validators.required),
    details: this.fb.array<
      // element FormArray to FormGroup per shoe
      FormGroup<{
        shoeId: FormControl<number>;
        sizeLines: FormArray<
          FormGroup<{
            size: FormControl<number>;
            currentQuantity: FormControl<number>;
            deltaQuantity: FormControl<number>;
          }>
        >;
      }>
    >([]),
  });

  get details(): FormArray {
    return this.form.get('details') as FormArray;
  }

  // Przy otwarciu modala zawsze ładujemy listę butów
  ngOnInit(): void {
    this.shoeService
      .getShoes({ pageSize: 1000 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => this.allShoes.set(res.items),
        error: (e) =>
          this.message.add({
            severity: 'error',
            summary: 'Błąd',
            detail: 'Nie udało się pobrać listy butów',
          }),
      });

    // Kiedy lista selectedShoes się zmienia – budujemy lub usuwamy odpowiednie grupy w details
    this.form.controls.selectedShoes.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((selectedIds) => {
        this.buildDetailsFromSelection(selectedIds ?? []);
      });
  }

  /**
   * Zwraca nazwę buta na podstawie jego ID (szuka w allShoes).
   */
  getShoeNameById(id: number | null): string {
    const s = this.allShoes().find((x) => x.id === id);
    return s ? s.name : '';
  }

  /**
   * Buduje FormArray „details” w oparciu o listę wybranych shoeId:
   * - usuwa grupy odpowiadające butom, które odznaczono
   * - dodaje nowe grupy dla nowo zaznaczonych butów
   */
  private buildDetailsFromSelection(selectedIds: number[]): void {
    // 1) Usuń z details te, które nie ma już w selectedIds
    for (let i = this.details.length - 1; i >= 0; i--) {
      const grp = this.details.at(i);
      const shoeId = grp.get('shoeId')!.value;
      if (!selectedIds.includes(shoeId)) {
        this.details.removeAt(i);
      }
    }

    // 2) Dla każdego wybranego buta, jeśli nie ma grupy – dodaj nową
    selectedIds.forEach((id) => {
      const exists = this.details.controls.some(
        (g) => g.get('shoeId')!.value === id
      );
      if (!exists) {
        // pobierz pełne dane buta (sizes) – używamy getShoeById
        this.shoeService
          .getShoeById(id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: (shoe: Shoe) => {
              // stwórz FormGroup na bazie shoe.sizes, z oddzielnym trybem i liczbą dodatnią:
              const sizeLinesArray = this.fb.array<
                FormGroup<{
                  size: FormControl<number>;
                  currentQuantity: FormControl<number>;
                  op: FormControl<'add' | 'subtract'>;
                  quantityToChange: FormControl<number>;
                }>
              >([]);

              shoe.sizes.forEach((sz) => {
                sizeLinesArray.push(
                  this.fb.group({
                    size: new FormControl<number>(sz.size, {
                      nonNullable: true,
                    }),
                    currentQuantity: new FormControl<number>(sz.quantity, {
                      nonNullable: true,
                    }),
                    op: new FormControl<'add' | 'subtract'>('add', {
                      nonNullable: true,
                    }),
                    quantityToChange: new FormControl<number>(0, {
                      nonNullable: true,
                      validators: [Validators.required, Validators.min(0)],
                    }),
                  })
                );
              });

              // dodajemy całą grupę do details
              const shoeGroup = this.fb.group({
                shoeId: new FormControl<number>(shoe.id, { nonNullable: true }),
                sizeLines: sizeLinesArray,
              });
              this.details.push(shoeGroup);
            },
            error: () => {
              this.message.add({
                severity: 'error',
                summary: 'Błąd',
                detail: `Nie udało się pobrać buta o ID ${id}`,
              });
            },
          });
      }
    });
  }

  openModal() {
    this.displayModal.set(true);
  }

  cancel() {
    this.displayModal.set(false);
    this.form.reset({ selectedShoes: [], details: [] });
    this.details.clear();
  }

  confirmBulkUpdate() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.message.add({
        severity: 'warn',
        summary: 'Uwaga',
        detail: 'Wypełnij wszystkie wymagane pola',
      });
      return;
    }

    // Złożenie listy { shoeId, size, deltaQuantity }
    const dto: BulkStockUpdateDto = {
      items: [],
    };
    this.details.controls.forEach((group) => {
      const shoeId = group.get('shoeId')!.value;
      const sizeLines = group.get('sizeLines') as FormArray;
      sizeLines.controls.forEach((lineCtrl) => {
        const size = lineCtrl.get('size')!.value;
        const op = lineCtrl.get('op')!.value;
        const qty = lineCtrl.get('quantityToChange')!.value;
        if (qty > 0) {
          const delta = op === 'add' ? qty : -qty;
          dto.items.push({ shoeId, size, deltaQuantity: delta });
        }
      });
    });

    if (dto.items.length === 0) {
      this.message.add({
        severity: 'warn',
        summary: 'Brak zmian',
        detail: 'Nie wprowadzono żadnej zmiany stanu',
      });
      return;
    }

    // Potwierdzenie dialogowe
    this.confirmation.confirm({
      header: 'Potwierdź dostawę',
      message: `Na pewno chcesz zaktualizować stany magazynowe dla ${dto.items.length} pozycji?`,
      accept: () => {
        this.shoeService.bulkUpdateStock(dto).subscribe({
          next: () => {
            this.message.add({
              severity: 'success',
              summary: 'Zaktualizowano',
              detail: 'Stany magazynowe zostały zaktualizowane',
            });
            this.cancel();
          },
          error: (err) => {
            this.message.add({
              severity: 'error',
              summary: 'Błąd',
              detail: err.message,
            });
          },
        });
      },
    });
  }

  getSizeLinesControls(group: AbstractControl): FormGroup<{
    size: FormControl<number>;
    currentQuantity: FormControl<number>;
    deltaQuantity: FormControl<number>;
  }>[] {
    return (group.get('sizeLines') as FormArray).controls as FormGroup[];
  }
}
