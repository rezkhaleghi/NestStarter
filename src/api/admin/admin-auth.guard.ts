import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { UserRole } from "../../domain/enums/user-role.enum";
import { UserRepository } from "../../domain/repositories/user.repository";

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(private readonly userRepository: UserRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.session?.userId;
    if (!userId) {
      throw new UnauthorizedException();
    }

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException();
    }
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException("Administrator access required.");
    }

    request.user = user;
    return true;
  }
}
