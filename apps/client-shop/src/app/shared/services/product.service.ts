import { Injectable } from '@angular/core';
import { Shoe, SizeTemplate } from '@shoestore/shared-models';
import { Observable, of } from 'rxjs';

// Interface for filtering options
export interface ProductFilters {
  searchTerm?: string;
  brands?: string[];
  categories?: string[];
  availability?: string[];
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
}

// Interface for sorting options
export interface ProductSort {
  field: 'name' | 'price' | 'code' | 'stock';
  direction: 'asc' | 'desc';
}

// Product category enumeration
export interface ProductCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
}

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  // ============================================
  // DEVELOPMENT MOCK DATA - TO BE REPLACED WITH REAL BACKEND CALLS
  // ============================================

  private mockCategories: ProductCategory[] = [
    { id: 'all', name: 'All Categories', icon: 'pi pi-list', description: 'Show all footwear' },
    { id: 'sneakers', name: 'Sneakers', icon: 'pi pi-circle', description: 'Athletic and casual sneakers' },
    { id: 'dress', name: 'Dress Shoes', icon: 'pi pi-star', description: 'Formal and business shoes' },
    { id: 'boots', name: 'Boots', icon: 'pi pi-shield', description: 'Boots and ankle boots' },
    { id: 'sandals', name: 'Sandals', icon: 'pi pi-sun', description: 'Summer footwear' }
  ];
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
      category: 'sneakers', // Added category field for backend filtering
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
      imageUrl:
        'https://www.eva-sport.pl/3416-large_default/buty-damskie-reebok-royal-cl-jogger-.jpg',
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
      imageUrl:
        'https://www.tradeinn.com/f/14109/141097461/adidas-runfalcon-5-buty-do-biegania.webp',
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
      imageUrl:
        'https://www.tradeinn.com/f/14109/141097461/adidas-runfalcon-5-buty-do-biegania.webp',
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
      imageUrl:
        'https://www.eva-sport.pl/3416-large_default/buty-damskie-reebok-royal-cl-jogger-.jpg',
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
      imageUrl:
        'https://www.tradeinn.com/f/14111/141113410_4/adidas-runfalcon-5-buty-do-biegania.webp',
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
      imageUrl:
        'https://www.tradeinn.com/f/14109/141097461/adidas-runfalcon-5-buty-do-biegania.webp',
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
      imageUrl:
        'https://www.eva-sport.pl/3416-large_default/buty-damskie-reebok-royal-cl-jogger-.jpg',
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
      imageUrl:
        'https://www.tradeinn.com/f/14109/141097461/adidas-runfalcon-5-buty-do-biegania.webp',
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
      imageUrl:
        'https://www.eva-sport.pl/3416-large_default/buty-damskie-reebok-royal-cl-jogger-.jpg',
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
  // MAIN API METHODS - SIMULATING BACKEND CALLS
  // ============================================

  getShoes(filters?: ProductFilters, sort?: ProductSort): Observable<Shoe[]> {
    // TODO: Replace with real HTTP call to backend API
    // Example: return this.http.get<Shoe[]>('/api/products', { params: { ...filters, ...sort } });

    let filtered = [...this.mockShoes];

    // Apply filters (DEVELOPMENT ONLY - should be done on backend)
    if (filters) {
      filtered = this.applyFilters(filtered, filters);
    }

    // Apply sorting (DEVELOPMENT ONLY - should be done on backend)
    if (sort) {
      filtered = this.applySorting(filtered, sort);
    }

    return of(filtered);
  }

  getCategories(): Observable<ProductCategory[]> {
    // TODO: Replace with real HTTP call to backend API
    // Example: return this.http.get<ProductCategory[]>('/api/categories');
    return of(this.mockCategories);
  }

  getBrands(): Observable<string[]> {
    // TODO: Replace with real HTTP call to backend API
    // Example: return this.http.get<string[]>('/api/brands');

    // DEVELOPMENT ONLY - Extract brands from mock data
    const brands = new Set<string>();
    this.mockShoes.forEach(shoe => {
      const brand = shoe.name.split(' ')[0];
      brands.add(brand);
    });
    return of(Array.from(brands).sort());
  }

  getBrandStats(): Observable<Record<string, number>> {
    // TODO: Replace with real HTTP call to backend API
    // Example: return this.http.get<Record<string, number>>('/api/brands/stats');

    // DEVELOPMENT ONLY - Calculate brand counts from mock data
    const counts: Record<string, number> = {};
    this.mockShoes.forEach(shoe => {
      const brand = shoe.name.split(' ')[0];
      counts[brand] = (counts[brand] || 0) + 1;
    });
    return of(counts);
  }

  getSizeTemplates(): Observable<SizeTemplate[]> {
    return of(this.mockSizeTemplates);
  }

  getSizeTemplate(templateId: number): SizeTemplate | undefined {
    return this.mockSizeTemplates.find(
      (template) => template.id === templateId
    );
  }

  // ============================================
  // PRIVATE METHODS - DEVELOPMENT ONLY
  // These methods simulate backend filtering/sorting logic
  // In production, all filtering and sorting should be done on the backend
  // ============================================

  private applyFilters(shoes: Shoe[], filters: ProductFilters): Shoe[] {
    let filtered = [...shoes];

    // Search filter
    if (filters.searchTerm?.trim()) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(shoe =>
        shoe.name.toLowerCase().includes(term) ||
        shoe.code.toLowerCase().includes(term)
      );
    }

    // Brands filter (multi-select)
    if (filters.brands && filters.brands.length > 0) {
      filtered = filtered.filter(shoe => {
        const brand = shoe.name.split(' ')[0].toLowerCase();
        return filters.brands?.some(selectedBrand =>
          brand === selectedBrand.toLowerCase()
        ) || false;
      });
    }

    // Categories filter (multi-select)
    if (filters.categories && filters.categories.length > 0) {
      filtered = filtered.filter(shoe => {
        // Use the category field from the shoe model
        const category = shoe.category || 'sneakers'; // Fallback for shoes without category
        return filters.categories?.includes(category) || false;
      });
    }

    // Availability filter (multi-select)
    if (filters.availability && filters.availability.length > 0) {
      filtered = filtered.filter(shoe => {
        if (!shoe.sizes || shoe.sizes.length === 0) return false;

        const totalStock = shoe.sizes.reduce((sum, size) => sum + size.quantity, 0);

        return filters.availability?.some(availability => {
          switch (availability) {
            case 'in-stock': return totalStock > 50;
            case 'low-stock': return totalStock > 0 && totalStock <= 50;
            case 'pre-order': return totalStock === 0; // Mock logic
            case 'made-to-order': return shoe.name.toLowerCase().includes('custom'); // Mock logic
            default: return false;
          }
        }) || false;
      });
    }

    // Price range filter (legacy - keep for backward compatibility)
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      filtered = filtered.filter(shoe => {
        const minPrice = Math.min(...shoe.sizes.map(size => size.price));
        const maxPrice = Math.max(...shoe.sizes.map(size => size.price));

        if (filters.minPrice !== undefined && maxPrice < filters.minPrice) return false;
        if (filters.maxPrice !== undefined && minPrice > filters.maxPrice) return false;

        return true;
      });
    }

    // Stock filter
    if (filters.inStockOnly) {
      filtered = filtered.filter(shoe => {
        const totalStock = shoe.sizes.reduce((sum, size) => sum + size.quantity, 0);
        return totalStock > 0;
      });
    }

    return filtered;
  }

  private applySorting(shoes: Shoe[], sort: ProductSort): Shoe[] {
    return [...shoes].sort((a, b) => {
      let comparison = 0;

      switch (sort.field) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'code':
          comparison = a.code.localeCompare(b.code);
          break;
        case 'price': {
          const priceA = Math.min(...a.sizes.map(size => size.price));
          const priceB = Math.min(...b.sizes.map(size => size.price));
          comparison = priceA - priceB;
          break;
        }
        case 'stock': {
          const stockA = a.sizes.reduce((sum, size) => sum + size.quantity, 0);
          const stockB = b.sizes.reduce((sum, size) => sum + size.quantity, 0);
          comparison = stockA - stockB;
          break;
        }
        default:
          comparison = a.name.localeCompare(b.name);
      }

      return sort.direction === 'desc' ? -comparison : comparison;
    });
  }
}
