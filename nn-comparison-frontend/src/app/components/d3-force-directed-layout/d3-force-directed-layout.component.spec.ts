import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { D3ForceDirectedLayoutComponent } from './d3-force-directed-layout.component';

describe('D3ForceDirectedLayoutComponent', () => {
  let component: D3ForceDirectedLayoutComponent;
  let fixture: ComponentFixture<D3ForceDirectedLayoutComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ D3ForceDirectedLayoutComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(D3ForceDirectedLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
