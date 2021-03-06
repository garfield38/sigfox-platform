import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {CustomDashboardRoutingModule} from './custom-dashboard-routing.module';
import {CustomDashboardComponent} from './custom-dashboard.component';
import {NgxGaugeModule} from 'ngx-gauge';
import {SelectModule} from 'ng2-select';
import {ToasterModule} from 'angular2-toaster';
import {AgmCoreModule} from '@agm/core';
import {FormsModule} from '@angular/forms';

@NgModule({
  imports: [
    CommonModule,
    CustomDashboardRoutingModule,
    NgxGaugeModule,
    SelectModule,
    FormsModule,
    ToasterModule,
    AgmCoreModule.forRoot({
      apiKey: 'AIzaSyD4Zt99xt7aUd4Sg8RUwlMGwRkRIBWC7aE'
    })
  ],
  declarations: [CustomDashboardComponent]
})
export class CustomDashboardModule {
}
