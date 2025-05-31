// apps/admin-panel/src/app/components/shoe-form/shoe-form.component.ts
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import {
  Shoe,
  ShoeCreateDto,
  ShoeUpdateDto,
  SizeTemplate,
  SizeAvailability,
  SizePair,
} from '@shoestore/shared-models';

import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { FileUploadModule } from 'primeng/fileupload';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { ToggleSwitchModule } from 'primeng/toggleswitch';

import { ShoeService } from '../../service/shoe.service';
import { SizeTemplateService } from '../../service/size-template.service';
import { SetPriceDialogComponent } from '../set-price-dialog/set-price-dialog.component';

@Component({
  selector: 'app-shoe-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    SelectModule,
    ToggleSwitchModule,
    TableModule,
    InputNumberModule,
    FileUploadModule,
    ToastModule,
    ConfirmDialogModule,
    SetPriceDialogComponent,
  ],
  templateUrl: './shoe-form.component.html',
  styleUrls: ['./shoe-form.component.scss'],
})
export class ShoeFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private shoeService = inject(ShoeService);
  private templateService = inject(SizeTemplateService);
  private message = inject(MessageService);
  private confirmation = inject(ConfirmationService);

  /**
   * Formularz Reactive Forms:
   * - code: unikalny kod produktu
   * - name: nazwa
   * - imageFile: opcjonalny plik obrazka
   * - visible: czy widoczny w sklepie
   * - templateId: przypisany szablon rozmiarówki (wymagane)
   * - sizes: FormArray z FormGroup { size, price, quantity } dla każdego rozmiaru
   */
  form: FormGroup<{
    code: FormControl<string>;
    name: FormControl<string>;
    imageFile: FormControl<File | null>;
    visible: FormControl<boolean>;
    templateId: FormControl<number | null>;
    sizes: FormArray<
      FormGroup<{
        size: FormControl<number>;
        price: FormControl<number>;
        quantity: FormControl<number>;
      }>
    >;
  }>;

  /** Lista dostępnych szablonów (sygnał) */
  sizeTemplates = signal<SizeTemplate[]>([]);

  /** Opcje do <p-select> (PrimeNG) */
  sizeTemplateAsOptions = computed(() =>
    this.sizeTemplates().map((t) => ({ label: t.name, value: t.id }))
  );

  /** Tryb edycji vs. tworzenie */
  isEditMode = signal(false);
  currentShoeId?: number;

  /** URL podglądu obrazka */
  imagePreviewUrl = signal<string | null>(null);

  /** Status ładowania (spinner itp.) */
  loading = signal(false);

  /** Dialog do ustawiania ceny dla wszystkich rozmiarów */
  showSetPriceDialog = signal(false);

  constructor() {
    this.form = this.fb.group({
      code: new FormControl<string>('', {
        validators: [Validators.required, Validators.minLength(2)],
        nonNullable: true,
      }),
      name: new FormControl<string>('', {
        validators: [Validators.required, Validators.minLength(2)],
        nonNullable: true,
      }),
      imageFile: new FormControl<File | null>(null),
      visible: new FormControl<boolean>(true, { nonNullable: true }),
      templateId: new FormControl<number | null>(null, [Validators.required]),
      sizes: this.fb.array<
        FormGroup<{
          size: FormControl<number>;
          price: FormControl<number>;
          quantity: FormControl<number>;
        }>
      >([]),
    });
  }

  ngOnInit(): void {
    // 1) Sprawdź, czy mamy paramID (edycja)
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.currentShoeId = +idParam;
      this.isEditMode.set(true);
      this.loadExistingShoe(this.currentShoeId);
    }

    // 2) Pobierz wszystkie szablony rozmiarówki
    this.templateService.getAllTemplates().subscribe({
      next: (templates) => this.sizeTemplates.set(templates),
      error: (err: HttpErrorResponse) => {
        this.message.add({
          severity: 'error',
          summary: 'Błąd',
          detail: 'Nie udało się pobrać szablonów rozmiarówki',
        });
      },
    });

    // 3) Gdy użytkownik zmieni templateId, odbuduj tablicę "sizes"
    this.form
      .get('templateId')
      ?.valueChanges.subscribe((templateId: number | null) => {
        if (templateId !== null) {
          this.buildSizesFromTemplate(templateId);
        } else {
          this.clearSizesArray();
        }
      });
  }

  /**
   * Załaduj istniejący but (edycja).
   * Wypełniamy pola: code, name, visible, imagePreviewUrl oraz
   * pojedynczo dodajemy do FormArray "sizes" wszystkie rozmiary z cenami i ilościami.
   */
  private loadExistingShoe(id: number): void {
    this.loading.set(true);
    this.shoeService.getShoeById(id).subscribe({
      next: (shoe: Shoe) => {
        this.loading.set(false);

        // Patch podstawowych pól (templateId ustawimy poniżej)
        this.form.patchValue({
          code: shoe.code,
          name: shoe.name,
          visible: shoe.visible,
          templateId: shoe.templateId,
          imageFile: null, // plik nie wgrywamy na nowo, ale podgląd zostawiamy
        });

        // Jeśli istnieje imageUrl, pokaż go w podglądzie
        if (shoe.imageUrl) {
          this.imagePreviewUrl.set(shoe.imageUrl);
        }

        // Wyczyść poprzednie elementy FormArray
        this.clearSizesArray();

        // Dodaj każdy rozmiar (size, price, quantity) do FormArray
        shoe.sizes.forEach((s: SizeAvailability) => {
          this.sizes.push(
            this.fb.group({
              size: new FormControl<number>(s.size, { nonNullable: true }),
              price: new FormControl<number>(s.price, {
                validators: [Validators.required, Validators.min(0)],
                nonNullable: true,
              }),
              quantity: new FormControl<number>(s.quantity, {
                validators: [Validators.required, Validators.min(0)],
                nonNullable: true,
              }),
            })
          );
        });
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.message.add({
          severity: 'error',
          summary: 'Błąd',
          detail: 'Nie udało się pobrać danych buta.',
        });
        this.router.navigate(['/notfound']);
      },
    });
  }

  /**
   * Po wybraniu szablonu rozmiarówki odbuduj formę "sizes":
   * - Wyczyść FormArray
   * - Dla każdego rozmiaru z wybranego szablonu dodaj FormGroup z:
   *    size (liczba), price (domyślnie 0), quantity (domyślnie 0)
   */
  private buildSizesFromTemplate(templateId: number): void {
  const template = this.sizeTemplates().find((t) => t.id === templateId);
  if (!template) {
    this.clearSizesArray();
    return;
  }
  this.clearSizesArray();

  // Teraz template.pairs: SizePair[] = [{eu, us?}, ...]
  template.pairs.forEach((pair: SizePair) => {
    this.sizes.push(
      this.fb.group({
        // Zapisujemy wyłącznie EU w polu `size`
        size: new FormControl<number>(pair.eu, { nonNullable: true }),
        price: new FormControl<number>(0, {
          validators: [Validators.required, Validators.min(0)],
          nonNullable: true,
        }),
        quantity: new FormControl<number>(0, {
          validators: [Validators.required, Validators.min(0)],
          nonNullable: true,
        }),
      })
    );
  });
}


  /** Usuń wszystkie kontrolki z FormArray "sizes" */
  private clearSizesArray(): void {
    while (this.sizes.length) {
      this.sizes.removeAt(0);
    }
  }

  /** Getter do łatwego dostępu do FormArray "sizes" */
  get sizes(): FormArray<
    FormGroup<{
      size: FormControl<number>;
      price: FormControl<number>;
      quantity: FormControl<number>;
    }>
  > {
    return this.form.get('sizes') as FormArray;
  }

  /**
   * Obsługa wybrania pliku (obrazu):
   * - zapisujemy do form.controls['imageFile']
   * - ustawiamy preview w postaci Base64
   */
  onFileSelect(event: { originalEvent: any; files: File[] }): void {
    const file: File = event.files[0];
    if (file) {
      this.form.patchValue({ imageFile: file });
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreviewUrl.set(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  /**
   * Zatwierdzenie formularza:
   * - Walidacja
   * - Kompilacja DTO (ShoeCreateDto lub ShoeUpdateDto)
   * - Wywołanie create lub update w serwisie
   */
  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.message.add({
        severity: 'warn',
        summary: 'Uwaga',
        detail: 'Proszę wypełnić wszystkie wymagane pola.',
      });
      return;
    }

    // Kompilacja DTO na podstawie wartości formularza
    const dto: ShoeCreateDto | ShoeUpdateDto = {
      code: this.form.value.code!,
      name: this.form.value.name!,
      imageFile: this.form.value.imageFile ?? undefined,
      visible: this.form.value.visible!,
      templateId: this.form.value.templateId!,
      sizes: this.sizes.controls.map((c) => ({
        size: c.value.size!,
        price: c.value.price!,
        quantity: c.value.quantity!,
      })),
    };

    this.loading.set(true);

    if (this.isEditMode()) {
      // Edycja
      this.shoeService.updateShoe(this.currentShoeId!, dto).subscribe({
        next: (updated: Shoe) => {
          this.loading.set(false);
          this.message.add({
            severity: 'success',
            summary: 'Zapisano',
            detail: 'But został zaktualizowany.',
          });
          this.router.navigate(['/']);
        },
        error: (err: HttpErrorResponse) => {
          this.loading.set(false);
          this.message.add({
            severity: 'error',
            summary: 'Błąd',
            detail: err.message,
          });
        },
      });
    } else {
      // Tworzenie
      this.shoeService.createShoe(dto).subscribe({
        next: (created: Shoe) => {
          this.loading.set(false);
          this.message.add({
            severity: 'success',
            summary: 'Dodano',
            detail: 'Nowy but został dodany.',
          });
          this.router.navigate(['/']);
        },
        error: (err: HttpErrorResponse) => {
          this.loading.set(false);
          this.message.add({
            severity: 'error',
            summary: 'Błąd',
            detail: err.message,
          });
        },
      });
    }
  }

  /**
   * Anulowanie / powrót do listy:
   * - Jeśli formularz zmieniony, potwierdź porzucenie zmian
   */
  onCancel(): void {
    if (this.form.dirty) {
      this.confirmation.confirm({
        message:
          'Na pewno chcesz opuścić formularz? Niezapisane zmiany zostaną utracone.',
        header: 'Potwierdź akcję',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Tak',
        rejectLabel: 'Nie',
        accept: () => this.router.navigate(['/']),
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        reject: () => {},
      });
    } else {
      this.router.navigate(['/']);
    }
  }

  onApplyPriceToAll(price: number): void {
    this.form.controls.sizes.controls.forEach((control) => {
      control.controls.price.setValue(price);
      control.controls.price.markAsDirty();
    });
  }
}
