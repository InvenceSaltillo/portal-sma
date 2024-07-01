import { Injectable, signal, computed } from '@angular/core';
import { User } from '../../interfaces/user.interface';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {
  userSignal = signal<User | null>(null);

  public user = computed(() => this.userSignal());

  constructor() { }

  setUser(user: User): void {
    localStorage.setItem('user', JSON.stringify(user));
    this.userSignal.set(user);
  }

  getUser(): User | null {
    const userString = localStorage.getItem('user');

    if (!userString) {
      return null;
    }
    return JSON.parse(userString) ;
  }

  setItem(key: string, value: string): void {
    localStorage.setItem(key, value);
  }

  getItem(key: string): string | null {
    return localStorage.getItem(key);
  }
}
