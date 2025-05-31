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
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SizeTemplate } from '@shoestore/shared-models';
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

  // form
  form = this.fb.group({
    id: new FormControl<number | null>({ value: null, disabled: true }),
    name: new FormControl<string | null>('', Validators.required),
    sizes: this.fb.array([
      this.fb.control<number | null>(null, Validators.required),
    ]),
  });

  get sizes(): FormArray {
    return this.form.get('sizes') as FormArray;
  }

  get f() {
    return this.form.controls;
  }

  constructor() {
    // Ładowanie danych w trybie edycji
    effect(() => {
      const idRaw = this.idParam();
      if (idRaw) {
        const id = +idRaw;
        this.service
          .getTemplateById(id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe((template) => {
            if (template) {
              this.form.patchValue({
                id: template.id,
                name: template.name,
              });
              this.sizes.clear();
              template.sizes.forEach((sz) =>
                this.sizes.push(this.fb.control(sz, Validators.required))
              );
            }
          });
      }
    });
  }

  addSize(): void {
    this.sizes.push(this.fb.control(null, Validators.required));
  }

  removeSize(index: number): void {
    this.sizes.removeAt(index);
  }

  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const data: SizeTemplate = this.form.getRawValue() as SizeTemplate;

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
