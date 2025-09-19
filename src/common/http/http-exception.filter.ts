import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from "@nestjs/common";
import { Response } from "express";

function extractMessage(resp: unknown, fallback: string): string {
  if (typeof resp === "string") return resp;
  if (resp && typeof resp === "object") {
    const body = resp as Record<string, unknown>;
    const msg = body["message"];
    if (typeof msg === "string") return msg;
    if (Array.isArray(msg) && msg.every((v) => typeof v === "string"))
      return msg.join("; ");
    const err = body["error"];
    if (typeof err === "string") return err;
  }
  return fallback;
}

@Catch(HttpException)
export class HttpJsonExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();

    const status = exception.getStatus();
    const resp = exception.getResponse(); // type: string | object
    const message = extractMessage(resp, exception.message);

    res.status(status).json({
      error: {
        code: status,
        message,
        details: [],
      },
    });
  }
}
