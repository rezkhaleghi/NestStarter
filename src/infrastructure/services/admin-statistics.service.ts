import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  AdminStatistics,
  AdminStatisticsService,
} from "../../application/interfaces/admin-statistics.interface";
import { UserOrmEntity } from "../database/orm-entities/user.orm-entity";
import { UserRole } from "../../domain/enums/user-role.enum";

@Injectable()
export class AdminStatisticsServiceImpl extends AdminStatisticsService {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly userRepository: Repository<UserOrmEntity>,
  ) {
    super();
  }

  async getStatistics(): Promise<AdminStatistics> {
    const [totalUsers, totalAdmins, verifiedUsers] = await Promise.all([
      this.userRepository.count(),

      this.userRepository.count({
        where: {
          role: UserRole.ADMIN,
        },
      }),

      this.userRepository.count({
        where: {
          emailVerified: true,
        },
      }),
    ]);

    return {
      totalUsers,
      totalAdmins,
      verifiedUsers,
      unverifiedUsers: totalUsers - verifiedUsers,
    };
  }
}
