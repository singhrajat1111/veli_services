import { User } from "./user.entity";

export const UserRules = {
  canAttemptLogin(user: User): boolean {
    return user.canLogin();
  },

  requiresEmailVerification(user: User): boolean {
    return user.accountStatus === "PENDING_VERIFICATION";
  },
};
