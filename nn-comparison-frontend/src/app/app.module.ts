import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import {HttpClientModule} from '@angular/common/http';
import {ModelsService} from './service/models.service';
import {FormsModule} from '@angular/forms';
import {NetworkComponent} from './components/network/network.component';
import {NetworkComparisonComponent} from './components/network-comparison/network-comparison.component';
import { NetworkSimpleComponent } from './components/network-simple/network-simple.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

@NgModule({
  declarations: [
    AppComponent,
    NetworkComparisonComponent,
    NetworkComponent,
    NetworkSimpleComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    BrowserAnimationsModule
  ],
  providers: [ModelsService],
  bootstrap: [AppComponent]
})
export class AppModule {
  constructor() {
  }
}
