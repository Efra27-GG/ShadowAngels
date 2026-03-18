import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../../core/services/product.service';
import { Product } from '../../../shared/interfaces/product.interface';
import { ProductCardComponent } from '../../../shared/components/product-card/product-card';
import { HeroService } from '../../../core/services/hero.service';
import { HeroContent } from '../../../shared/interfaces/hero.interface';
import { CatalogFiltersComponent } from '../../../shared/components/catalog-filters/catalog-filters';
import { FilterableProductPage } from '../../../shared/utils/filterable-product-page';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, ProductCardComponent, CatalogFiltersComponent],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class HomeComponent extends FilterableProductPage implements OnInit {
  private productService = inject(ProductService);
  private heroService = inject(HeroService);
  private cdr = inject(ChangeDetectorRef);

  hero: HeroContent = {
    title: 'Bienvenido a ShadowAngels',
    subtitle: 'Descubre nuestros productos, novedades y ofertas especiales.',
    image: ''
  };
  loading = true;
  errorMessage = '';

  constructor() {
    super();
    this.sortOption = 'featured';
    this.sortOptions = [
      { value: 'featured', label: 'Destacados' },
      { value: 'price-asc', label: 'Precio: menor a mayor' },
      { value: 'price-desc', label: 'Precio: mayor a menor' },
      { value: 'name-asc', label: 'Nombre: A-Z' },
      { value: 'name-desc', label: 'Nombre: Z-A' },
      { value: 'discount-desc', label: 'Mayor descuento' }
    ];
  }

  ngOnInit(): void {
    this.heroService.hero$.subscribe((hero) => {
      this.hero = hero;
      this.cdr.detectChanges();
    });

    this.heroService.loadHero().subscribe();
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading = true;
    this.errorMessage = '';

    this.productService.getProducts().subscribe({
      next: (resp: Product[]) => {
        this.setProducts(resp);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'No se pudieron cargar los productos.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  get heroBackgroundImage(): string {
    const imagePath = this.heroService.getImagePath(this.hero.image);
    return imagePath
      ? `linear-gradient(rgba(0, 0, 0, 0.54), rgba(0, 0, 0, 0.68)), url('${imagePath}')`
      : '';
  }

  get hasHeroImage(): boolean {
    return !!this.hero.image;
  }

  scrollToProducts(): void {
    if (typeof document === 'undefined') {
      return;
    }

    document.getElementById('home-products')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }
}
