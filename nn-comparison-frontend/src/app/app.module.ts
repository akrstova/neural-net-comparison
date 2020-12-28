import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule, NoopAnimationsModule} from '@angular/platform-browser/animations';

import {NgModule} from '@angular/core';
import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {MatIconModule} from "@angular/material/icon";
import {MatToolbarModule} from "@angular/material/toolbar";
import {MatButtonModule} from "@angular/material/button";
import {MatSidenavModule} from "@angular/material/sidenav";
import {MatSelectModule} from "@angular/material/select";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {MatCheckboxModule} from "@angular/material/checkbox";
import {ModelsService} from "./service/models.service";
import {HTTP_INTERCEPTORS, HttpClientModule} from "@angular/common/http";
import {NgCytoComponent} from "./components/ng-cyto/ng-cyto.component";
import {ComparisonService} from "./service/comparison.service";
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {D3ForceDirectedLayoutComponent} from './components/d3-force-directed-layout/d3-force-directed-layout.component';
import {MatListModule} from "@angular/material/list";
import {MatTableModule} from "@angular/material/table";
import {AgGridModule} from 'ag-grid-angular';
import {MatPaginatorModule} from "@angular/material/paginator";
import {MatSliderModule} from "@angular/material/slider";
import {ComparisonInterceptor} from "./interceptors/comparison-interceptor.service";


@NgModule({
  declarations: [
    AppComponent,
    NgCytoComponent,
    D3ForceDirectedLayoutComponent

  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    MatIconModule,
    NoopAnimationsModule,
    MatToolbarModule,
    MatButtonModule,
    MatSidenavModule,
    MatSelectModule,
    MatListModule,
    MatTableModule,
    ReactiveFormsModule,
    MatCheckboxModule,
    MatSlideToggleModule,
    FormsModule,
    HttpClientModule,
    AgGridModule.withComponents([]),
    MatPaginatorModule,
    MatSliderModule
  ],
  providers: [ModelsService, ComparisonService, {provide: HTTP_INTERCEPTORS, useClass: ComparisonInterceptor, multi: true}
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
