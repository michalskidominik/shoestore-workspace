import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Shoe } from '@shoestore/shared-models';
import { ProductFilters } from './product.service';

@Injectable({
  providedIn: 'root'
})
export class ProductApiService {
  // ============================================
  // MOCK DATA - Will be replaced with real backend calls
  // ============================================

  private mockShoes: Shoe[] = [
    {
      id: 1,
      code: 'AIR-MAX-001',
      name: 'Nike Air Max Classic',
      imageUrl: 'https://www.tradeinn.com/f/14109/141097461/adidas-runfalcon-5-buty-do-biegania.webp',
      visible: true,
      templateId: 1,
      category: 'sneakers',
      sizes: [
        { size: 40, price: 45.99, quantity: 15 },
        { size: 41, price: 45.99, quantity: 23 },
        { size: 42, price: 45.99, quantity: 18 },
        { size: 43, price: 45.99, quantity: 12 },
        { size: 44, price: 45.99, quantity: 8 },
        { size: 45, price: 45.99, quantity: 5 },
      ],
    },
    {
      id: 2,
      code: 'AD-UB-002',
      name: 'Adidas Ultraboost 22',
      imageUrl: 'https://www.eva-sport.pl/3416-large_default/buty-damskie-reebok-royal-cl-jogger-.jpg',
      visible: true,
      templateId: 1,
      category: 'sneakers',
      sizes: [
        { size: 39, price: 89.99, quantity: 14 },
        { size: 40, price: 89.99, quantity: 27 },
        { size: 41, price: 89.99, quantity: 13 },
        { size: 42, price: 89.99, quantity: 19 },
        { size: 43, price: 89.99, quantity: 11 },
        { size: 44, price: 89.99, quantity: 6 },
      ],
    },
    {
      id: 3,
      code: 'PUM-RS-003',
      name: 'Puma RS-X Reinvention',
      imageUrl: 'https://www.tradeinn.com/f/14109/141097461/adidas-runfalcon-5-buty-do-biegania.webp',
      visible: true,
      templateId: 1,
      category: 'sneakers',
      sizes: [
        { size: 38, price: 52.99, quantity: 16 },
        { size: 39, price: 52.99, quantity: 28 },
        { size: 40, price: 52.99, quantity: 14 },
        { size: 41, price: 52.99, quantity: 17 },
        { size: 42, price: 52.99, quantity: 13 },
        { size: 43, price: 52.99, quantity: 9 },
      ],
    },
    {
      id: 4,
      code: 'NB-990-004',
      name: 'New Balance 990v5',
      imageUrl: 'https://www.tradeinn.com/f/14109/141097461/adidas-runfalcon-5-buty-do-biegania.webp',
      visible: true,
      templateId: 1,
      category: 'sneakers',
      sizes: [
        { size: 40, price: 124.99, quantity: 8 },
        { size: 41, price: 124.99, quantity: 15 },
        { size: 42, price: 124.99, quantity: 7 },
        { size: 43, price: 124.99, quantity: 12 },
        { size: 44, price: 124.99, quantity: 6 },
      ],
    },
    {
      id: 5,
      code: 'CON-CT-005',
      name: 'Converse Chuck Taylor All Star',
      imageUrl: 'https://www.eva-sport.pl/3416-large_default/buty-damskie-reebok-royal-cl-jogger-.jpg',
      visible: true,
      templateId: 1,
      category: 'sneakers',
      sizes: [
        { size: 37, price: 32.99, quantity: 25 },
        { size: 38, price: 32.99, quantity: 18 },
        { size: 39, price: 32.99, quantity: 22 },
        { size: 40, price: 32.99, quantity: 19 },
        { size: 41, price: 32.99, quantity: 16 },
        { size: 42, price: 32.99, quantity: 14 },
        { size: 43, price: 32.99, quantity: 11 },
      ],
    },
    {
      id: 6,
      code: 'VAN-SK8-006',
      name: 'Vans Sk8-Hi',
      imageUrl: 'https://www.tradeinn.com/f/14111/141113410_4/adidas-runfalcon-5-buty-do-biegania.webp',
      visible: true,
      templateId: 1,
      category: 'boots',
      sizes: [
        { size: 38, price: 67.99, quantity: 12 },
        { size: 39, price: 67.99, quantity: 16 },
        { size: 40, price: 67.99, quantity: 20 },
        { size: 41, price: 67.99, quantity: 13 },
        { size: 42, price: 67.99, quantity: 15 },
        { size: 43, price: 67.99, quantity: 8 },
      ],
    },
    {
      id: 7,
      code: 'ASC-GEL-007',
      name: 'ASICS Gel-Kayano 29',
      imageUrl: 'https://www.tradeinn.com/f/14109/141097461/adidas-runfalcon-5-buty-do-biegania.webp',
      visible: true,
      templateId: 1,
      category: 'sneakers',
      sizes: [
        { size: 39, price: 109.99, quantity: 9 },
        { size: 40, price: 109.99, quantity: 17 },
        { size: 41, price: 109.99, quantity: 14 },
        { size: 42, price: 109.99, quantity: 16 },
        { size: 43, price: 109.99, quantity: 7 },
        { size: 44, price: 109.99, quantity: 12 },
      ],
    },
    {
      id: 8,
      code: 'REEBOK-CL-008',
      name: 'Reebok Classic Leather',
      imageUrl: 'https://www.eva-sport.pl/3416-large_default/buty-damskie-reebok-royal-cl-jogger-.jpg',
      visible: true,
      templateId: 1,
      category: 'dress',
      sizes: [
        { size: 38, price: 42.99, quantity: 21 },
        { size: 39, price: 42.99, quantity: 18 },
        { size: 40, price: 42.99, quantity: 24 },
        { size: 41, price: 42.99, quantity: 16 },
        { size: 42, price: 42.99, quantity: 19 },
        { size: 43, price: 42.99, quantity: 13 },
      ],
    },
    {
      id: 9,
      code: 'NIK-DH-009',
      name: 'Nike Dunk High Retro',
      imageUrl: 'https://www.tradeinn.com/f/14109/141097461/adidas-runfalcon-5-buty-do-biegania.webp',
      visible: true,
      templateId: 1,
      category: 'boots',
      sizes: [
        { size: 40, price: 78.99, quantity: 6 },
        { size: 41, price: 78.99, quantity: 9 },
        { size: 42, price: 78.99, quantity: 4 },
        { size: 43, price: 78.99, quantity: 7 },
        { size: 44, price: 78.99, quantity: 3 },
      ],
    },
    {
      id: 10,
      code: 'AD-SB-010',
      name: 'Adidas Samba Classic',
      imageUrl: 'https://www.eva-sport.pl/3416-large_default/buty-damskie-reebok-royal-cl-jogger-.jpg',
      visible: true,
      templateId: 1,
      category: 'dress',
      sizes: [
        { size: 39, price: 65.99, quantity: 0 },
        { size: 40, price: 65.99, quantity: 11 },
        { size: 41, price: 65.99, quantity: 8 },
        { size: 42, price: 65.99, quantity: 14 },
        { size: 43, price: 65.99, quantity: 6 },
      ],
    }
  ];

