import { Component } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';
import { CheckboxComponent } from '../../form/input/checkbox.component';
import { InputFieldComponent } from '../../form/input/input-field.component';
import { LabelComponent } from '../../form/label/label.component';
import { ButtonComponent } from '../../ui/button/button.component';

@Component({
  selector: 'app-signin-form',
  standalone: true,
  imports: [
    LabelComponent,
    CheckboxComponent,
    ButtonComponent,
    InputFieldComponent,
    RouterModule,
],
  templateUrl: './signin-form.component.html',
  styles: ``
})
export class SigninFormComponent {

  showPassword = false;
  isChecked = false;

  email = '';
  password = '';
  errorMessage = '';
  submitting = false;

  constructor(
    private readonly auth: AuthService,
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {}

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  async onSignIn() {
    if (this.submitting) {
      return;
    }
    this.errorMessage = '';
    this.submitting = true;
    try {
      const { error } = await this.auth.login(
        this.email,
        this.password,
        this.isChecked
      );
      if (error) {
        this.errorMessage = error;
        return;
      }
      const returnUrl =
        this.route.snapshot.queryParamMap.get('returnUrl') || '/home';
      await this.router.navigateByUrl(returnUrl);
    } finally {
      this.submitting = false;
    }
  }

  onFormSubmit(event: Event) {
    event.preventDefault();
    this.onSignIn();
  }

  onEmailChange(value: string | number) {
    this.email = String(value);
    this.errorMessage = '';
  }

  onPasswordChange(value: string | number) {
    this.password = String(value);
    this.errorMessage = '';
  }
}
