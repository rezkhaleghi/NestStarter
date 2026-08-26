/**
 * Application-layer input — the minimal shape a use case needs.
 * Notice: no `otp` field here. By the time we create a user,
 * OTP verification has already happened as a separate use case.
 */
export class CreateUserInput {
  email!: string;
  password!: string;
}
