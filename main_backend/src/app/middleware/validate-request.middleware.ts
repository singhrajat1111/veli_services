import { Request, Response, NextFunction } from "express";
import { ZodType } from "zod";

import { BadRequestError } from "@/shared/errors/HTTPError";

export const validateRequest =
  (schema: ZodType) => (req: Request, _res: Response, next: NextFunction) => {
    try {
      const result = schema.safeParse({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      if (!result.success) {
        const message = result.error.issues
          .map((issue) => `${issue.path.join(".")} : ${issue.message}`)
          .join(", ");
        throw new BadRequestError(message);
      }
      next();
    } catch (error) {
      next(error);
    }
  };
