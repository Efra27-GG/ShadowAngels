import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { NewsComponent } from './news';
import { ProductService } from '../../../core/services/product.service';

describe('NewsComponent', () => {
  let component: NewsComponent;
  let fixture: ComponentFixture<NewsComponent>;

  const productServiceMock = {
    getNews: () => of([])
  };

  beforeEach(async () => {
    spyOn(productServiceMock, 'getNews').and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [NewsComponent],
      providers: [{ provide: ProductService, useValue: productServiceMock }]
    }).compileComponents();

    fixture = TestBed.createComponent(NewsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});