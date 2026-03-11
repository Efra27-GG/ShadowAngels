import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MenComponent } from './men';
import { ProductService } from '../../../core/services/product.service';

describe('MenComponent', () => {
  let component: MenComponent;
  let fixture: ComponentFixture<MenComponent>;

  const productServiceMock = {
    getMenProducts: () => of([])
  };

  beforeEach(async () => {
    spyOn(productServiceMock, 'getMenProducts').and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [MenComponent],
      providers: [{ provide: ProductService, useValue: productServiceMock }]
    }).compileComponents();

    fixture = TestBed.createComponent(MenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});