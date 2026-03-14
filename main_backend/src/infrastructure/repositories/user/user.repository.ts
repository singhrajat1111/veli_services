import { and, eq } from "drizzle-orm";

import { DbClient, getDb } from "@/infrastructure/db";
import { User } from "@/modules/user/user.entity";
import { users } from "@/infrastructure/db/schema";
import { UserRepository } from "@/application/auth/signup.ports";
import {
  UserInsert,
  UserRow,
  UserSelectColumns,
  UserUpdateInsert,
} from "@/infrastructure/db/schema/types/users.types";

export class DBUserWriteRepository implements UserRepository {
  async findByEmail(_email: string, tx: DbClient): Promise<{ userId: string | null }> {
    const client = tx;
    if (!client) {
      throw new Error("Database client not available");
    }

    const rows = await client.select().from(users).where(eq(users.email, _email));

    const result = rows[0];
    return { userId: result ? result.id : null };
  }

  // TODO: A different variation of the findByEmail method that allows selecting specific columns should be implemented to optimize queries in the social login flow. This will prevent fetching unnecessary data and improve performance. The method signature could look like this:
  async findUserByEmail<TColumns extends UserSelectColumns>(
    email: string,
    returnColumns: TColumns,
    tx: DbClient,
  ): Promise<Pick<UserRow, Extract<keyof TColumns, keyof UserRow>> | null> {
    const client = tx;
    if (!client) {
      throw new Error("Database client not available");
    }

    const row = await client.query.users.findFirst({
      where: eq(users.email, email),
      columns: returnColumns,
    });

    if (!row) {
      return null;
    }

    return row as unknown as Pick<UserRow, Extract<keyof TColumns, keyof UserRow>>;
  }

  async save(_user: User, tx: DbClient): Promise<{ insertedId: string }> {
    const client = tx;
    if (!client) {
      throw new Error("Database client not available");
    }
    // REMINDER: Ensure that the fields being inserted here match the properties of the User entity and the required(not null) columns database schema. You may need to adjust the field names and values accordingly.
    const result = await client
      .insert(users)
      .values({
        firstName: _user.firstName,
        lastName: _user.lastName,
        email: _user.email,
        termsConditionVersionAccepted: _user.termsConditionVersionAccepted,
        contactNumber: _user.phoneNumber,
      })
      .returning({ insertedId: users.id });
    return result[0];
  }

  async addSocialUser<TInsert extends UserInsert>(
    socialUserInfo: TInsert,
    tx: DbClient,
  ): Promise<{ insertedId: string; onboardingStep: number }> {
    const client = tx;
    if (!client) {
      throw new Error("Database client not available");
    }

    const result = await client
      .insert(users)
      .values(socialUserInfo)
      .returning({ insertedId: users.id, onboardingStep: users.onboardingStep });

    if (!result || result.length === 0) {
      throw new Error("Invariant violation: user insert returned no rows");
    }

    const row = result[0];

    if (!row.insertedId || !row.onboardingStep) {
      throw new Error("Invariant violation: inserted user id or onboarding step is null");
    }

    return { insertedId: row.insertedId, onboardingStep: row.onboardingStep };
  }

  async findByContactNumber<TColumns extends UserSelectColumns>(
    contactNumber: string,
    columns: TColumns,
  ): Promise<Pick<UserRow, Extract<keyof TColumns, keyof UserRow>> | null> {
    const client = await getDb();
    if (!client) return null;

    const row = await client.query.users.findFirst({
      where: eq(users.contactNumber, contactNumber),
      columns,
    });

    if (!row) {
      return null;
    }

    return row as unknown as Pick<UserRow, Extract<keyof TColumns, keyof UserRow>>;
  }

  async findById<TColumns extends UserSelectColumns>(
    userId: string,
    columns: TColumns,
  ): Promise<Pick<UserRow, Extract<keyof TColumns, keyof UserRow>> | null> {
    const client = await getDb();
    if (!client) {
      return null;
    }

    const row = client.query.users.findFirst({
      where: eq(users.id, userId),
      columns,
    });

    if (!row) {
      return null;
    }
    return row as unknown as Pick<UserRow, Extract<keyof TColumns, keyof UserRow>>;
  }

  async verifyAndUpdateStep(
    userId: string,
    step: number,
    tx: DbClient,
  ): Promise<{ onboardingStep: number | null } | null> {
    const client = tx;
    if (!client) {
      throw new Error("Database client not available");
    }

    const row = await client
      .update(users)
      .set({ onboardingStep: step < 6 ? step + 1 : 6 })
      .where(and(eq(users.id, userId), eq(users.onboardingStep, step)))
      .returning({ onboardingStep: users.onboardingStep });

    if (!row || row.length === 0) {
      return null;
    }

    return row[0];
  }

  async updateUser(userId: string, updateData: UserUpdateInsert, tx: DbClient): Promise<boolean> {
    const result = await tx
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning({ id: users.id });

    if (!result || result.length === 0) {
      return false;
    }

    return true;
  }

  async findByProviderId<TColumns extends UserSelectColumns>(
    provider: string,
    providerId: string,
    columns: TColumns,
    tx: DbClient,
  ): Promise<Pick<UserRow, Extract<keyof TColumns, keyof UserRow>> | null> {
    const client = tx;
    if (!client) {
      throw new Error("Database client not available");
    }

    const rows = await client.query.users.findFirst({
      where: and(
        eq(users.authProvider, provider),
        eq(users.providerUserId, providerId),
        eq(users.isDeleted, false),
      ),
      columns: columns,
    });

    if (!rows) {
      throw new Error("User not found");
    }

    return rows as unknown as Pick<UserRow, Extract<keyof TColumns, keyof UserRow>>;
  }
}
