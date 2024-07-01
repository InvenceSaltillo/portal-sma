import { User } from './interfaces/user.interface';

export abstract class AppUtils {

  static getUserFullName(user: User): string {
    return `${user.name} ${user.last_names}`;
  }
}
