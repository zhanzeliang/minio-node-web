import { Module } from '@nestjs/common';
import { uploadFileProviders } from './uploadFile.provider';
import { UploadFileService } from './uploadFile.service';
import { DatabaseModule } from 'src/providers/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [...uploadFileProviders, UploadFileService],
  exports: [UploadFileService],
})
export class UploadFileModule {}
