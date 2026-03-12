import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductCardComponent } from './product-card';

describe('ProductCardComponent', () => {
  let component: ProductCardComponent;
  let fixture: ComponentFixture<ProductCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductCardComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ProductCardComponent);
    component = fixture.componentInstance;

    component.product = {
      _id: '1',
      name: 'Vestido rojo',
      description: 'Vestido elegante para dama',
      category: 'dama',
      sizes: ['S', 'M', 'L'],
      price: 500,
      discount: 10,
      final_price: 450,
      images: ['vestido1.jpg'],
      is_active: true,
      is_new: true
    };

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should return first image when images exist', () => {
    expect(component.imageUrl).toBe('vestido1.jpg');
  });

  it('should return placeholder when images are empty', () => {
    component.product.images = [];
    expect(component.imageUrl).toContain('via.placeholder.com');
  });
});