import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { AppService } from './app.service';
import type { ChunkUploadInfoDto, FileUploadInfo } from './UploadTypes';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';

@Controller('files')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
  @Get('multipart/check/:md5')
  checkByMd5(@Param('md5') md5: string) {
    return this.appService.checkFileByMd5(md5);
  }

  /**
   * 初始化文件分片地址及相关数据
   */
  @Post('multipart/init')
  initMultiPartUpload(@Body() fileUploadInfo: FileUploadInfo) {
    return this.appService.initMultiPartUpload(fileUploadInfo);
  }

  /**
   * 合并分片
   */
  @Post('multipart/merge/:md5')
  mergeMultiPartUpload(@Param('md5') md5: string) {
    return this.appService.mergeMultiPartUpload(md5);
  }

  /**
   * 上传分片
   */
  @Post('multipart/upload')
  @UseInterceptors(FileInterceptor('file'))
  partUpload(
    @UploadedFile() file: Express.Multer.File,
    @Body() chunkUploadInfo: ChunkUploadInfoDto,
  ) {
    return this.appService.uploadPart(chunkUploadInfo, file.buffer);
  }

  @Get('multipart/listParts')
  listParts(
    @Query('objectName') objectName: string,
    @Query('uploadId') uploadId: string,
  ) {
    return this.appService.listPart(objectName, uploadId);
  }

  /**
   *  获取文件列表
   */
  @Get('list')
  getList() {
    return this.appService.getList();
  }
}
