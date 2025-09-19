import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from "@nestjs/common";
import { Response } from "express";
import { ZodError } from "zod";

@Catch(ZodError)
export class ZodExceptionFilter implements ExceptionFilter {
  catch(exception: ZodError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const errors = exception.issues;
    res.status(HttpStatus.BAD_REQUEST).json({
      error: {
        code: 400,
        message: "Validation failed",
        details: errors.map((e) => ({
          path: e.path.join("."),
          message: e.message,
          code: e.code,
        })),
      },
    });
  }
}
