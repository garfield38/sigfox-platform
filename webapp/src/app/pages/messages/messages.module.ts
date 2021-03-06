import {NgModule} from '@angular/core';

import {MessagesComponent} from './messages.component';
import {MessagesRoutingModule} from './messages-routing.module';
import {CommonModule} from '@angular/common';
// DataTable
import {DataTableModule} from 'angular2-datatable';
import {DataFilterPipe} from './datafilterpipe';
import {FormsModule} from '@angular/forms';
import {ModalModule} from "ng2-bootstrap";
import {AgmCoreModule} from "@agm/core";

@NgModule({
  imports: [
    MessagesRoutingModule,
    CommonModule,
    DataTableModule,
    FormsModule,
    ModalModule.forRoot(),
    AgmCoreModule.forRoot({
      apiKey: 'AIzaSyD4Zt99xt7aUd4Sg8RUwlMGwRkRIBWC7aE'
    })
  ],
  declarations: [
    MessagesComponent,
    DataFilterPipe
  ]
})
export class MessagesModule {
}
