/**
 * Transport/channel used to deliver a notification.
 *
 * A single Notification may have multiple deliveries using different
 * channels. Keeping this separate from NotificationType prevents the
 * business event and delivery mechanism from becoming coupled.
 */
export enum NotificationChannel {
  IN_APP = "IN_APP",
  EMAIL = "EMAIL",
  SMS = "SMS",
  TELEGRAM = "TELEGRAM",
}
