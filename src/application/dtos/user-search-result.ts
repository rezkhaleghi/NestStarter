export interface UserSearchResult {
  id: string;
  firstName: string | null;
  lastName: string | null;
  userName: string | null;
  avatar: string | null;
  bio: string | null;
  email: string;
  dateOfBirth: Date | null;
  createdAt: Date;
}
