import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NgCytoComponent } from './ng-cyto.component';
import {MatTableModule} from "@angular/material/table";

describe('NgCytoComponent', () => {
  let component: NgCytoComponent;
  let fixture: ComponentFixture<NgCytoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NgCytoComponent ],
      imports: [ MatTableModule ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NgCytoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
