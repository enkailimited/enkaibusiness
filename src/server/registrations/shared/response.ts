export interface RegistrationResponse<T = void> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
}

export function success<T>(message: string, data?: T): RegistrationResponse<T> {
  return { success: true, message, data };
}

export function failure<T = never>(message: string, errors?: Record<string, string[]>): RegistrationResponse<T> {
  return { success: false, message, errors };
}
