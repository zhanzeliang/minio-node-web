import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MinioUtils } from './MinioUtils';
import { UploadFileModule } from './UploadFile/uploadFile.module';
import { createClient } from 'redis';

@Module({
  imports: [UploadFileModule],
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
