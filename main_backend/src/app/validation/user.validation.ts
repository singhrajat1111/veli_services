import z from "zod";

/*
====================================================================================
*/
// Age rules for different member labels

const AGE_RULES = {
  infant: { minDays: 0, maxMonths: 11 },
  child: { minYears: 1, maxYears: 17 },
  adult: { minYears: 18, maxYears: 64 },
  senior: { minYears: 65 },
  pet: null,
} as const;

// Helper functions to calculate age in years and months
const getAgeInYears = (dob: Date): number => {
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();

  const hasBirthdayPassed =
    now.getMonth() > dob.getMonth() ||
    (now.getMonth() === dob.getMonth() && now.getDate() >= dob.getDate());

  if (!hasBirthdayPassed) {
    age--;
  }

  return age;
};

const getAgeInMonths = (dob: Date): number => {
  const now = new Date();
  return (now.getFullYear() - dob.getFullYear()) * 12 + (now.getMonth() - dob.getMonth());
};

/*
====================================================================================
*/

// Zod schema for validating member details during onboarding

const memberDetailsSchema = z
  .object(
    {
      memberType: z
        .string({
          error: "Member type is required",
        })
        .min(3, "Member type is required"),
      // Age group can be one of infant(<12 months), child(1-17 years), adult(18-64 years), senior(65+ years), or pet
      memberAgeGroup: z.enum(["infant", "child", "adult", "senior", "pet"]),
      memberFirstName: z.string().min(3, "Member name is required"),
      memberProfilePic: z.url("Invalid URL for member profile picture:").optional().nullable(),
      memberDOB: z.coerce.date({
        error: "Invalid date of birth for member",
      }),
      memberEmail: z.email("Invalid email address for member"),
      memberDietaryNeeds: z
        .array(z.string("Invalid dietary need").min(1), {
          error: "Invalid dietary needs for member",
        })
        .optional()
        .nullable(),
    },
    {
      error: "Invalid member details",
    },
  )
  .superRefine((data, ctx) => {
    const { memberAgeGroup, memberDOB } = data;

    if (memberAgeGroup === "pet") {
      return; // Skip age validation for pets
    }

    const now = new Date();

    if (memberDOB > now) {
      ctx.addIssue({
        path: ["memberDOB"],
        message: "Date of birth cannot be in the future",
        code: "custom",
      });
      return;
    }

    if (memberAgeGroup === "infant") {
      const ageInMonths = getAgeInMonths(memberDOB);
      if (ageInMonths > 11) {
        ctx.addIssue({
          path: ["memberDOB"],
          message: "Infant members must be less than 12 months old",
          code: "custom",
        });
        return;
      }
    }

    const ageInYears = getAgeInYears(memberDOB);

    if (memberAgeGroup === "child") {
      if (ageInYears < 1 || ageInYears > 17) {
        ctx.addIssue({
          path: ["memberDOB"],
          message: "Child members must be between 1 and 17 years old",
          code: "custom",
        });
        return;
      }
    }

    if (memberAgeGroup === "adult") {
      if (ageInYears < 18 || ageInYears > 64) {
        ctx.addIssue({
          path: ["memberDOB"],
          message: "Adult members must be between 18 and 64 years old",
          code: "custom",
        });
        return;
      }
    }

    if (memberAgeGroup === "senior") {
      if (ageInYears < 65) {
        ctx.addIssue({
          path: ["memberDOB"],
          message: "Senior members must be at least 65 years old",
          code: "custom",
        });
        return;
      }
    }
  });

const onboardingBodySchema = {
  1: z.object({
    address: z.string().min(1, "Address is required"),
    address2: z.string().optional().nullable(),
    dob: z.coerce.date({ message: "Invalid date of birth" }),
    gender: z.enum(["male", "female", "other"], { message: "Invalid gender" }),
    profilePicture: z.url("Invalid URL for profile picture:").optional().nullable(),
  }),
  2: z.object({
    members: z.array(z.string().min(3, "Member type is required")),
  }),
  3: z.object({
    memberDetails: z.array(memberDetailsSchema, {
      error: "Invalid member details array",
    }),
  }),
  4: z.object({
    allergies: z.array(z.uuid().min(3, "Preference is required")).optional(),
  }),
  5: z.object({
    foodPreferences: z.array(z.uuid().min(3, "Preference is required")).optional(),
  }),
  6: z.object({
    cuisinePreferences: z.array(z.uuid().min(3, "Preference is required")).optional(),
  }),
} as const;

export const CompleteOnboardingInputSchema = z.discriminatedUnion("step", [
  z.object({
    userId: z.string().uuid(),
    step: z.literal(1),
    data: onboardingBodySchema[1],
  }),
  z.object({
    userId: z.string().uuid(),
    step: z.literal(2),
    data: onboardingBodySchema[2],
  }),
  z.object({
    userId: z.string().uuid(),
    step: z.literal(3),
    data: onboardingBodySchema[3],
  }),
  z.object({
    userId: z.string().uuid(),
    step: z.literal(4),
    data: onboardingBodySchema[4],
  }),
  z.object({
    userId: z.string().uuid(),
    step: z.literal(5),
    data: onboardingBodySchema[5],
  }),
  z.object({
    userId: z.string().uuid(),
    step: z.literal(6),
    data: onboardingBodySchema[6],
  }),
]);

export type CompleteOnboardingInput = z.infer<typeof CompleteOnboardingInputSchema>;