  // ============================================
  // API METHODS - These mock backend filtering and sorting
  // In production, these would be HTTP calls to the backend
  // ============================================

  /**
   * Get all products with backend filtering and sorting applied
   * This method simulates what a real backend would do - receive filters and return filtered/sorted results
   */
  getFilteredAndSortedProducts(filters: ProductFilters): Observable<Shoe[]> {
    // TODO: Replace with real HTTP call to backend API
    // Example: return this.http.get<Shoe[]>('/api/products/search', { params: filters });

    let filtered = [...this.mockShoes];

    // Apply search filter
    if (filters.searchTerm?.trim()) {
      const searchTerm = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchTerm) || 
        product.code.toLowerCase().includes(searchTerm)
      );
    }

    // Apply brand filter
    if (filters.selectedBrands && filters.selectedBrands.length > 0) {
      filtered = filtered.filter(product => {
        const productBrand = product.name.split(' ')[0].toLowerCase();
        return filters.selectedBrands!.some(brand => 
          brand.toLowerCase() === productBrand
        );
      });
    }

    // Apply category filter
    if (filters.selectedCategories && filters.selectedCategories.length > 0) {
      filtered = filtered.filter(product => 
        filters.selectedCategories!.includes(product.category || 'sneakers')
      );
    }

    // Apply availability filter
    if (filters.selectedAvailability && filters.selectedAvailability.length > 0) {
      filtered = filtered.filter(product => {
        const totalStock = product.sizes.reduce((sum, size) => sum + size.quantity, 0);
        return filters.selectedAvailability!.some(availability => {
          switch (availability) {
            case 'in-stock': return totalStock > 50;
            case 'low-stock': return totalStock > 0 && totalStock <= 50;
            case 'pre-order': return totalStock === 0;
            case 'made-to-order': return product.name.toLowerCase().includes('custom');
            default: return false;
          }
        });
      });
    }

    // Apply sorting
    const [sortField, sortDirection] = filters.sortBy.split('-');
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'price':
          const priceA = Math.min(...a.sizes.map(size => size.price));
          const priceB = Math.min(...b.sizes.map(size => size.price));
          comparison = priceA - priceB;
          break;
        case 'stock':
          const stockA = a.sizes.reduce((sum, size) => sum + size.quantity, 0);
          const stockB = b.sizes.reduce((sum, size) => sum + size.quantity, 0);
          comparison = stockA - stockB;
          break;
      }
      return sortDirection === 'desc' ? -comparison : comparison;
    });

    return of(filtered);
  }

  /**
   * Get all products without any filtering (raw data)
   * This would be used for initial data loading before applying filters
   */
  getAllProducts(): Observable<Shoe[]> {
    // TODO: Replace with real HTTP call to backend API
    // Example: return this.http.get<Shoe[]>('/api/products');
    return of([...this.mockShoes]);
  }
}