import { Injectable } from "@nestjs/common";
import {
  AdminStatistics,
  AdminStatisticsService,
} from "@application/interfaces/admin-statistics.interface";

@Injectable()
export class GetAdminStatisticsUseCase {
  constructor(
    private readonly adminStatisticsService: AdminStatisticsService,
  ) {}

  async execute(): Promise<AdminStatistics> {
    return this.adminStatisticsService.getStatistics();
  }
}
