import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {

  formBuilder = inject(FormBuilder)
  loginForm!: FormGroup;
  recoverPasswordForm!: FormGroup;
  showModal = false;

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
    this.recoverPasswordForm = this.formBuilder.group({
      email: new FormControl('', [Validators.required, Validators.email]),
    });
  }

  async onSubmitLoginForm() {
    console.log('DEBUG: formvalue', this.loginForm.value);
    this.loginForm.markAllAsTouched();
  }

  async onSubmitRecoverPasswordForm() {
    console.log('DEBUG: recoverPasswordForm', this.recoverPasswordForm.value);
    this.recoverPasswordForm.markAllAsTouched();
  }

}
