import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ModelComparisonComponent } from './components/model-comparison/model-comparison.component';
import {HttpClientModule} from '@angular/common/http';
import {ModelsService} from './service/models.service';

@NgModule({
  declarations: [
    AppComponent,
    ModelComparisonComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule
  ],
  providers: [ModelsService],
  bootstrap: [AppComponent]
})
export class AppModule { }
