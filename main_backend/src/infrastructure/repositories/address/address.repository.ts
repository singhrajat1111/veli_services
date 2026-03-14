import { AddressRepository } from "@/application/address/address.ports";
import { DbClient } from "@/infrastructure/db";
import { addresses } from "@/infrastructure/db/schema";
import { AddressInsertInput } from "@/infrastructure/db/schema/types/addresses.types";

export class AddressRepositoryImpl implements AddressRepository {
  async addUserAddress(
    userId: string,
    addressData: {
      addressLine1: string;
      addressLine2: string | null;
    },
    tx: DbClient,
  ): Promise<boolean> {
    const addressDate: AddressInsertInput = {
      userId,
      addressLine1: addressData.addressLine1,
      addressLine2: addressData.addressLine2 || null,
    };

    const result = await tx
      .insert(addresses)
      .values(addressDate)
      .returning({ insertedId: addresses.id });
    if (!result || result.length === 0) {
      return false;
    }
    return true;
  }
}
