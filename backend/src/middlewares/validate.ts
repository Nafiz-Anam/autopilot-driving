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

      const value = combinedSchema.parse(obj);
      Object.assign(req, value);
      return next();
    } catch (error) {
      const errorMessage =
        error instanceof z.ZodError
          ? error.issues.map(err => err.message).join(', ')
          : 'Validation error';
      return next(new ApiError(httpStatus.BAD_REQUEST, errorMessage));
    }
  };

export default validate;
