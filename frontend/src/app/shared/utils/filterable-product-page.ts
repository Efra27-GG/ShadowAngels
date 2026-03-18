import { Product } from '../interfaces/product.interface';
import {
  CatalogSortOption,
  CatalogSortOptionValue,
  filterAndSortProducts
} from './catalog-filter.util';

export abstract class FilterableProductPage {
  products: Product[] = [];
  protected allProducts: Product[] = [];
  searchTerm = '';
  sortOption: CatalogSortOptionValue = 'featured';
  sortOptions: CatalogSortOption[] = [];

  protected setProducts(products: Product[]): void {
    this.allProducts = products;
    this.applyFilters();
  }

  applyFilters(): void {
    this.products = filterAndSortProducts(this.allProducts, this.searchTerm, this.sortOption);
  }
}
