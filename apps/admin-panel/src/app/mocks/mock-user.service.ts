// apps/admin-panel/src/app/mocks/mock-user.service.ts

import { Injectable } from '@angular/core';
import { PagedResult, User } from '@shoestore/shared-models';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';

const MOCK_USERS: User[] = [
  {
    id: 1,
    invoiceInfo: {
      companyName: 'Hurtownia XYZ Sp. z o.o.',
      vatNumber: 'PL1234567890',
    },
    billingAddress: {
      street: 'Ul. Długa 1',
      city: 'Warszawa',
      postalCode: '00-001',
      country: 'Polska',
    },
    shippingAddress: {
      street: 'Ul. Długa 1',
      city: 'Warszawa',
      postalCode: '00-001',
      country: 'Polska',
    },
    phone: '123-456-789',
    email: 'hurtownia1@example.com',
    contactName: 'Jan Kowalski',
  },
  {
    id: 2,
    invoiceInfo: {
      companyName: 'Sklep ABC S.A.',
      vatNumber: 'PL0987654321',
    },
    billingAddress: {
      street: 'Ul. Krótka 5',
      city: 'Kraków',
      postalCode: '30-001',
      country: 'Polska',
    },
    shippingAddress: {
      street: 'Ul. Krótka 5',
      city: 'Kraków',
      postalCode: '30-001',
      country: 'Polska',
    },
    phone: '987-654-321',
    email: 'hurtownia2@example.com',
    contactName: 'Anna Nowak',
  },
  {
    id: 3,
    invoiceInfo: {
      companyName: 'Firma QWE Sp. z o.o.',
      vatNumber: 'PL1122334455',
    },
    billingAddress: {
      street: 'Ul. Szeroka 10',
      city: 'Gdańsk',
      postalCode: '80-001',
      country: 'Polska',
    },
    shippingAddress: {
      street: 'Ul. Szeroka 10',
      city: 'Gdańsk',
      postalCode: '80-001',
      country: 'Polska',
    },
    phone: '456-789-123',
    email: 'hurtownia3@example.com',
    contactName: 'Piotr Wiśniewski',
  },
];

@Injectable()
export class MockUserService {
  private data = [...MOCK_USERS];

  getUsers(
    params: { page?: number; pageSize?: number; search?: string } = {}
  ): Observable<PagedResult<User>> {
    let items = this.data;

    if (params.search) {
      const term = params.search.toLowerCase();
      items = items.filter(
        (u) =>
          u.invoiceInfo.companyName.toLowerCase().includes(term) ||
          u.email.toLowerCase().includes(term) ||
          u.invoiceInfo.vatNumber.toLowerCase().includes(term)
      );
    }

    // prosta paginacja w pamięci
    const total = items.length;
    const page = params.page ?? 1;
    const size = params.pageSize ?? 10;
    const start = (page - 1) * size;
    const paged = items.slice(start, start + size);

    const result: PagedResult<User> = {
      items: paged.map((u) => ({ ...u })), // kopia
      total,
      page,
      pageSize: size,
    };

    return of(result).pipe(delay(200));
  }

  getAllUsers(): Observable<User[]> {
    return of(this.data.map((u) => ({ ...u }))).pipe(delay(200));
  }

  getUserById(id: number): Observable<User> {
    const found = this.data.find((u) => u.id === id);
    if (!found) {
      return throwError(() => new Error(`Klient o id ${id} nie istnieje`));
    }
    return of({ ...found }).pipe(delay(100));
  }
}
