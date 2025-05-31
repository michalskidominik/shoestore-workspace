import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SizePair, SizeTemplate } from '@shoestore/shared-models';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { SizeTemplateService } from '../../../shoes/service/size-template.service';

@Component({
  selector: 'app-size-template-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    ToastModule,
  ],
  templateUrl: './size-template-form.component.html',
  styleUrls: ['./size-template-form.component.scss'],
})
export class SizeTemplateFormComponent {
  private fb = inject(FormBuilder);
  private service = inject(SizeTemplateService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private messageService = inject(MessageService);
  private destroyRef = inject(DestroyRef);

  // signals
  private idParam = signal(this.route.snapshot.paramMap.get('id'));
  isEdit = computed(() => !!this.idParam());

  // form: zamiast "sizes", mamy "pairs" = FormArray<FormGroup<{eu, us}>>
  form = this.fb.group({
    id: new FormControl<number | null>({ value: null, disabled: true }),
    name: new FormControl<string | null>('', Validators.required),
    pairs: this.fb.array<
      FormGroup<{
        eu: FormControl<number | null>;
        us: FormControl<number | null>;
      }>
    >([
      // domyślnie jedna para (eu obowiązkowe, us opcjonalne)
      this.createPairGroup(),
    ]),
  });

  /** Getter do łatwego dostępu */
  get pairs(): FormArray<
    FormGroup<{
      eu: FormControl<number | null>;
      us: FormControl<number | null>;
    }>
  > {
    return this.form.get('pairs') as FormArray;
  }
  get f() {
    return this.form.controls;
  }

  constructor() {
    // Jeśli edycja, ładujemy istniejący szablon
    effect(() => {
      const rawId = this.idParam();
      if (rawId) {
        const id = +rawId;
        this.service
          .getTemplateById(id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe((template) => {
            if (template) {
              // Wypełniamy pola "id" i "name"
              this.form.patchValue({
                id: template.id,
                name: template.name,
              });
              // Odbudowujemy pairs
              this.pairs.clear();
              template.pairs.forEach((pair: SizePair) => {
                this.pairs.push(
                  this.fb.group({
                    eu: new FormControl<number | null>(pair.eu, [
                      Validators.required,
                      Validators.min(1),
                    ]),
                    us: new FormControl<number | null>(pair.us ?? null, [
                      Validators.min(1),
                    ]),
                  })
                );
              });
            }
          });
      }
    });
  }

  /** Tworzy pustą grupę FormGroup dla jednej pary rozmiarów (eu obowiązkowy, us opcjonalny) */
  private createPairGroup(
    euValue: number | null = null,
    usValue: number | null = null
  ): FormGroup<{
    eu: FormControl<number | null>;
    us: FormControl<number | null>;
  }> {
    return this.fb.group({
      eu: new FormControl<number | null>(euValue, [
        Validators.required,
        Validators.min(1),
      ]),
      us: new FormControl<number | null>(usValue, [Validators.min(1)]),
    });
  }

  /** Dodaje nową parę (domyślnie z null/null) */
  addPair(): void {
    this.pairs.push(this.createPairGroup());
  }

  /** Usuwa parę o indeksie i */
  removePair(index: number): void {
    this.pairs.removeAt(index);
  }

  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // Kompilujemy obiekt SizeTemplate
    const raw = this.form.getRawValue();
    const data: SizeTemplate = {
      id: raw.id!,
      name: raw.name!,
      pairs: raw.pairs.map((p: any) => ({
        eu: p.eu!,
        us: p.us === null ? undefined : p.us!,
      })),
    };

    if (this.isEdit()) {
      const id = Number(this.idParam());
      this.service.updateTemplate(id, data).subscribe(() => {
        this.messageService.add({
          severity: 'success',
          summary: 'Zapisano',
          detail: 'Szablon zaktualizowany',
        });
        this.router.navigate(['/size-templates']);
      });
    } else {
      // Backend nada ID
      // delete data.id;
      this.service.createTemplate(data).subscribe(() => {
        this.messageService.add({
          severity: 'success',
          summary: 'Zapisano',
          detail: 'Dodano nowy szablon',
        });
        this.router.navigate(['/size-templates']);
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/size-templates']);
  }
}
