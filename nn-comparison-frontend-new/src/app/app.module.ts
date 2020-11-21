import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';

import {NgModule} from '@angular/core';
import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {MatIconModule} from "@angular/material/icon";
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {MatToolbarModule} from "@angular/material/toolbar";
import {MatButtonModule} from "@angular/material/button";
import {MatSidenavModule} from "@angular/material/sidenav";
import {MatSelectModule} from "@angular/material/select";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {MatCheckboxModule} from "@angular/material/checkbox";
import {ModelsService} from "./service/models.service";
import {HttpClientModule} from "@angular/common/http";
import {GraphComponent} from "./components/graph/graph.component";
import {NgCytoComponent} from "./components/ng-cyto/ng-cyto.component";


@NgModule({
  declarations: [
    AppComponent,
    GraphComponent,
    NgCytoComponent

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
    ReactiveFormsModule,
    MatCheckboxModule,
    FormsModule,
    HttpClientModule
  ],
  providers: [ModelsService],
  bootstrap: [AppComponent]
})
export class AppModule {
}
