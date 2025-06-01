import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { User } from '@shoestore/shared-models';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule, CardModule],
  templateUrl: './user-detail.component.html',
})
export class UserDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private userService = inject(UserService);
  private message = inject(MessageService);

  user = signal<User | null>(null);
  loading = signal(false);

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      this.router.navigate(['/users']);
      return;
    }
    const userId = +idParam;
    this.loadUser(userId);
  }

  private loadUser(id: number): void {
    this.loading.set(true);
    this.userService.getUserById(id).subscribe({
      next: (u) => {
        this.user.set(u);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.message.add({
          severity: 'error',
          summary: 'Błąd',
          detail: err.message,
        });
        this.router.navigate(['/users']);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/users']);
  }

  /**
   * Przejście do listy zamówień odfiltrowanej po e-mailu tego użytkownika.
   * W QueryParams wpisujemy search = adres e-mail.
   */
  goToUserOrders(): void {
    const u = this.user();
    if (u?.email) {
      this.router.navigate(['/orders'], {
        queryParams: { search: u.email, page: 1 },
      });
    }
  }
}
