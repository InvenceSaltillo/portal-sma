import { AfterViewInit, Component, OnInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
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
export default class DashboardComponent implements AfterViewInit{
  readonly appUtils = AppUtils;

  private localStorageService = inject(LocalStorageService);
  public toastr = inject(ToastrService);

  user!: User;
  userFullName = '';

  ngAfterViewInit(): void {
    const user = this.localStorageService.getUser();

    if (!!user) {
      this.user = user;
      this.userFullName = this.appUtils.getUserFullName(user);
      console.log('DEBUG: user', typeof user);
    } else {
      console.log('DEBUG: aquiiii', typeof user);
      this.toastr.error('No se pudo obtener la información del usuario');
      return;
    }
  }

}
