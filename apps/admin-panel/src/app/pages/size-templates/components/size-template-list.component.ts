import { CommonModule } from '@angular/common';
import { Component, effect, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SizeTemplate } from '@shoestore/shared-models';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { SizeTemplateService } from '../../shoes/service/size-template.service';

@Component({
  selector: 'app-size-template-list',
  standalone: true,
  imports: [CommonModule, RouterModule, TableModule, ButtonModule, ToastModule],
  templateUrl: './size-template-list.component.html',
  styleUrls: ['./size-template-list.component.scss'],
})
export class SizeTemplateListComponent {
  private service = inject(SizeTemplateService);
  private messageService = inject(MessageService);
  private refetchTrigger = signal(0); // używane do ponownego załadowania danych
  private confirmation = inject(ConfirmationService);

  templates = signal<SizeTemplate[]>([]);

  constructor() {
    // automatyczne ładowanie danych, gdy zmienia się trigger
    effect(() => {
      this.service.getAllTemplates().subscribe((data) => {
        this.templates.set(data);
      });
      this.refetchTrigger(); // wymusza zależność, nawet jeśli nie używana w subskrypcji
    });
  }

  onDelete(template: SizeTemplate) {
    this.confirmation.confirm({
      header: 'Potwierdzenie usunięcia',
      message: `Czy usunąć szablon ${template.name}?`,
      accept: () => this.delete(template),
    });
  }

  private delete(template: SizeTemplate) {
    this.service.delete(template.id).subscribe(() => {
      this.messageService.add({
        severity: 'info',
        summary: 'Usunięto',
        detail: `Szablon ${template.id} usunięty`,
      });
      this.refetchTrigger.update((n) => n + 1); // wyzwala ponowne pobranie listy
    });
  }
}
