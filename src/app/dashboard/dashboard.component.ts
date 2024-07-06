import { AfterViewInit, Component, OnInit, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { NavBarComponent } from '../shared/components/nav-bar/nav-bar.component';
import { TitleBarComponent } from '../shared/title-bar/title-bar.component';
import { ToastrService } from 'ngx-toastr';
import { AppUtils } from '../app.utils';
import { User } from '../interfaces/user.interface';
import { LocalStorageService } from '../services/local-storage/local-storage.service';

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
export default class DashboardComponent implements OnInit {
  readonly appUtils = AppUtils;

  private localStorageService = inject(LocalStorageService);
  public toastr = inject(ToastrService);
  private router = inject(Router);

  user!: User;

  ngOnInit(): void {
    const user = this.localStorageService.getUser();
    console.log('DEBUG: user', user);

    if (!user) {
      this.toastr.error('No se pudo obtener la información del usuario');
      this.router.navigateByUrl('login');
      return;
    }
    this.user = user;
  }

}
