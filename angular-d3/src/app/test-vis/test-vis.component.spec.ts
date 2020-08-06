import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TestVisComponent } from './test-vis.component';

describe('TestVisComponent', () => {
  let component: TestVisComponent;
  let fixture: ComponentFixture<TestVisComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TestVisComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TestVisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
