import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CustomDialogComponent } from '../../shared/components/custom-dialog/custom-dialog.component';
import { CustomDialogConfig, FormControlConfig, FormControlType } from '../../interfaces/custom.dialog.interfaces';

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
    },
    {
      name: 'firstName',
      label: 'Nombre(s)',
      type: FormControlType.TEXT,
      validators: [
        Validators.required,
      ],
    },
    {
      name: 'lastName',
      label: 'Apellido(s)',
      type: FormControlType.TEXT,
      validators: [
        Validators.required,
      ],
    },
    {
      name: 'birthDate',
      label: 'Fecha de nacimiento',
      type: FormControlType.DATE,
      validators: [
        Validators.required,
      ],
    },
    {
      name: 'gender',
      label: 'Sexo',
      type: FormControlType.SELECT,
      validators: [
        Validators.required,
      ],
      initialValue: '',
      placeholder: '--Seleccione una opción--',
      selectTypeOptions: [
        { value: 'male', label: 'Masculino' },
        { value: 'female', label: 'Femenino' },
      ],
    },
  ];

  registerDialogConfig: CustomDialogConfig = {
    dialogTitle: 'Crear cuenta',
    confirmButtonLabel: 'Registrarse',
    svgIconPath: 'M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z'
  };

  ngOnInit() {
    this.loginForm = this.formBuilder.group({
      email: new FormControl(
        '',
        [
          Validators.required,
          Validators.email,
        ]
      ),
      password: new FormControl('', [Validators.required,]),
    });
  }

  async onSubmitLoginForm() {
    console.log('DEBUG: formvalue', this.loginForm.value);
    this.loginForm.markAllAsTouched();
  }

  async onSubmitRecoverPasswordForm(form: FormGroup<any>) {
    form.markAllAsTouched();
    if (form.invalid) {
      return;
    }
    console.log('DEBUG: recoverPasswordForm', form.value);
  }

}
