import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NetworkSimpleComponent } from './network-simple.component';

describe('NetworkSimpleComponent', () => {
  let component: NetworkSimpleComponent;
  let fixture: ComponentFixture<NetworkSimpleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NetworkSimpleComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NetworkSimpleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
