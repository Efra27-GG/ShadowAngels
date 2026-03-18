import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CatalogSortOption, CatalogSortOptionValue } from '../../utils/catalog-filter.util';

@Component({
  selector: 'app-catalog-filters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './catalog-filters.html',
  styleUrls: ['./catalog-filters.css']
})
export class CatalogFiltersComponent {
  @Input() public searchTerm = '';
  @Input() public sortOption: CatalogSortOptionValue = 'featured';
  @Input() public resultCount = 0;
  @Input() public sortOptions: CatalogSortOption[] = [];

  @Output() public searchTermChange = new EventEmitter<string>();
  @Output() public sortOptionChange = new EventEmitter<CatalogSortOptionValue>();

  public onSearchChange(value: string): void {
    this.searchTermChange.emit(value);
  }

  public onSortChange(value: CatalogSortOptionValue): void {
    this.sortOptionChange.emit(value);
  }
}
