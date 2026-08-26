import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, VerifyCallback, Profile } from "passport-google-oauth20";

/**
 * Passport strategy — purely a technical adapter for talking to Google's
 * OAuth endpoints. It extracts { email, googleId } from Google's profile
 * and hands it off; it does NOT decide what happens with a user record
 * (that's GoogleAuthUseCase's job, called from the controller).
 */
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, "google") {
  constructor(configService: ConfigService) {
    super({
      clientID: configService.getOrThrow<string>("GOOGLE_CLIENT_ID"),
      clientSecret: configService.getOrThrow<string>("GOOGLE_CLIENT_SECRET"),
      callbackURL: configService.getOrThrow<string>("GOOGLE_CALLBACK_URL"),
      scope: ["email", "profile"],
    });
  }

  validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): void {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      return done(new Error("Google account has no email"), undefined);
    }
    if (profile._json?.email_verified === false) {
      return done(new Error("Google account email is not verified"), undefined);
    }
    done(null, { email, googleId: profile.id });
  }
}
