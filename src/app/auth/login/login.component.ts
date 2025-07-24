import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CustomDialogComponent } from '../../shared/components/custom-dialog/custom-dialog.component';
import { CustomDialogConfig, FormControlConfig, FormControlType } from '../../interfaces/custom.dialog.interfaces';
import { NgxSpinnerService } from 'ngx-spinner';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';
import { ToastrService } from 'ngx-toastr';
import { LocalStorageService } from '../../services/local-storage/local-storage.service';
import { User } from '../../interfaces/user.interface';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CustomDialogComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {

  formBuilder = inject(FormBuilder)
  loginForm!: FormGroup;
  showRecoverPasswordDialog = false;
  showCreateAccountDialog = false;
  recoverPasswordDialogControls: FormControlConfig[] = [
    {
      name: 'email',
      label: 'Correo electrónico',
      type: FormControlType.EMAIL,
      validators: [
        Validators.required,
        Validators.email,
      ],
    },
  ];

  recoverPasswordDialogConfig: CustomDialogConfig = {
    dialogTitle: 'Recuperar contraseña',
    confirmButtonLabel: 'Enviar',
    svgIconPath: 'M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z',
  };

  registerDialogControls: FormControlConfig[] = [
    {
      name: 'email',
      label: 'Correo electrónico',
      type: FormControlType.EMAIL,
      validators: [
        Validators.required,
        Validators.email,
      ],
      initial_value: 'riojas@mail.com',
    },
    {
      name: 'firstName',
      label: 'Nombre(s)',
      type: FormControlType.TEXT,
      validators: [
        Validators.required,
      ],
      initial_value: 'Jhon',
    },
    {
      name: 'lastName',
      label: 'Apellido(s)',
      type: FormControlType.TEXT,
      validators: [
        Validators.required,
      ],
      initial_value: 'Doe',
    },
    {
      name: 'birthDate',
      label: 'Fecha de nacimiento',
      type: FormControlType.DATE,
      validators: [
        Validators.required,
      ],
      initialDate: new Date(1984, 7, 1),
    },
    {
      name: 'gender',
      label: 'Sexo',
      type: FormControlType.SELECT,
      validators: [
        Validators.required,
      ],
      initial_value: 'male',
      placeholder: '--Seleccione una opción--',
      select_options: [
        { value: 'male', label: 'Masculino', is_selected: false, },
        { value: 'female', label: 'Femenino', is_selected: false, },
      ],
    },
  ];

  registerDialogConfig: CustomDialogConfig = {
    dialogTitle: 'Crear cuenta',
    confirmButtonLabel: 'Registrarse',
    svgIconPath: 'M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z'
  };

  private spinnerService = inject(NgxSpinnerService);
  private router = inject(Router);
  public authService = inject(AuthService);
  public toastr = inject(ToastrService);
  public localStorageService = inject(LocalStorageService);
  anio = '2025';

  ngOnInit() {
    this.loginForm = this.formBuilder.group({
      email: new FormControl(
        'cesar.riojas@hotmail.com',
        // '',
        [
          Validators.required,
          Validators.email,
        ]
      ),
      password: new FormControl(
        'easZIhn1',
        // '',
        [Validators.required,]
      ),
    });

    this.anio = new Date().getFullYear().toString();
  }

  async onSubmitLoginForm() {
    this.loginForm.markAllAsTouched();
    this.spinnerService.show();

    const email = this.loginForm.get('email')?.value;
    const password = this.loginForm.get('password')?.value;

    let loginResponse;


    try {
      loginResponse = await this.authService.login(email, password);
    } catch (error: any) {
      this.spinnerService.hide();
      const apiError = error.error.message;
      this.toastr.error(apiError, '¡Ups!');
      return;
    }

    this.spinnerService.hide();
    this.toastr.success(
      `${loginResponse.user.name} ${loginResponse.user.last_names} `,
      'Bienvenid@',
    );

    this.localStorageService.setItem('user', JSON.stringify(loginResponse.user));
    this.localStorageService.setItem('apiToken', loginResponse.token);

    this.router.navigateByUrl('dashboard');
  }

  async onSubmitRegisterForm(form: FormGroup) {
    this.loginForm.markAllAsTouched();
    if (form.invalid) {
      return;
    }
    console.log('DEBUG: formvalue', form.value);
    this.spinnerService.show();

    const user = {
      email: form.get('email')?.value,
      name: form.get('firstName')?.value,
      last_names: form.get('lastName')?.value,
      birth_date: form.get('birthDate')?.value,
      gender: form.get('gender')?.value,
    };

    let registerResponse;

    try {
      registerResponse = await this.authService.register(user);
    } catch (error: any) {
      this.spinnerService.hide();
      const apiError = error.error.message;
      this.toastr.error(apiError, '¡Ups!');
      return;
    }

    console.log('DEBUG: registerResponse', registerResponse);
    this.spinnerService.hide();
    this.toastr.success(
      registerResponse.message,
    );

    this.localStorageService.setItem('user', JSON.stringify(registerResponse.user));
    this.localStorageService.setItem('apiToken', registerResponse.token);

    this.router.navigateByUrl('dashboard');
  }

  async onSubmitRecoverPasswordForm(form: FormGroup<any>) {
    form.markAllAsTouched();
    if (form.invalid) {
      return;
    }
    console.log('DEBUG: formvalue', form.value);
    this.spinnerService.show();

    const user = {
      email: form.get('email')?.value,
      name: form.get('firstName')?.value,
      last_names: form.get('lastName')?.value,
      birth_date: form.get('birthDate')?.value,
      gender: form.get('gender')?.value,
    };

    let forgotPasswordResponse;
    const email = form.get('email')?.value

    try {
      forgotPasswordResponse = await this.authService.forgotPassword(email);
    } catch (error: any) {
      this.spinnerService.hide();
      const apiError = error.error.message;
      this.toastr.error(apiError, '¡Ups!');
      return;
    }

    console.log('DEBUG: registerResponse', forgotPasswordResponse);
    this.showRecoverPasswordDialog = false;
    this.spinnerService.hide();
    this.toastr.success(
      forgotPasswordResponse.message,
    );
  }

}
