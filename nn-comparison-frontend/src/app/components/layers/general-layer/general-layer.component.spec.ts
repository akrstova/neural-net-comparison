import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GeneralLayerComponent } from './general-layer.component';

describe('GeneralLayerComponent', () => {
  let component: GeneralLayerComponent;
  let fixture: ComponentFixture<GeneralLayerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GeneralLayerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GeneralLayerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
