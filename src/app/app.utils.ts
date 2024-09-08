import { ValidatorFn, Validators } from '@angular/forms';
import { User } from './interfaces/user.interface';

export abstract class AppUtils {

  static getUserFullName(user: User): string {
    return `${user.name} ${user.last_names}`;
  }

  static getControlValidators(validators: any): ValidatorFn[] {
    const validatorsFn: ValidatorFn[] = [];

    if (!!validators) {
      if (validators.required) {
        validatorsFn.push(Validators.required);
      }
      if (validators.email) {
        validatorsFn.push(Validators.email);
      }
    }
    return validatorsFn;
  }
}
