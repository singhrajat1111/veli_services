export interface CompleteOnboardingResult {
  nextStep: number | null;
  completed: boolean;
}

export interface OnboardingCase1Payload {
  address: string;
  address2?: string | null;
  dob: Date;
  gender: "male" | "female" | "other";
  profilePicture?: string | null;
}

export interface OnboardingCase2Payload {
  members: string[];
}

export interface OnboardingCase3Payload {
  memberDetails: {
    memberType: string;
    memberLabel: string;
    memberFirstName: string;
    memberProfilePic?: string | null;
    memberDOB: Date;
    memberEmail: string;
    memberDietaryNeeds?: string[] | null;
  }[];
}

export interface OnboardingCase4Payload {
  allergies?: string[];
}

export interface OnboardingCase5Payload {
  foodPreferences?: string[];
}

export interface OnboardingCase6Payload {
  cuisinePreferences?: string[];
}
