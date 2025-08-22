import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DataViewModule } from 'primeng/dataview';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SelectButtonModule } from 'primeng/selectbutton';
import { PrimeTemplate } from 'primeng/api';
// Models and services
import { Shoe, SizeTemplate } from '@shoestore/shared-models';
import { ProductService } from '../../shared/services/product.service';

interface SortOption {
  label: string;
  value: string;
}

interface BrandOption {
  label: string;
  value: string;
}

interface SizeSystemOption {
  label: string;
  value: 'eu' | 'us';
}

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    DataViewModule,
    InputTextModule,
    SelectModule,
    SelectButtonModule,
    ButtonModule,
    ProgressSpinnerModule,
    PrimeTemplate,
  ],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss'],
})
export class ProductsComponent implements OnInit {
  // Data
  allShoes: Shoe[] = [];
  filteredShoes: Shoe[] = [];
  sizeTemplates: SizeTemplate[] = [];
  loading = true;

  // Filter states
  searchTerm = '';
  selectedBrand = 'all';
  selectedSort = 'name';
  sizeSystem: 'eu' | 'us' = 'eu';

  // Options for dropdowns
  brandOptions: BrandOption[] = [];
  sortOptions: SortOption[] = [
    { label: 'Nazwa (A-Z)', value: 'name' },
    { label: 'Kod produktu', value: 'code' },
    { label: 'Cena (rosnąco)', value: 'price' },
  ];

  sizeSystemOptions: SizeSystemOption[] = [
    { label: 'EU', value: 'eu' },
    { label: 'US', value: 'us' },
  ];

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;

    // Ładowanie butów
    this.productService.getShoes().subscribe((shoes) => {
      this.allShoes = shoes;
      this.updateBrandOptions();
      this.applyFilters();
      this.loading = false;
    });

    // Ładowanie szablonów rozmiarów
    this.productService.getSizeTemplates().subscribe((templates) => {
      this.sizeTemplates = templates;
    });
  }

  updateBrandOptions(): void {
    const brands = this.productService.getAvailableBrands();
    this.brandOptions = [
      { label: 'Wszystkie marki', value: 'all' },
      ...brands.map((brand) => ({ label: brand, value: brand.toLowerCase() })),
    ];
  }

  applyFilters(): void {
    let filtered = this.productService.filterShoes(
      this.allShoes,
      this.searchTerm,
      this.selectedBrand
    );

    // Sortowanie
    const [sortBy, direction] = this.selectedSort.includes('price')
      ? ['price', 'asc']
      : [this.selectedSort, 'asc'];

    filtered = this.productService.sortShoes(
      filtered,
      sortBy as 'name' | 'price' | 'code',
      direction as 'asc' | 'desc'
    );

    console.log('Filtered shoes:', filtered);
    this.filteredShoes = filtered;
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onBrandChange(): void {
    this.applyFilters();
  }

  onSortChange(): void {
    this.applyFilters();
  }

  onSizeSystemChange(): void {
    // Przełączanie systemu rozmiarów nie wymaga przefiltrowania,
    // tylko odświeżenia wyświetlania
  }

  getMinPrice(shoe: Shoe): number {
    return Math.min(...shoe.sizes.map((size) => size.price));
  }

  getSizeRange(shoe: Shoe): string {
    const sizes = shoe.sizes.map((size) => size.size).sort((a, b) => a - b);
    const minSize = Math.min(...sizes);
    const maxSize = Math.max(...sizes);

    if (this.sizeSystem === 'us') {
      const template = this.sizeTemplates.find((t) => t.id === shoe.templateId);
      if (template) {
        const minUs = template.pairs.find((p) => p.eu === minSize)?.us;
        const maxUs = template.pairs.find((p) => p.eu === maxSize)?.us;
        if (minUs && maxUs) {
          return minSize === maxSize ? `${minUs} US` : `${minUs}-${maxUs} US`;
        }
      }
    }

    return minSize === maxSize ? `${minSize} EU` : `${minSize}-${maxSize} EU`;
  }

  getTotalQuantity(shoe: Shoe): number {
    return shoe.sizes.reduce((total, size) => total + size.quantity, 0);
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedBrand = 'all';
    this.selectedSort = 'name';
    this.applyFilters();
  }
}
