import { Product } from '../interfaces/product.interface';

export type CatalogSortOptionValue =
  | 'featured'
  | 'price-asc'
  | 'price-desc'
  | 'name-asc'
  | 'name-desc'
  | 'discount-desc';

export interface CatalogSortOption {
  value: CatalogSortOptionValue;
  label: string;
}

export function filterAndSortProducts(
  products: Product[],
  searchTerm: string,
  sortOption: CatalogSortOptionValue
): Product[] {
  const search = searchTerm.trim().toLowerCase();
  let filtered = [...products];

  if (search) {
    filtered = filtered.filter((product) =>
      product.name.toLowerCase().includes(search) ||
      product.description.toLowerCase().includes(search)
    );
  }

  switch (sortOption) {
    case 'price-asc':
      filtered.sort((a, b) => a.final_price - b.final_price);
      break;
    case 'price-desc':
      filtered.sort((a, b) => b.final_price - a.final_price);
      break;
    case 'name-asc':
      filtered.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'name-desc':
      filtered.sort((a, b) => b.name.localeCompare(a.name));
      break;
    case 'discount-desc':
      filtered.sort((a, b) => b.discount - a.discount);
      break;
    default:
      break;
  }

  return filtered;
}
