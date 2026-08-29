import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { UserRepository } from "../../domain/repositories/user.repository";
import { UserStatus } from "../../domain/enums/user-status.enum";

@Injectable()
export class AuthSessionGuard implements CanActivate {
  constructor(private readonly userRepository: UserRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const userId = request.session?.userId;

    if (!userId) {
      throw new UnauthorizedException();
    }

    const user = await this.userRepository.findById(userId);

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException();
    }

    return true;
  }
}
