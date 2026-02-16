import type { Request, Response, NextFunction } from 'express';

type ValidationRule = {
  field: string;
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'object' | 'array';
  enum?: string[];
  maxLength?: number;
  minLength?: number;
};

/**
 * Skapar en valideringsmiddleware baserat på regler.
 */
export function validateBody(rules: ValidationRule[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: string[] = [];

    for (const rule of rules) {
      const value = req.body[rule.field];

      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push(`'${rule.field}' krävs`);
        continue;
      }

      if (value === undefined || value === null) continue;

      if (rule.type === 'array') {
        if (!Array.isArray(value)) {
          errors.push(`'${rule.field}' måste vara en lista`);
          continue;
        }
      } else if (rule.type && typeof value !== rule.type) {
        errors.push(`'${rule.field}' måste vara av typ ${rule.type}`);
        continue;
      }

      if (rule.enum && !rule.enum.includes(value)) {
        errors.push(`'${rule.field}' måste vara ett av: ${rule.enum.join(', ')}`);
      }

      if (rule.maxLength && typeof value === 'string' && value.length > rule.maxLength) {
        errors.push(`'${rule.field}' får vara max ${rule.maxLength} tecken`);
      }

      if (rule.minLength && typeof value === 'string' && value.length < rule.minLength) {
        errors.push(`'${rule.field}' måste vara minst ${rule.minLength} tecken`);
      }
    }

    if (errors.length > 0) {
      res.status(400).json({ error: 'Valideringsfel', details: errors });
      return;
    }

    next();
  };
}

/**
 * Validerar att :id-parametern ser ut som ett UUID.
 */
export function validateUuidParam(paramName = 'id') {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  return (req: Request, res: Response, next: NextFunction): void => {
    const value = req.params[paramName];
    if (!value || !uuidRegex.test(value)) {
      res.status(400).json({ error: `Ogiltigt ID-format för '${paramName}'` });
      return;
    }
    next();
  };
}
