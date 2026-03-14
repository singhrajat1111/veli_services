import { NewUserProps, UserAccountStatus } from "@/modules/user/user.types";

export class User {
  private constructor(
    private readonly _firstName: string,
    private readonly _lastName: string,
    private readonly _email: string,
    private readonly _termsConditionVersionAccepted: string,
    private _accountStatus: UserAccountStatus,
    // TODO: Add these commented fields if data is available from the signup input or social provider. For now, we will set them as null or default values in the factory methods.
    private readonly _phoneNumber: string,
    // private readonly _dob: Date | null,
    // private readonly _ageGroup: string | null,
  ) {}

  //   Factory methods for creating users based on different authentication providers
  static createPhoneUser(props: NewUserProps): User {
    return new User(
      props.firstName,
      props.lastName,
      props.email,
      props.termsConditionVersionAccepted,
      UserAccountStatus.Active,
      props.phoneNumber,
    );
  }

  static createSocialUser(props: NewUserProps): User {
    // TODO: For social users, confirm the fields returned by the social provider and populate them accordingly. For now, we will set empty or undefined values for missing fields.
    return new User(
      props.firstName,
      props.lastName,
      props.email,
      props.termsConditionVersionAccepted,
      UserAccountStatus.Active,
      "",
    );
  }
  //   Getters for user properties
  get firstName(): string {
    return this._firstName;
  }

  get lastName(): string {
    return this._lastName;
  }

  get email(): string {
    return this._email;
  }

  get phoneNumber(): string {
    return this._phoneNumber;
  }

  get accountStatus(): UserAccountStatus {
    return this._accountStatus;
  }

  get termsConditionVersionAccepted(): string {
    return this._termsConditionVersionAccepted;
  }
  //   Additional methods related to user behavior can be added here, such as updating profile information, changing password, etc.

  canLogin(): boolean {
    // Implement logic to determine if the user can log in based on account status, verification, etc.
    return this._accountStatus === UserAccountStatus.Active;
  }

  markAccountAsVerified(): void {
    if (this._accountStatus !== UserAccountStatus.PendingVerification) {
      throw new Error("Account is not in a state that can be verified.");
    }
    this._accountStatus = UserAccountStatus.Active;
  }

  disableAccount(): void {
    // Implement logic to disable the user's account
  }
}
