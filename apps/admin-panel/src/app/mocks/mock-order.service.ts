// apps/admin-panel/src/app/services/mock-order.service.ts
import { Injectable } from '@angular/core';
import {
  Order,
  OrderCreateDto,
  OrderQueryParams,
  OrderUpdateStatusDto,
  PagedResult,
  User,
  OrderItem,
  BulkStockUpdateDto,
} from '@shoestore/shared-models';
import { Observable, of, throwError } from 'rxjs';
import { delay, map, switchMap } from 'rxjs/operators';
import { ShoeService } from '../pages/shoes/service/shoe.service';
import { UserService } from '../pages/users/services/user.service';

let NEXT_ORDER_ID = 8; // Zakładamy, że wcześniej były ID 1–7

/**
 * Przykładowe zamówienia z danymi pozwalającymi na grupowanie po bucie (shoeCode).
 * Pola `user` w istniejących zamówieniach trzymamy na sztywno.
 */
const MOCK_ORDERS: Order[] = [
  {
    id: 1,
    userId: 1,
    user: {
      id: 1,
      email: 'hurtownia1@example.com',
      contactName: 'Jan Kowalski',
      phone: '123-456-789',
      shippingAddress: {
        street: 'Ul. Długa 1',
        city: 'Warszawa',
        postalCode: '00-001',
        country: 'Polska',
      },
      billingAddress: {
        street: 'Ul. Długa 1',
        city: 'Warszawa',
        postalCode: '00-001',
        country: 'Polska',
      },
      invoiceInfo: {
        companyName: 'Hurtownia XYZ Sp. z o.o.',
        vatNumber: 'PL1234567890',
      },
    },
    date: new Date('2025-05-10T11:23:00Z').toISOString(),
    status: 'placed',
    items: [
      {
        shoeId: 2,
        shoeCode: 'AIRMAX',
        shoeName: 'Nike Air Max',
        size: 37,
        quantity: 20,
        unitPrice: 299,
      },
      {
        shoeId: 2,
        shoeCode: 'AIRMAX',
        shoeName: 'Nike Air Max',
        size: 39,
        quantity: 15,
        unitPrice: 299,
      },
      {
        shoeId: 3,
        shoeCode: 'SUEDE',
        shoeName: 'Puma Suede',
        size: 40,
        quantity: 10,
        unitPrice: 279,
      },
    ],
    totalAmount: 20 * 299 + 15 * 299 + 10 * 279,
  },
  {
    id: 2,
    userId: 2,
    user: {
      id: 2,
      email: 'hurtownia2@example.com',
      contactName: 'Anna Nowak',
      phone: '987-654-321',
      shippingAddress: {
        street: 'Ul. Krótka 5',
        city: 'Kraków',
        postalCode: '30-001',
        country: 'Polska',
      },
      billingAddress: {
        street: 'Ul. Krótka 5',
        city: 'Kraków',
        postalCode: '30-001',
        country: 'Polska',
      },
      invoiceInfo: {
        companyName: 'Firma ABC S.A.',
        vatNumber: 'PL0987654321',
      },
    },
    date: new Date('2025-05-12T09:15:00Z').toISOString(),
    status: 'processing',
    items: [
      {
        shoeId: 1,
        shoeCode: 'SUPERSTAR',
        shoeName: 'Adidas Superstar',
        size: 40,
        quantity: 50,
        unitPrice: 319,
      },
      {
        shoeId: 1,
        shoeCode: 'SUPERSTAR',
        shoeName: 'Adidas Superstar',
        size: 42,
        quantity: 30,
        unitPrice: 319,
      },
    ],
    totalAmount: 50 * 319 + 30 * 319,
  },
  {
    id: 3,
    userId: 1,
    user: {
      id: 1,
      email: 'hurtownia1@example.com',
      contactName: 'Jan Kowalski',
      phone: '123-456-789',
      shippingAddress: {
        street: 'Ul. Długa 1',
        city: 'Warszawa',
        postalCode: '00-001',
        country: 'Polska',
      },
      billingAddress: {
        street: 'Ul. Długa 1',
        city: 'Warszawa',
        postalCode: '00-001',
        country: 'Polska',
      },
      invoiceInfo: {
        companyName: 'Hurtownia XYZ Sp. z o.o.',
        vatNumber: 'PL1234567890',
      },
    },
    date: new Date('2025-05-15T14:30:00Z').toISOString(),
    status: 'completed',
    items: [
      {
        shoeId: 2,
        shoeCode: 'AIRMAX',
        shoeName: 'Nike Air Max',
        size: 42,
        quantity: 10,
        unitPrice: 349,
      },
    ],
    totalAmount: 10 * 349,
  },
  {
    id: 4,
    userId: 2,
    user: {
      id: 2,
      email: 'hurtownia2@example.com',
      contactName: 'Anna Nowak',
      phone: '987-654-321',
      shippingAddress: {
        street: 'Ul. Krótka 5',
        city: 'Kraków',
        postalCode: '30-001',
        country: 'Polska',
      },
      billingAddress: {
        street: 'Ul. Krótka 5',
        city: 'Kraków',
        postalCode: '30-001',
        country: 'Polska',
      },
      invoiceInfo: {
        companyName: 'Firma ABC S.A.',
        vatNumber: 'PL0987654321',
      },
    },
    date: new Date('2025-05-18T10:45:00Z').toISOString(),
    status: 'placed',
    items: [
      {
        shoeId: 4,
        shoeCode: 'RUNSTAR',
        shoeName: 'Puma Run Star',
        size: 38,
        quantity: 25,
        unitPrice: 289,
      },
    ],
    totalAmount: 25 * 289,
  },
  {
    id: 5,
    userId: 1,
    user: {
      id: 1,
      email: 'hurtownia1@example.com',
      contactName: 'Jan Kowalski',
      phone: '123-456-789',
      shippingAddress: {
        street: 'Ul. Długa 1',
        city: 'Warszawa',
        postalCode: '00-001',
        country: 'Polska',
      },
      billingAddress: {
        street: 'Ul. Długa 1',
        city: 'Warszawa',
        postalCode: '00-001',
        country: 'Polska',
      },
      invoiceInfo: {
        companyName: 'Hurtownia XYZ Sp. z o.o.',
        vatNumber: 'PL1234567890',
      },
    },
    date: new Date('2025-05-20T08:20:00Z').toISOString(),
    status: 'processing',
    items: [
      {
        shoeId: 1,
        shoeCode: 'SUPERSTAR',
        shoeName: 'Adidas Superstar',
        size: 36,
        quantity: 40,
        unitPrice: 319,
      },
      {
        shoeId: 1,
        shoeCode: 'SUPERSTAR',
        shoeName: 'Adidas Superstar',
        size: 38,
        quantity: 20,
        unitPrice: 319,
      },
      {
        shoeId: 2,
        shoeCode: 'AIRMAX',
        shoeName: 'Nike Air Max',
        size: 40,
        quantity: 30,
        unitPrice: 329,
      },
    ],
    totalAmount: 40 * 319 + 20 * 319 + 30 * 329,
  },
  {
    id: 6,
    userId: 2,
    user: {
      id: 2,
      email: 'hurtownia2@example.com',
      contactName: 'Anna Nowak',
      phone: '987-654-321',
      shippingAddress: {
        street: 'Ul. Krótka 5',
        city: 'Kraków',
        postalCode: '30-001',
        country: 'Polska',
      },
      billingAddress: {
        street: 'Ul. Krótka 5',
        city: 'Kraków',
        postalCode: '30-001',
        country: 'Polska',
      },
      invoiceInfo: {
        companyName: 'Firma ABC S.A.',
        vatNumber: 'PL0987654321',
      },
    },
    date: new Date('2025-05-22T16:10:00Z').toISOString(),
    status: 'completed',
    items: [
      {
        shoeId: 3,
        shoeCode: 'SUEDE',
        shoeName: 'Puma Suede',
        size: 37,
        quantity: 5,
        unitPrice: 279,
      },
      {
        shoeId: 3,
        shoeCode: 'SUEDE',
        shoeName: 'Puma Suede',
        size: 39,
        quantity: 10,
        unitPrice: 279,
      },
      {
        shoeId: 5,
        shoeCode: 'TOKYO',
        shoeName: 'Nike Tokyo Runner',
        size: 41,
        quantity: 8,
        unitPrice: 359,
      },
    ],
    totalAmount: 5 * 279 + 10 * 279 + 8 * 359,
  },
  {
    id: 7,
    userId: 1,
    user: {
      id: 1,
      email: 'hurtownia1@example.com',
      contactName: 'Jan Kowalski',
      phone: '123-456-789',
      shippingAddress: {
        street: 'Ul. Długa 1',
        city: 'Warszawa',
        postalCode: '00-001',
        country: 'Polska',
      },
      billingAddress: {
        street: 'Ul. Długa 1',
        city: 'Warszawa',
        postalCode: '00-001',
        country: 'Polska',
      },
      invoiceInfo: {
        companyName: 'Hurtownia XYZ Sp. z o.o.',
        vatNumber: 'PL1234567890',
      },
    },
    date: new Date('2025-05-25T12:00:00Z').toISOString(),
    status: 'cancelled',
    items: [
      {
        shoeId: 4,
        shoeCode: 'RUNSTAR',
        shoeName: 'Puma Run Star',
        size: 39,
        quantity: 12,
        unitPrice: 289,
      },
      {
        shoeId: 4,
        shoeCode: 'RUNSTAR',
        shoeName: 'Puma Run Star',
        size: 40,
        quantity: 5,
        unitPrice: 289,
      },
    ],
    totalAmount: 12 * 289 + 5 * 289,
  },
];

