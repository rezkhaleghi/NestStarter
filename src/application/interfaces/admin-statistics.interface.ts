export interface AdminStatistics {
  totalUsers: number;
  totalAdmins: number;
  verifiedUsers: number;
  unverifiedUsers: number;
}

export abstract class AdminStatisticsService {
  abstract getStatistics(): Promise<AdminStatistics>;
}
