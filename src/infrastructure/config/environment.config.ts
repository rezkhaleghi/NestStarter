/**
 * Compile-time contract for all environment configuration used by the app.
 *
 * Runtime validation is still handled by Joi in InfrastructureModule.
 * This interface prevents configuration consumers from accidentally using
 * misspelled keys or incorrect value types.
 */
export interface EnvironmentConfig {
  // Application
  NODE_ENV: "development" | "test" | "production";
  PORT: number;
  TRUST_PROXY: number;
  FRONTEND_URL: string;
  SWAGGER_ENABLED: boolean;
  DEFAULT_CURRENCY: string;

  // PostgreSQL
  DB_HOST: string;
  DB_PORT: number;
  DB_USERNAME: string;
  DB_PASSWORD: string;
  DB_NAME: string;

  // Redis
  REDIS_HOST: string;
  REDIS_PORT: number;
  REDIS_PASSWORD: string;
  REDIS_TLS: boolean;

  // OTP
  OTP_EXPIRY_SECONDS: number;
  OTP_MAX_ATTEMPTS: number;
  OTP_RESEND_COOLDOWN_SECONDS: number;
  OTP_LOG_CODE: boolean;

  // Login protection
  LOGIN_MAX_ATTEMPTS: number;
  LOGIN_ATTEMPT_WINDOW_SECONDS: number;
  LOGIN_LOCK_SECONDS: number;

  // SMTP
  SMTP_HOST: string;
  SMTP_PORT: number;
  SMTP_SECURE: boolean;
  SMTP_USER: string;
  SMTP_PASSWORD: string;
  SMTP_FROM: string;

  // Sessions
  SESSION_SECRET: string;

  // Initial administrator
  INITIAL_ADMIN_EMAIL: string;
  INITIAL_ADMIN_PASSWORD: string;

  // Google OAuth
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_CALLBACK_URL: string;

  // MinIO
  MINIO_ENDPOINT: string;
  MINIO_PORT: number;
  MINIO_ACCESS_KEY: string;
  MINIO_SECRET_KEY: string;
  MINIO_BUCKET: string;
  MINIO_USE_SSL: boolean;
}
