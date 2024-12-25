import { Inject, Injectable } from '@nestjs/common';
import type { RedisClientType } from 'redis';

import type {
  UploadUrlsVO,
  FileUploadInfo,
  ETag,
  Binary,
  ChunkUploadInfoDto,
} from './UploadTypes';
import * as path from 'path';
import * as moment from 'moment';
import { MinioUtils } from './MinioUtils';
import { UploadFileService } from './UploadFile/uploadFile.service';

const REDIS_UPLOAD_FILE_INFO_FIELD = 'uploadFileInfo';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  constructor(
    private minioUtils: MinioUtils,
    private uploadFileService: UploadFileService,
    @Inject('REDIS_CLIENT')
    private readonly redisClient: RedisClientType,
  ) {}

  async checkFileByMd5(md5: string) {
    console.log(`查询md5: ${md5} 是否存在`);
    const result: string = await this.redisClient.hGet(
      md5,
      REDIS_UPLOAD_FILE_INFO_FIELD,
    );
    const fileUploadInfo: FileUploadInfo = result ? JSON.parse(result) : null;
    // redis存在的话，说明文件处于上传中, 获取文件的片段
    if (fileUploadInfo) {
      const uploadParts = await this.minioUtils.getListParts(
        fileUploadInfo.objectName,
        fileUploadInfo.uploadId,
      );
      fileUploadInfo.listParts = uploadParts.map((item) => item.part);
      return { ...fileUploadInfo, status: 'uploading' };
    }
    console.log(`redis中不存在md5: <${md5}> 查询mysql是否存在`);

    const file = await this.uploadFileService.findOneByMd5(md5);
    if (file) {
      console.log(
        `mysql中存在md5: <${md5}> 的文件 该文件已上传至minio 秒传直接过`,
      );
      // mysql新增一条记录
      const newFileUploadInfo = await this.uploadFileService.create(file);
      return { ...newFileUploadInfo, status: 'success' };
    }
    return { status: 'noUPload' };
  }

  // 先实现上传, redis 待处理
  async initMultiPartUpload(
    fileUploadInfo: FileUploadInfo,
  ): Promise<UploadUrlsVO> {
    const result: string = await this.redisClient.hGet(
      fileUploadInfo.md5,
      REDIS_UPLOAD_FILE_INFO_FIELD,
    );
    const redisFileUploadInfo: FileUploadInfo = result
      ? JSON.parse(result)
      : null;

    let objectName: string;
    // 若 redis 中有该 md5 的记录，以 redis 中为主
    if (redisFileUploadInfo) {
      fileUploadInfo = redisFileUploadInfo;
      objectName = fileUploadInfo.objectName;
    } else {
      const originFileName = fileUploadInfo.originFileName;
      const suffix = path.extname(originFileName).replace('.', '');
      const fileName = path.basename(originFileName, suffix);

      const nestFile = moment().format('YYYYMMDDHHmmss');

      objectName =
        nestFile + '/' + fileName + '_' + fileUploadInfo.md5 + '.' + suffix;

      fileUploadInfo.objectName = objectName;
      fileUploadInfo.type = suffix;
      fileUploadInfo.bucket = this.minioUtils.getMultiPartBucketName();
    }

    let uploadUrlsVO: UploadUrlsVO = {
      uploadId: '',
      urls: [],
    };

    uploadUrlsVO = await this.minioUtils.initMultiPartUpload(
      fileUploadInfo,
      objectName,
    );
    fileUploadInfo.uploadId = uploadUrlsVO.uploadId;

    // 存入 redis （单片存 redis 唯一用处就是可以让单片也入库，因为单片只有一个请求，基本不会出现问题）
    this.redisClient.hSet(
      fileUploadInfo.md5,
      REDIS_UPLOAD_FILE_INFO_FIELD,
      JSON.stringify(fileUploadInfo),
    );
    return uploadUrlsVO;
  }

  async uploadPart(
    chunkUploadInfo: ChunkUploadInfoDto,
    file: Binary,
  ): Promise<ETag> {
    const result: string = await this.redisClient.hGet(
      chunkUploadInfo.fileMd5,
      REDIS_UPLOAD_FILE_INFO_FIELD,
    );
    const fileUploadInfo: FileUploadInfo = JSON.parse(result);
    const eTag = await this.minioUtils.uploadPart(
      {
        uploadId: fileUploadInfo.uploadId,
        partNumber: chunkUploadInfo.partNumber,
        md5: fileUploadInfo.md5,
        objectName: fileUploadInfo.objectName,
        contentType: chunkUploadInfo.contentType,
      },
      file,
    );
    await this.redisClient.hSet(
      chunkUploadInfo.fileMd5,
      'part' + chunkUploadInfo.partNumber,
      JSON.stringify(eTag),
    );
    return eTag;
  }

  async mergeMultiPartUpload(md5: string) {
    const result = await this.redisClient.hGetAll(md5);
    const fileUploadInfo: FileUploadInfo = result
      ? JSON.parse(result[REDIS_UPLOAD_FILE_INFO_FIELD])
      : null;
    const eTags: ETag[] = [];
    for (const props in result) {
      if (/^part\d+$/.test(props)) {
        eTags.push(JSON.parse(result[props]));
      }
    }
    if (fileUploadInfo) {
      fileUploadInfo.url = this.minioUtils.getUrl(fileUploadInfo.objectName);
    }

    eTags.sort((a, b) => a.part - b.part);
    const mergeResult = await this.minioUtils.mergeMultiPartUpload(
      fileUploadInfo.objectName,
      fileUploadInfo.uploadId,
      eTags,
    );
    if (mergeResult) {
      await this.uploadFileService.create(fileUploadInfo);
      await this.redisClient.del(md5);
      return { url: fileUploadInfo.url };
    }
  }

  getList() {
    return this.uploadFileService.getList();
  }
}
