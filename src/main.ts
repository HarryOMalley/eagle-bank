import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ZodValidationPipe } from "nestjs-zod";
import { ZodExceptionFilter } from "./common/validation/zod-exception.filter";
import { HttpJsonExceptionFilter } from "./common/http/http-exception.filter";
import helmet from "helmet";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("v1");
  app.use(helmet());
  app.useGlobalPipes(new ZodValidationPipe());
  app.useGlobalFilters(new ZodExceptionFilter(), new HttpJsonExceptionFilter());
  await app.listen(process.env.PORT ? Number(process.env.PORT) : 3000);
}
bootstrap();
