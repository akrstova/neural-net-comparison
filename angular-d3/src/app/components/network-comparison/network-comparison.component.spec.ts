import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NetworkComparisonComponent } from './network-comparison.component';

describe('ModelComparisonComponent', () => {
  let component: NetworkComparisonComponent;
  let fixture: ComponentFixture<NetworkComparisonComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NetworkComparisonComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NetworkComparisonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
