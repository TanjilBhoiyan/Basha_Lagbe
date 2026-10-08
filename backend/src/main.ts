import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Check every request body against its DTO (e.g. RegisterDto) before it reaches a controller.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // drop fields that are not in the DTO
      forbidNonWhitelisted: true, // ...and reject requests that send them
      transform: true, // run @Transform (e.g. phone normalising)
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();