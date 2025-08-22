import { Injectable } from '@angular/core';
import { Shoe, SizeTemplate } from '@shoestore/shared-models';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private mockSizeTemplates: SizeTemplate[] = [
    {
      id: 1,
      name: 'EU Standard',
      pairs: [
        { eu: 36, us: 6 },
        { eu: 37, us: 6.5 },
        { eu: 38, us: 7 },
        { eu: 39, us: 7.5 },
        { eu: 40, us: 8 },
        { eu: 41, us: 8.5 },
        { eu: 42, us: 9 },
        { eu: 43, us: 9.5 },
        { eu: 44, us: 10 },
        { eu: 45, us: 10.5 },
        { eu: 46, us: 11 },
      ],
    },
    {
      id: 2,
      name: 'EU Women',
      pairs: [
        { eu: 35, us: 5 },
        { eu: 36, us: 5.5 },
        { eu: 37, us: 6 },
        { eu: 38, us: 6.5 },
        { eu: 39, us: 7 },
        { eu: 40, us: 7.5 },
        { eu: 41, us: 8 },
        { eu: 42, us: 8.5 },
      ],
    },
  ];

  private mockShoes: Shoe[] = [
    {
      id: 1,
      code: 'AIR-MAX-001',
      name: 'Nike Air Max Classic',
      imageUrl:
        'https://www.tradeinn.com/f/14109/141097461/adidas-runfalcon-5-buty-do-biegania.webp',
      visible: true,
      templateId: 1,
      sizes: [
        { size: 40, price: 299.99, quantity: 5 },
        { size: 41, price: 299.99, quantity: 3 },
        { size: 42, price: 299.99, quantity: 8 },
        { size: 43, price: 299.99, quantity: 2 },
        { size: 44, price: 299.99, quantity: 6 },
      ],
    },
    {
      id: 2,
      code: 'AD-UB-002',
      name: 'Adidas Ultraboost 22',
      imageUrl:
        'https://www.eva-sport.pl/3416-large_default/buty-damskie-reebok-royal-cl-jogger-.jpg',
      visible: true,
      templateId: 1,
      sizes: [
        { size: 39, price: 399.99, quantity: 4 },
        { size: 40, price: 399.99, quantity: 7 },
        { size: 41, price: 399.99, quantity: 3 },
        { size: 42, price: 399.99, quantity: 9 },
        { size: 43, price: 399.99, quantity: 1 },
        { size: 44, price: 399.99, quantity: 5 },
      ],
    },
    {
      id: 3,
      code: 'PUM-RS-003',
      name: 'Puma RS-X Reinvention',
      imageUrl:
        'https://www.tradeinn.com/f/14109/141097461/adidas-runfalcon-5-buty-do-biegania.webp',
      visible: true,
      templateId: 1,
      sizes: [
        { size: 38, price: 249.99, quantity: 6 },
        { size: 39, price: 249.99, quantity: 8 },
        { size: 40, price: 249.99, quantity: 4 },
        { size: 41, price: 249.99, quantity: 7 },
        { size: 42, price: 249.99, quantity: 3 },
        { size: 43, price: 249.99, quantity: 2 },
      ],
    },
    {
      id: 4,
      code: 'NB-990-004',
      name: 'New Balance 990v5',
      imageUrl:
        'https://www.tradeinn.com/f/14109/141097461/adidas-runfalcon-5-buty-do-biegania.webp',
      visible: true,
      templateId: 1,
      sizes: [
        { size: 40, price: 549.99, quantity: 3 },
        { size: 41, price: 549.99, quantity: 5 },
        { size: 42, price: 549.99, quantity: 2 },
        { size: 43, price: 549.99, quantity: 4 },
        { size: 44, price: 549.99, quantity: 6 },
      ],
    },
    {
      id: 5,
      code: 'CON-CT-005',
      name: 'Converse Chuck Taylor All Star',
      imageUrl:
        'https://www.eva-sport.pl/3416-large_default/buty-damskie-reebok-royal-cl-jogger-.jpg',
      visible: true,
      templateId: 1,
      sizes: [
        { size: 37, price: 199.99, quantity: 8 },
        { size: 38, price: 199.99, quantity: 6 },
        { size: 39, price: 199.99, quantity: 9 },
        { size: 40, price: 199.99, quantity: 5 },
        { size: 41, price: 199.99, quantity: 7 },
        { size: 42, price: 199.99, quantity: 4 },
        { size: 43, price: 199.99, quantity: 3 },
      ],
    },
    {
      id: 6,
      code: 'VAN-SK8-006',
      name: 'Vans Sk8-Hi',
      imageUrl:
        'https://www.tradeinn.com/f/14111/141113410_4/adidas-runfalcon-5-buty-do-biegania.webp',
      visible: true,
      templateId: 1,
      sizes: [
        { size: 38, price: 279.99, quantity: 4 },
        { size: 39, price: 279.99, quantity: 6 },
        { size: 40, price: 279.99, quantity: 8 },
        { size: 41, price: 279.99, quantity: 3 },
        { size: 42, price: 279.99, quantity: 5 },
        { size: 43, price: 279.99, quantity: 2 },
      ],
    },
    {
      id: 7,
      code: 'ASC-GEL-007',
      name: 'ASICS Gel-Kayano 29',
      imageUrl:
        'https://www.tradeinn.com/f/14109/141097461/adidas-runfalcon-5-buty-do-biegania.webp',
      visible: true,
      templateId: 1,
      sizes: [
        { size: 39, price: 459.99, quantity: 5 },
        { size: 40, price: 459.99, quantity: 7 },
        { size: 41, price: 459.99, quantity: 4 },
        { size: 42, price: 459.99, quantity: 6 },
        { size: 43, price: 459.99, quantity: 3 },
        { size: 44, price: 459.99, quantity: 8 },
      ],
    },
    {
      id: 8,
      code: 'REEBOK-CL-008',
      name: 'Reebok Classic Leather',
      imageUrl:
        'https://www.eva-sport.pl/3416-large_default/buty-damskie-reebok-royal-cl-jogger-.jpg',
      visible: true,
      templateId: 1,
      sizes: [
        { size: 38, price: 229.99, quantity: 9 },
        { size: 39, price: 229.99, quantity: 6 },
        { size: 40, price: 229.99, quantity: 7 },
        { size: 41, price: 229.99, quantity: 4 },
        { size: 42, price: 229.99, quantity: 5 },
        { size: 43, price: 229.99, quantity: 3 },
      ],
    },
  ];

  getShoes(): Observable<Shoe[]> {
    return of(this.mockShoes);
  }

  getSizeTemplates(): Observable<SizeTemplate[]> {
    return of(this.mockSizeTemplates);
  }

  getSizeTemplate(templateId: number): SizeTemplate | undefined {
    return this.mockSizeTemplates.find(
      (template) => template.id === templateId
    );
  }

  // Pomocnicze metody dla filtrowania i sortowania
  getAvailableBrands(): string[] {
    const brands = new Set<string>();
    this.mockShoes.forEach((shoe) => {
      const brand = shoe.name.split(' ')[0]; // Pobieramy pierwszą część nazwy jako markę
      brands.add(brand);
    });
    return Array.from(brands).sort();
  }

  filterShoes(shoes: Shoe[], searchTerm?: string, brand?: string): Shoe[] {
    let filtered = [...shoes];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (shoe) =>
          shoe.name.toLowerCase().includes(term) ||
          shoe.code.toLowerCase().includes(term)
      );
    }

    if (brand && brand !== 'all') {
      filtered = filtered.filter((shoe) =>
        shoe.name.toLowerCase().startsWith(brand.toLowerCase())
      );
    }

    return filtered;
  }

  sortShoes(
    shoes: Shoe[],
    sortBy: 'name' | 'price' | 'code',
    direction: 'asc' | 'desc' = 'asc'
  ): Shoe[] {
    return [...shoes].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'code':
          comparison = a.code.localeCompare(b.code);
          break;
        case 'price':
          {
            const minPriceA = Math.min(...a.sizes.map((s: { price: any; }) => s.price));
            const minPriceB = Math.min(...b.sizes.map((s: { price: any; }) => s.price));
            comparison = minPriceA - minPriceB;
          }
          break;
      }

      return direction === 'desc' ? -comparison : comparison;
    });
  }
}
