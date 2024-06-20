import { animate, state, style, transition, trigger } from '@angular/animations';
import { CUSTOM_ELEMENTS_SCHEMA, Component, input } from '@angular/core';
import { NavBarComponent } from '../../../shared/components/nav-bar/nav-bar.component';
import { TitleBarComponent } from '../../../shared/title-bar/title-bar.component';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    TitleBarComponent,
    RouterModule,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export default class HomeComponent {

}
