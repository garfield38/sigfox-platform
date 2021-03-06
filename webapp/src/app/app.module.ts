import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {HashLocationStrategy, LocationStrategy} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {NAV_DROPDOWN_DIRECTIVES} from './shared/nav-dropdown.directive';
import {AppComponent} from './app.component';
import {BsDropdownModule} from 'ng2-bootstrap/dropdown';
import {ChartsModule} from 'ng2-charts/ng2-charts';
import {SIDEBAR_TOGGLE_DIRECTIVES} from './shared/sidebar.directive';
import {AsideToggleDirective} from './shared/aside.directive';
import {BreadcrumbsComponent} from './shared/breadcrumb.component';
// Routing Module
import {AppRoutingModule} from './app.routing';
// Layouts
import {FullLayoutComponent} from './layouts/full-layout.component';
// SDK
import {SDKBrowserModule} from './shared/sdk/index';
import {AuthGuard} from './_guards/auth.guard';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';

@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    AppRoutingModule,
    BsDropdownModule.forRoot(),
    //TabsModule.forRoot(),
    ChartsModule,
    SDKBrowserModule.forRoot()
  ],
  declarations: [
    AppComponent,
    FullLayoutComponent,
    //SimpleLayoutComponent,
    NAV_DROPDOWN_DIRECTIVES,
    BreadcrumbsComponent,
    SIDEBAR_TOGGLE_DIRECTIVES,
    AsideToggleDirective

    //AssetsComponent
  ],
  providers: [
    AuthGuard,
    {
      provide: LocationStrategy,
      useClass: HashLocationStrategy
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
