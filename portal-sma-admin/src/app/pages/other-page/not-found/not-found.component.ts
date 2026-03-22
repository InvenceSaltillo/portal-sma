import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { GridShapeComponent } from '../../../shared/components/common/grid-shape/grid-shape.component';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [GridShapeComponent, RouterModule],
  templateUrl: './not-found.component.html',
  styles: ``
})
export class NotFoundComponent {

  currentYear: number = new Date().getFullYear();
}