@Injectable()
export class MockOrderService {
  private data = [...MOCK_ORDERS];

  constructor(
    private shoeService: ShoeService,
    private userService: UserService
  ) {}

  /**
   * Pobiera listę zamówień wg parametrów (filtrowanie, sortowanie, paginacja).
   */
  getOrders(params: OrderQueryParams = {}): Observable<PagedResult<Order>> {
    let items = this.data;

    // Filtrowanie po statusie
    if (params.status) {
      items = items.filter((o) => o.status === params.status);
    }

    // Filtrowanie po wyszukiwaniu (po ID lub po emailu użytkownika)
    if (params.search) {
      const term = params.search.toLowerCase();
      items = items.filter(
        (o) =>
          o.id.toString().includes(term) ||
          !!o.user?.email.toLowerCase().includes(term)
      );
    }

    // Sortowanie
    if (params.sortBy) {
      items = items.sort((a, b) => {
        let fieldA: any, fieldB: any;
        switch (params.sortBy) {
          case 'date':
            fieldA = a.date;
            fieldB = b.date;
            break;
          case 'status':
            fieldA = a.status;
            fieldB = b.status;
            break;
          case 'totalAmount':
            fieldA = a.totalAmount;
            fieldB = b.totalAmount;
            break;
          default:
            fieldA = a.date;
            fieldB = b.date;
        }
        if (fieldA < fieldB) return params.sortDirection === 'asc' ? -1 : 1;
        if (fieldA > fieldB) return params.sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    const total = items.length;
    const page = params.page ?? 1;
    const size = params.pageSize ?? 10;
    const start = (page - 1) * size;
    const paged = items.slice(start, start + size);

    // Zwrot kopii (bez mutacji oryginału)
    const result: PagedResult<Order> = {
      items: paged.map((o) => ({
        ...o,
        items: o.items.map((i) => ({ ...i })),
        user: o.user ? { ...o.user } : undefined,
      })),
      total,
      page,
      pageSize: size,
    };
    return of(result).pipe(delay(300));
  }

  /**
   * Pobieranie pojedynczego zamówienia.
   */
  getOrderById(id: number): Observable<Order> {
    const found = this.data.find((o) => o.id === id);
    if (!found) {
      return throwError(() => new Error(`Zamówienie o id ${id} nie istnieje`));
    }
    return of({
      ...found,
      items: found.items.map((i) => ({ ...i })),
      user: found.user ? { ...found.user } : undefined,
    }).pipe(delay(200));
  }

  /**
   * Tworzy nowe zamówienie w mocku na bazie faktycznych danych z magazynu.
   *  - Jeśli podano userId, pobieramy User przez UserService.
   *  - W przeciwnym razie traktujemy jako „gość” (user zostaje undefined).
   *  - Status = 'completed' (bo „zrealizowane poza systemem”).
   *  - Po utworzeniu order, aktualizujemy stan magazynowy przez bulkUpdateStock.
   */
  createOrder(dto: OrderCreateDto): Observable<Order> {

    const buildOrderAndDto = (associatedUser: User | undefined) => {
      // 1) Pobierz wszystkie buty (stan) z backendu przez getRawData()
      const allShoes = structuredClone(this.shoeService.getRawData());

      // 2) Przygotuj tablicę OrderItem i zbierz deltaQuantity do BulkStockUpdateDto
      const orderItems: OrderItem[] = [];
      const bulkDto: BulkStockUpdateDto = { items: [] };

      dto.items.forEach((i) => {
        const shoe = allShoes.find((s) => s.id === i.shoeId);
        if (!shoe) {
          throw new Error(`But o id ${i.shoeId} nie istnieje`);
        }

        const sizeEntry = shoe.sizes.find((sz) => sz.size === i.size);
        if (!sizeEntry) {
          throw new Error(
            `But ID ${i.shoeId} nie ma rozmiaru ${i.size} w magazynie`
          );
        }

        // Pobierz cenę, kod i nazwę (z oryginalnego obiektu Shoe):
        const unitPrice = sizeEntry.price;
        const shoeCode = shoe.code;
        const shoeName = shoe.name;

        // Przygotowujemy pozycję do zamówienia:
        orderItems.push({
          shoeId: i.shoeId,
          shoeCode,
          shoeName,
          size: i.size,
          quantity: i.quantity,
          unitPrice,
        });

        // Przygotowujemy zmniejszenie stanu magazynowego:
        bulkDto.items.push({
          shoeId: i.shoeId,
          size: i.size,
          deltaQuantity: -i.quantity,
        });
      });

      // 3) Oblicz sumaryczną wartość:
      const totalAmount = orderItems.reduce(
        (sum, it) => sum + it.unitPrice * it.quantity,
        0
      );

      // 4) Zbuduj obiekt zamówienia
      const newOrder: Order = {
        id: NEXT_ORDER_ID++,
        userId: dto.userId ?? 0,
        user: associatedUser ? { ...associatedUser } : undefined,
        date: new Date().toISOString(),
        status: 'completed', // „zrealizowane poza systemem”
        items: orderItems,
        totalAmount,
      };

      return { newOrder, bulkDto };
    };

    if (dto.userId != null) {
      // Jeśli podano userId, pobierz user przez UserService
      return this.userService.getUserById(dto.userId).pipe(
        switchMap((user) => {
          const { newOrder, bulkDto } = buildOrderAndDto(user);
          // Zaktualizuj stan magazynowy w ShoeService
          return this.shoeService.bulkUpdateStock(bulkDto).pipe(
            map(() => {
              // Dodaj nowe zamówienie dopiero po aktualizacji stanów
              this.data.push(newOrder);
              return {
                ...newOrder,
                items: newOrder.items.map((i) => ({ ...i })),
                user: newOrder.user ? { ...newOrder.user } : undefined,
              };
            })
          );
        }),
        delay(300)
      );
    } else {
      // Gość → nie pobieramy usera
      const { newOrder, bulkDto } = buildOrderAndDto(undefined);
      return this.shoeService.bulkUpdateStock(bulkDto).pipe(
        map(() => {
          this.data.push(newOrder);
          return {
            ...newOrder,
            items: newOrder.items.map((i) => ({ ...i })),
            user: newOrder.user ? { ...newOrder.user } : undefined,
          };
        }),
        delay(300)
      );
    }
  }

  /**
   * Aktualizacja statusu zamówienia.
   */
  updateOrderStatus(
    id: number,
    dto: OrderUpdateStatusDto
  ): Observable<Order> {
    const idx = this.data.findIndex((o) => o.id === id);
    if (idx < 0) {
      return throwError(() => new Error(`Zamówienie o id ${id} nie istnieje`));
    }
    this.data[idx].status = dto.status;
    return of({
      ...this.data[idx],
      items: this.data[idx].items.map((i) => ({ ...i })),
      user: this.data[idx].user ? { ...this.data[idx].user! } : undefined,
    }).pipe(delay(200));
  }
}
