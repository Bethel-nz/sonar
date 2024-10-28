import { z } from 'zod';

const SonarApiKeySchema = z
  .string()
  .regex(
    /^sonar_[a-zA-Z0-9_-]+$/,
    'API key must start with "sonar_" followed by alphanumeric characters, hyphens, or underscores'
  );

const SonarProjectIdSchema = z
  .string()
  .regex(
    /^prj_[a-zA-Z0-9_-]+$/,
    'Project ID must start with "prj_" followed by alphanumeric characters, hyphens, or underscores'
  );

export function validateSonarKey(
  key: string,
  type: 'apiKey' | 'projectId'
): {
  valid: boolean;
  message?: string;
} {
  try {
    if (type === 'apiKey') {
      SonarApiKeySchema.parse(key);
    } else {
      SonarProjectIdSchema.parse(key);
    }
    return { valid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, message: error.errors[0].message };
    }
    return { valid: false, message: `Invalid ${type}` };
  }
}

export function isValidSonarKey(
  key: string,
  type: 'apiKey' | 'projectId'
): boolean {
  return validateSonarKey(key, type).valid;
}
