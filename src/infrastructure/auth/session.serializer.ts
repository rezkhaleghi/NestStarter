import { Injectable } from "@nestjs/common";
import { PassportSerializer } from "@nestjs/passport";

/**
 * Standard Passport piece for session-based auth: decides what gets
 * stored in the session (just the user id) and how to read it back out.
 * Here we store the minimal shape returned by GoogleStrategy.validate().
 */
@Injectable()
export class SessionSerializer extends PassportSerializer {
  serializeUser(
    user: { id: string },
    done: (err: Error | null, id?: string) => void,
  ): void {
    done(null, user.id);
  }

  deserializeUser(
    id: string,
    done: (err: Error | null, payload?: string) => void,
  ): void {
    done(null, id);
  }
}
