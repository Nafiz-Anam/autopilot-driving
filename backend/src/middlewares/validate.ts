import httpStatus from 'http-status';
import ApiError from '../utils/ApiError';
import { NextFunction, Request, Response } from 'express';
import pick from '../utils/pick';
import { z } from 'zod';

const validate =
  (schema: Record<string, z.ZodSchema>) => (req: Request, res: Response, next: NextFunction) => {
    const validSchema = pick(schema, ['params', 'query', 'body']);
    const obj = pick(req, Object.keys(validSchema));

    try {
      // Create a combined schema for validation
      const combinedSchema = z.object(
        Object.keys(validSchema).reduce(
          (acc, key) => {
            acc[key] = validSchema[key] as z.ZodSchema;
            return acc;
          },
          {} as Record<string, z.ZodSchema>
        )
      );

      const value = combinedSchema.parse(obj) as Record<string, unknown>;
      // In Express 5 `req.query` and `req.params` are getter-only, so a blanket
      // Object.assign(req, value) throws for those keys ("Cannot set property
      // query of #<IncomingMessage> which has only a getter"). Only body is
      // safely writable — assign it back if the schema produced a value.
      if (value.body !== undefined) {
        req.body = value.body;
      }
      return next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.issues.map(err => err.message).join(', ');
        return next(new ApiError(httpStatus.BAD_REQUEST, errorMessage));
      }
      // Log non-Zod exceptions so the generic fallback doesn't hide the cause
      console.error('[validate] unexpected error', error);
      return next(new ApiError(httpStatus.BAD_REQUEST, 'Validation error'));
    }
  };

export default validate;
