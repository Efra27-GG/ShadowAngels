declare const jasmine: any;
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { HomeComponent } from './home';
import { ProductService } from '../../../core/services/product.service';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;

  const productServiceMock = {
    getProducts: jasmine.createSpy('getProducts')
  };

  const mockProducts = [
    {
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
    },
    {
      _id: '2',
      name: 'Camisa negra',
      description: 'Camisa casual',
      category: 'caballero',
      sizes: ['M', 'L'],
      price: 400,
      discount: 0,
      final_price: 400,
      images: ['camisa1.jpg'],
      is_active: true,
      is_new: false
    }
  ];

  beforeEach(async () => {
    productServiceMock.getProducts.and.returnValue(of(mockProducts));

    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        { provide: ProductService, useValue: productServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load products on init', () => {
    expect(productServiceMock.getProducts).toHaveBeenCalled();
    expect(component.products.length).toBe(2);
    expect(component.loading).toBe(false);
  });

  it('should set error message when service fails', () => {
    productServiceMock.getProducts.and.returnValue(
      throwError(() => new Error('Error de prueba'))
    );

    component.loadProducts();

    expect(component.errorMessage).toBe('No se pudieron cargar los productos.');
    expect(component.loading).toBe(false);
  });
});