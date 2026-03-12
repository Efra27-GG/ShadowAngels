import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { WomenComponent } from './women';
import { ProductService } from '../../../core/services/product.service';

describe('WomenComponent', () => {
  let component: WomenComponent;
  let fixture: ComponentFixture<WomenComponent>;

  const productServiceMock = {
    getWomenProducts: () => of([])
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WomenComponent],
      providers: [{ provide: ProductService, useValue: productServiceMock }]
    }).compileComponents();

    fixture = TestBed.createComponent(WomenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});