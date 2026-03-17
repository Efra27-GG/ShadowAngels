import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { ProductDetailComponent } from './product-detail';
import { ProductService } from '../../../core/services/product.service';
import { PurchaseRequestService } from '../../../core/services/purchase-request.service';
import { AuthService } from '../../../core/services/auth.service';
import { ContactService } from '../../../core/services/contact.service';
import { CartService } from '../../../core/services/cart.service';

describe('ProductDetailComponent', () => {
  let component: ProductDetailComponent;
  let fixture: ComponentFixture<ProductDetailComponent>;

  const activatedRouteMock = {
    paramMap: of(convertToParamMap({ id: '1' }))
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
        is_new: true,
        reviews: []
      }),
    createReview: () => of({}),
    updateReview: () => of({})
  };

  const authServiceMock = {
    isLoggedIn: () => false,
    getUser: () => null
  };

  const purchaseRequestServiceMock = {
    createRequest: () => of({ message: 'ok', request: null }),
    getMyProductStatus: () => of({ request: null, can_review: false, has_purchased: false })
  };

  const contactServiceMock = {
    contact$: of({
      whatsapp_number: '',
      whatsapp_label: '',
      facebook: '',
      instagram: '',
      tiktok: '',
      email: '',
      location: ''
    }),
    loadContact: () => of({
      whatsapp_number: '',
      whatsapp_label: '',
      facebook: '',
      instagram: '',
      tiktok: '',
      email: '',
      location: ''
    })
  };

  const cartServiceMock = {
    addItem: () => of({})
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductDetailComponent],
      providers: [
        { provide: ActivatedRoute, useValue: activatedRouteMock },
        { provide: ProductService, useValue: productServiceMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: PurchaseRequestService, useValue: purchaseRequestServiceMock },
        { provide: ContactService, useValue: contactServiceMock },
        { provide: CartService, useValue: cartServiceMock }
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
