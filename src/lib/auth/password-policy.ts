export type PasswordStrength = "weak" | "fair" | "good" | "strong";

export type PasswordValidationResult = {
  valid: boolean;
  strength: PasswordStrength;
  score: number;
  checks: {
    minLength: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
  };
};

const MIN_LENGTH = 12;

export function validatePasswordPolicy(password: string): PasswordValidationResult {
  const checks = {
    minLength: password.length >= MIN_LENGTH,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
  };

  const passedCount = Object.values(checks).filter(Boolean).length;
  const valid = passedCount === 4;

  let strength: PasswordStrength = "weak";
  let score = 0;

  if (checks.minLength) score += 1;
  if (checks.uppercase) score += 1;
  if (checks.lowercase) score += 1;
  if (checks.number) score += 1;

  if (password.length >= 16 && passedCount >= 3) {
    score += 1;
  }

  if (score <= 2) {
    strength = "weak";
  } else if (score === 3) {
    strength = "fair";
  } else if (score === 4) {
    strength = "good";
  } else {
    strength = "strong";
  }

  return { valid, strength, score, checks };
}

export function passwordStrengthLabel(strength: PasswordStrength): string {
  switch (strength) {
    case "weak":
      return "Weak";
    case "fair":
      return "Fair";
    case "good":
      return "Good";
    case "strong":
      return "Strong";
  }
}

export function passwordStrengthPercent(strength: PasswordStrength): number {
  switch (strength) {
    case "weak":
      return 25;
    case "fair":
      return 50;
    case "good":
      return 75;
    case "strong":
      return 100;
  }
}
