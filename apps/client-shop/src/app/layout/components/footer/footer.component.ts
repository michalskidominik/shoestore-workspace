import { Component, ChangeDetectionStrategy, input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink
  ],
  template: `
    <!-- Professional B2B Footer -->
    <footer class="bg-slate-900 text-slate-300 border-t border-slate-800">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Main Footer Content -->
        <div class="py-8 sm:py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          <!-- Company Info -->
          <div class="space-y-4 text-center sm:text-left sm:col-span-2 lg:col-span-1">
            <div class="flex items-center justify-center sm:justify-start gap-3">
              <div class="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-lg">
                <i class="pi pi-box text-white text-lg"></i>
              </div>
              <div>
                <h3 class="text-lg font-bold text-white">{{ companyName() }}</h3>
                <p class="text-xs text-slate-400">B2B Wholesale Platform</p>
              </div>
            </div>
            <p class="text-sm text-slate-400 leading-relaxed max-w-md mx-auto sm:mx-0">
              Your reliable partner for retail restocking solutions. We supply premium footwear from top global brands, helping retailers maintain optimal inventory levels and satisfy customer demand since 2020.
            </p>
            <div class="flex items-center justify-center sm:justify-start gap-4">
              <a href="#" class="text-slate-400 hover:text-blue-400 transition-colors" aria-label="LinkedIn">
                <i class="pi pi-linkedin text-lg"></i>
              </a>
              <a href="#" class="text-slate-400 hover:text-blue-400 transition-colors" aria-label="Twitter">
                <i class="pi pi-twitter text-lg"></i>
              </a>
              <a href="#" class="text-slate-400 hover:text-blue-400 transition-colors" aria-label="Facebook">
                <i class="pi pi-facebook text-lg"></i>
              </a>
            </div>
          </div>

          <!-- Quick Links -->
          <div class="space-y-4 text-center sm:text-left">
            <h4 class="text-sm font-semibold text-white uppercase tracking-wide">Quick Links</h4>
            <nav class="space-y-2">
              <a routerLink="/products" class="block text-sm text-slate-400 hover:text-blue-400 transition-colors">
                Product Catalog
              </a>
              @if (isAuthenticated()) {
                <a routerLink="/orders" class="block text-sm text-slate-400 hover:text-blue-400 transition-colors">
                  Order Management
                </a>
                <a routerLink="/dashboard" class="block text-sm text-slate-400 hover:text-blue-400 transition-colors">
                  Business Dashboard
                </a>
              }
            </nav>
          </div>

          <!-- Company Pages -->
          <div class="space-y-4 text-center sm:text-left">
            <h4 class="text-sm font-semibold text-white uppercase tracking-wide">Company</h4>
            <nav class="space-y-2">
              <a routerLink="/about-us" class="flex items-center justify-center sm:justify-start gap-2 text-sm text-slate-400 hover:text-blue-400 transition-colors">
                <i class="pi pi-info-circle text-xs"></i>
                About Us
              </a>
              <a routerLink="/contact" class="flex items-center justify-center sm:justify-start gap-2 text-sm text-slate-400 hover:text-blue-400 transition-colors">
                <i class="pi pi-envelope text-xs"></i>
                Contact & Support
              </a>
            </nav>

            <!-- Company Registration Details -->
            <div class="pt-2 border-t border-slate-700">
              <div class="space-y-1 text-xs text-slate-500">
                <div class="flex items-center justify-center sm:justify-start gap-2">
                  <span class="font-medium">VAT-ID:</span>
                  <span>PL5130293109</span>
                </div>
                <div class="flex items-center justify-center sm:justify-start gap-2">
                  <span class="font-medium">KRS:</span>
                  <span>0001097529</span>
                </div>
                <div class="flex items-center justify-center sm:justify-start gap-2">
                  <span class="font-medium">REGON:</span>
                  <span>528216748</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Contact Information -->
          <div class="space-y-4 text-center sm:text-left sm:col-span-2 lg:col-span-1">
            <h4 class="text-sm font-semibold text-white uppercase tracking-wide">Get in Touch</h4>
            <div class="space-y-3">
              <div class="flex items-start justify-center sm:justify-start gap-3">
                <i class="pi pi-map-marker text-blue-400 text-sm mt-0.5 flex-shrink-0"></i>
                <div class="text-sm text-slate-400">
                  <p>ul. Polna 4C</p>
                  <p>32-043 Skała, Poland</p>
                </div>
              </div>
              <div class="flex items-center justify-center sm:justify-start gap-3">
                <i class="pi pi-phone text-blue-400 text-sm flex-shrink-0"></i>
                <a href="tel:+48453085149" class="text-sm text-slate-400 hover:text-blue-400 transition-colors">
                  +48 453 085 149
                </a>
              </div>
              <div class="flex items-center justify-center sm:justify-start gap-3">
                <i class="pi pi-envelope text-blue-400 text-sm flex-shrink-0"></i>
                <a href="mailto:wholesale&#64;mandraime.com" class="text-sm text-slate-400 hover:text-blue-400 transition-colors break-all">
                  contact&#64;mandraime.com
                </a>
              </div>
              <div class="flex items-start justify-center sm:justify-start gap-3">
                <i class="pi pi-clock text-blue-400 text-sm mt-0.5 flex-shrink-0"></i>
                <div class="text-sm text-slate-400">
                  <p>24/7</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer Bottom -->
        <div class="py-4 sm:py-6 border-t border-slate-800">
          <div class="flex flex-col items-center justify-center sm:flex-row sm:justify-between gap-4 text-center sm:text-left">
            <div class="text-sm text-slate-400">
              © {{ currentYear }} {{ companyName() }}. All rights reserved.
            </div>
            <div class="flex flex-col items-center sm:flex-row sm:items-center gap-4 sm:gap-6 text-sm text-slate-400">
              <div class="flex items-center gap-4">
                <a href="#" class="hover:text-blue-400 transition-colors">Privacy</a>
                <a href="#" class="hover:text-blue-400 transition-colors">Terms</a>
              </div>
              <div class="flex items-center gap-1">
                <i class="pi pi-shield-check text-green-400 text-xs"></i>
                <span class="text-xs">Secure Platform</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FooterComponent {
  // Inputs
  readonly companyName = input.required<string>();

  // Services
  private readonly authService = inject(AuthService);

  // Computed properties
  readonly currentYear = new Date().getFullYear();
  readonly isAuthenticated = this.authService.isAuthenticated;
}
