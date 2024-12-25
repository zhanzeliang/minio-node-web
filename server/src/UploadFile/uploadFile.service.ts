import { Injectable, Inject } from '@nestjs/common';
import { Repository } from 'typeorm';
import { UploadFile } from '../dbEntities/uploadFile.entity';
import type { CreateUploadFileDto } from './uploadFile.dto';

@Injectable()
export class UploadFileService {
  constructor(
    @Inject('UPLOAD_FILE_REPOSITORY')
    private uploadFileRepository: Repository<UploadFile>,
  ) {}

  async getList(): Promise<UploadFile[]> {
    return this.uploadFileRepository.find();
  }

  async findOneByMd5(md5: string): Promise<UploadFile> {
    return this.uploadFileRepository.findOne({ where: { md5 } });
  }

  async create(uploadFile: CreateUploadFileDto): Promise<UploadFile> {
    return this.uploadFileRepository.save(uploadFile);
  }
}
