export interface UpdateUserProfileInput {
  userId: string;
  firstName?: string | null;
  lastName?: string | null;
  userName?: string | null;
  dateOfBirth?: Date | null;
}
