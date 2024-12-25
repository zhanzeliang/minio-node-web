import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ApiTransformInterceptor } from './interceptors/api-transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalInterceptors(new ApiTransformInterceptor(new Reflector()));
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
