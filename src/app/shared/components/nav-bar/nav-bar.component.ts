import { trigger, state, style, transition, animate } from '@angular/animations';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TooltipComponent } from '../tooltip/tooltip.component';

@Component({
  selector: 'app-nav-bar',
  standalone: true,
  imports: [RouterModule, TooltipComponent],
  templateUrl: './nav-bar.component.html',
  styleUrl: './nav-bar.component.css',
  animations: [
    trigger('showOrHide', [
      state(
        'true',
        style({
          opacity: 1,
        })
      ),
      state(
        'false',
        style({
          opacity: 0,
        })
      ),
      transition('true => false', [
        animate('.75s ease'),
      ]),
      transition('false => true', [
        animate('.75s ease'),
      ]),
    ])
  ],
})
export class NavBarComponent {
  showProfileMenu = false;

}
