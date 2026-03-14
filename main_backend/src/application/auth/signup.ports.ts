import { DbClient } from "@/infrastructure/db";
import {
  UserInsert,
  UserRow,
  UserSelectColumns,
  UserUpdateInsert,
} from "@/infrastructure/db/schema/types/users.types";
import { User } from "@/modules/user/user.entity";

export interface UserRepository {
  findByEmail(
    email: string,
    tx: DbClient,
    returnColumns?: UserSelectColumns,
  ): Promise<{ userId: string | null }>;
  save(user: User, tx: DbClient): Promise<{ insertedId: string }>;

  findUserByEmail<TColumns extends UserSelectColumns>(
    email: string,
    returnColumns: TColumns,
    tx: DbClient,
  ): Promise<Pick<UserRow, Extract<keyof TColumns, keyof UserRow>> | null>;

  addSocialUser<TInsert extends UserInsert>(
    socialUserInfo: TInsert,
    tx: DbClient,
  ): Promise<{ insertedId: string; onboardingStep: number }>;

  findByContactNumber<TColumns extends UserSelectColumns>(
    contactNumber: string,
    columns: TColumns,
  ): Promise<Pick<UserRow, Extract<keyof TColumns, keyof UserRow>> | null>;

  findById<TColumns extends UserSelectColumns>(
    userId: string,
    columns: TColumns,
  ): Promise<Pick<UserRow, Extract<keyof TColumns, keyof UserRow>> | null>;

  verifyAndUpdateStep(
    userId: string,
    step: number,
    tx: DbClient,
  ): Promise<{
    onboardingStep: number | null;
  } | null>;

  updateUser(userId: string, updateData: UserUpdateInsert, tx: DbClient): Promise<boolean>;
}

export interface PasswordHasher {
  hash(password: string): Promise<string>;
}

export interface IdGenerator {
  generate(): string;
}
