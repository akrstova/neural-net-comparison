import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import {HttpClientModule} from '@angular/common/http';
import {ModelsService} from './service/models.service';
import {FormsModule} from '@angular/forms';
import { GeneralLayerComponent } from './components/layers/general-layer/general-layer.component';
import {NetworkComponent} from './components/network/network.component';
import {NetworkComparisonComponent} from './components/network-comparison/network-comparison.component';
import { LayerLoaderDirective } from './directives/layer-loader.directive';
import { NetworkSimpleComponent } from './components/network-simple/network-simple.component';

@NgModule({
  declarations: [
    AppComponent,
    NetworkComparisonComponent,
    NetworkComponent,
    GeneralLayerComponent,
    LayerLoaderDirective,
    NetworkSimpleComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule
  ],
  providers: [ModelsService],
  bootstrap: [AppComponent]
})
export class AppModule {
  constructor() {
  }
}
