import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { ProductDetailComponent } from './product-detail';
import { ProductService } from '../../../core/services/product.service';

describe('ProductDetailComponent', () => {
  let component: ProductDetailComponent;
  let fixture: ComponentFixture<ProductDetailComponent>;

  const activatedRouteMock = {
    snapshot: {
      paramMap: {
        get: (_key: string) => '1'
      }
    }
  };

  const productServiceMock = {
    getProductById: (_id: string) =>
      of({
        _id: '1',
        name: 'Vestido rojo',
        description: 'Vestido elegante para dama',
        category: 'dama',
        sizes: ['S', 'M'],
        price: 500,
        discount: 10,
        final_price: 450,
        images: ['vestido1.jpg'],
        is_active: true,
        is_new: true
      })
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductDetailComponent],
      providers: [
        { provide: ActivatedRoute, useValue: activatedRouteMock },
        { provide: ProductService, useValue: productServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProductDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load product by id', () => {
    expect(component.product?._id).toBe('1');
    expect(component.loading).toBe(false);
  });
});