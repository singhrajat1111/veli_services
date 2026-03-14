import { DbClient } from "@/infrastructure/db";
import {
  PersonsInsertRow,
  PersonsReturnRow,
  SelectPersonsColumns,
} from "@/infrastructure/db/schema/types/persons.types";

export interface PersonsRepository {
  addNewPerson(personData: PersonsInsertRow, tx: DbClient): Promise<boolean>;
  addMultiplePersons(personsData: PersonsInsertRow[], tx: DbClient): Promise<boolean>;
  findPersonByTypeAndId<TColumns extends SelectPersonsColumns>(
    type: string,
    id: string,
    returnColumns: TColumns,
    tx: DbClient,
  ): Promise<Pick<PersonsReturnRow, Extract<keyof TColumns, keyof PersonsReturnRow>> | null>;
}
