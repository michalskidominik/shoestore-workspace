# 🧭 Kompas Podróży - GitHub Copilot Instructions

Use instructions files from the `.github` directory to guide developers in using GitHub Copilot effectively within the Kompas Podróży codebase. List of files:
- [angular.instructions.md](./instructions/angular.instructions.md)
- [ngrx.instructions.md](./instructions/ngrx.instructions.md)
- [tailwindcss.instructions.md](./instructions/tailwindcss.instructions.md)

## Project Overview

Kompas Podróży is a modern travel planning application featuring:
- **Comprehensive component library** (40+ reusable components)
- **Feature-based structure** with lazy loading
- **Travel planning workflows** with interactive dashboards
- **Google Maps integration** for location services
- **Tour system** for onboarding and guidance

## Core Architectural Patterns

### 1. Component Library Usage

**Shared component library:** `src/app/shared/components/`

Key reusable components include:
- Auth components: `auth-layout`, `auth-header`, `auth-card`
- Form components: `form-input`, `submit-button`, `budget-input`
- UI components: `loading-spinner`, `alert-box`, `feature-card`, `cta-button`
- Layout components: `dashboard-layout`, `main-layout`
- Travel-specific: `trip-header`, `weather-widget`, `next-event-widget`

**Import pattern:**

```typescript
// ✅ Import from shared component library
import {
  AuthLayoutComponent,
  AuthHeaderComponent,
  FormInputComponent,
  SubmitButtonComponent,
  LoadingSpinnerComponent,
  AlertBoxComponent,
  FeatureCardComponent,
  CTAButtonComponent
} from '../../shared/components';
```

**Component composition patterns:**

**Layout components:**
- Main Layout: `src/app/layouts/main-layout/main-layout.ts`
- Auth Layout: `src/app/shared/components/auth-layout/`
- Dashboard Layout: `src/app/shared/components/dashboard-layout/`

**Common composition patterns:**
- Auth flows use `auth-layout` with `auth-header` and form components
- Dashboard pages use `dashboard-layout` with feature cards and widgets
- Main pages use `main-layout` for public content

### 2. Feature Structure Patterns

**Feature module organization:**
```
src/app/features/
├── feature-name/
│   ├── feature-name.ts              # Main feature component
│   ├── feature-name.html
│   ├── feature-name.css
│   ├── components/                  # Feature-specific components
│   ├── services/                    # Feature-specific services
│   └── models/                      # Feature-specific types
```

## Travel Domain Models

### Core Domain Types

**Travel Plan Models:**
- Main interface: `src/app/core/models/travel-plan.model.ts`
- Interactive Plan: `src/app/core/services/interactive-plan.service.ts` (InteractivePlan interface)
- Service stores: `src/app/core/services/travel-plan.service.ts`

### Travel Domain Patterns

```typescript
// ✅ Travel plan navigation
protected navigateToPlan(planSlug: string): void {
  this.router.navigate(['/plan', planSlug]);
}

protected navigateToDashboard(planSlug: string): void {
  this.router.navigate(['/dashboard/plan', planSlug]);
}

protected navigateToDayView(planSlug: string, dayId: string): void {
  this.router.navigate(['/dashboard/plan', planSlug, 'day', dayId]);
}
```

### 1. Travel Data Services

**Core service files:**
- Travel Plan Store: `src/app/core/services/travel-plan.service.ts` 
- Interactive Plan Store: `src/app/core/services/interactive-plan.service.ts`
- Budget Configuration: `src/app/core/services/budget-configuration.service.ts`
- Currency Service: `src/app/core/services/currency.service.ts`
- Location Data Service: `src/app/core/services/location-data.service.ts`
- Finances Data Service: `src/app/core/services/finances-data.service.ts`

**Google Maps integration:**
- Google Places Service: `src/app/core/services/google-places.service.ts`
- Google Places Backend: `src/app/core/services/google-places-backend.service.ts`

**UI and navigation services:**
- Native Tour Service: `src/app/core/services/native-tour.service.ts`
- Tab Navigation Service: `src/app/core/services/tab-navigation.service.ts`
- Responsive Service: `src/app/core/services/responsive.service.ts`
- Next Event Service: `src/app/core/services/next-event.service.ts`

**Shared services:**
- Toast Service: `src/app/shared/services/toast.service.ts`
- Auth Service: `src/app/core/services/auth.service.ts`

## File Naming & Organization

### 1. File Naming Conventions

```
✅ Correct patterns:
- component-name.ts
- component-name.html  
- component-name.css
- service-name.service.ts
- model-name.model.ts
- guard-name.guard.ts

❌ Avoid:
- componentName.ts
- component_name.ts
- component.component.ts
```

### 2. Import Organization

**Import order:**
1. Angular core imports
2. Third-party imports  
3. App-specific imports (services, models)
4. Shared components (grouped)

**Service imports:**
- Core services: `src/app/core/services/`
- Shared services: `src/app/shared/services/`
- Model imports: `src/app/core/models/`

## Code Quality Standards

### 1. Accessibility Standards

```html
<!-- ✅ Accessibility best practices -->
<button 
  type="button"
  [attr.aria-expanded]="isExpanded()"
  [attr.aria-controls]="contentId"
  (click)="toggle()">
  Toggle Content
</button>

<div 
  [id]="contentId"
  [attr.aria-hidden]="!isExpanded()"
  role="region"
  [attr.aria-labelledby]="buttonId">
  <!-- Content -->
</div>

<!-- ✅ Form accessibility -->
<app-form-input
  inputId="email"
  label="Email Address"
  [control]="emailControl()"
  [required]="true"
  inputType="email">
</app-form-input>
```

### 2. Performance Patterns

## Specific Implementation Patterns

### 1. Tour System Integration

**Service file:** `src/app/core/services/native-tour.service.ts`

The tour service provides guided onboarding and feature discovery functionality.

### 2. Google Maps Integration

**Service files:**
- Places Service: `src/app/core/services/google-places.service.ts`
- Places Backend Service: `src/app/core/services/google-places-backend.service.ts`

These services handle location autocomplete, place search, and Maps API integration.

---

## Summary

When working on Kompas Podróży:

1. **Leverage the component library** - reuse existing components from `src/app/shared/components/`
2. **Follow the feature-based structure** - organize code by domain/feature, not by type
3. **Apply travel domain knowledge** - understand the travel planning workflow and terminology
4. **Reference existing services** - use services from `src/app/core/services/` and `src/app/shared/services/`
5. **Use domain models** - import types from `src/app/core/models/travel-plan.model.ts` and service files
6. **Ensure accessibility** - proper ARIA attributes, semantic HTML, keyboard navigation
7. **Follow TypeScript strict mode** - proper typing, error handling, null safety

This codebase emphasizes reusable components, clear domain modeling, and structured travel planning workflows. Always check existing service and component files before creating new ones.
