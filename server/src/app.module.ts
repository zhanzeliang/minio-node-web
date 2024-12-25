import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MinioUtils } from './MinioUtils';
import { UploadFileModule } from './UploadFile/uploadFile.module';
import { createClient } from 'redis';
import databaseConfig from './config/database.config';
import minioConfig from './config/minio.config';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    UploadFileModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, minioConfig],
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    MinioUtils,
    {
      provide: 'REDIS_CLIENT',
      async useFactory() {
        const client = createClient({
          socket: {
            host: 'localhost',
            port: 6379,
          },
        });
        await client.connect();
        return client;
      },
    },
  ],
})
export class AppModule {}
