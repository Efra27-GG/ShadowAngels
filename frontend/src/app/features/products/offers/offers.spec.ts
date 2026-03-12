import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { OffersComponent } from './offers';
import { ProductService } from '../../../core/services/product.service';

describe('OffersComponent', () => {
  let component: OffersComponent;
  let fixture: ComponentFixture<OffersComponent>;

  const productServiceMock = {
    getOffers: () => of([])
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OffersComponent],
      providers: [{ provide: ProductService, useValue: productServiceMock }]
    }).compileComponents();

    fixture = TestBed.createComponent(OffersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});