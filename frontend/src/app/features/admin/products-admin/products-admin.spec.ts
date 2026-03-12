import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ProductsAdminComponent } from './products-admin';
import { ProductService } from '../../../core/services/product.service';

describe('ProductsAdminComponent', () => {
  let component: ProductsAdminComponent;
  let fixture: ComponentFixture<ProductsAdminComponent>;

  const productServiceMock = {
    getProducts: () => of([]),
    createProduct: (_data: any) => of({}),
    updateProduct: (_id: string, _data: any) => of({}),
    deleteProduct: (_id: string) => of({})
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductsAdminComponent],
      providers: [{ provide: ProductService, useValue: productServiceMock }]
    }).compileComponents();

    fixture = TestBed.createComponent(ProductsAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});