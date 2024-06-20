import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NavBarComponent } from '../shared/components/nav-bar/nav-bar.component';
import { TitleBarComponent } from '../shared/title-bar/title-bar.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    RouterModule,
    NavBarComponent,
    TitleBarComponent,
 ],
  templateUrl: './dashboard.component.html',
})
export default class DashboardComponent {

}
