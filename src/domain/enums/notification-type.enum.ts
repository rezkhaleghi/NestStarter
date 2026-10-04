/**
 * Business event that caused a notification.
 *
 * This intentionally does NOT describe how the notification is delivered.
 * Delivery mechanism belongs to NotificationChannel.
 *
 * Example:
 *   WITHDRAWAL_APPROVED
 *
 * may create:
 *   - IN_APP delivery
 *   - EMAIL delivery
 *   - SMS delivery
 */
export enum NotificationType {
  WITHDRAWAL_APPROVED = "WITHDRAWAL_APPROVED",
  WITHDRAWAL_REJECTED = "WITHDRAWAL_REJECTED",
}
