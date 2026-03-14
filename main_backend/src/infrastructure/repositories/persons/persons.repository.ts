import { and, eq } from "drizzle-orm";

import { PersonsRepository } from "@/application/persons/persons.ports";
import { DbClient } from "@/infrastructure/db";
import { persons } from "@/infrastructure/db/schema";
import {
  PersonsInsertRow,
  PersonsReturnRow,
  SelectPersonsColumns,
} from "@/infrastructure/db/schema/types/persons.types";

export class PersonsRepositoryImpl implements PersonsRepository {
  async addNewPerson(personData: PersonsInsertRow, tx: DbClient): Promise<boolean> {
    const client = tx;

    if (!client) {
      throw new Error("Database client is not available");
    }

    const insertedRow = await client.insert(persons).values(personData).returning({
      id: persons.id,
    });

    if (!insertedRow) {
      return false;
    }

    return true;
  }

  async addMultiplePersons(personsData: PersonsInsertRow[], tx: DbClient): Promise<boolean> {
    const client = tx;

    if (!client) {
      throw new Error("Database client is not available");
    }
    const insertedRows = await client.insert(persons).values(personsData).returning({
      id: persons.id,
    });
    return insertedRows.length > 0;
  }

  async findPersonByTypeAndId<TColumns extends SelectPersonsColumns>(
    type: string,
    id: string,
    returnColumns: TColumns,
    tx: DbClient,
  ): Promise<Pick<PersonsReturnRow, Extract<keyof TColumns, keyof PersonsReturnRow>> | null> {
    const client = tx;

    if (!client) {
      throw new Error("Database client is not available");
    }

    const foundPerson = await client.query.persons.findFirst({
      where: and(eq(persons.personType, type), eq(persons.referenceId, id)),
      columns: returnColumns,
    });

    if (!foundPerson) {
      return null;
    }

    return foundPerson as unknown as Pick<
      PersonsReturnRow,
      Extract<keyof TColumns, keyof PersonsReturnRow>
    >;
  }
}
