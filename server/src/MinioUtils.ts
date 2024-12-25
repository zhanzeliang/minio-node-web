import { Injectable } from '@nestjs/common';
import * as Minio from 'minio';
import type {
  ChunkUploadInfo,
  ETag,
  FileUploadInfo,
  UploadUrlsVO,
  Binary,
} from './UploadTypes';
import type { UploadedPart } from 'minio/dist/main/internal/xml-parser';
import { ConfigService } from '@nestjs/config';

const multiPartBucket = 'public-readonly-file'; // 分片上传的 bucket
const ONE_DAY = 24 * 60 * 60; // 单位是秒
const END_POINT = 'localhost';
const PORT = 9000;

class CustomMinioClient extends Minio.Client {
  constructor(options: Minio.ClientOptions) {
    super(options);
  }
  listParts(
    bucketName: string,
    objectName: string,
    uploadId: string,
  ): Promise<UploadedPart[]> {
    return super.listParts(bucketName, objectName, uploadId);
  }
}

@Injectable()
export class MinioUtils {
  minioClient: CustomMinioClient;
  constructor(private configService: ConfigService) {
    this.minioClient = new CustomMinioClient({
      endPoint: this.configService.get('minio.endPoint'),
      useSSL: this.configService.get('minio.useSSL'),
      port: this.configService.get('minio.port'),
      accessKey: this.configService.get('minio.accessKey'),
      secretKey: this.configService.get('minio.secretKey'),
    });

    this.createBucket();
  }
  async initMultiPartUpload(
    fileUploadInfo: FileUploadInfo,
    objectName: string,
  ) {
    const chunkCount = fileUploadInfo.chunkCount;
    const contentType = fileUploadInfo.contentType;
    let uploadId = fileUploadInfo.uploadId;
    const urlsVo: UploadUrlsVO = { uploadId, urls: [] };
    console.info(
      `文件:${objectName}, 初始化分片上传数据（共${chunkCount}）个, 请求头信息:${contentType}`,
    );

    // 如果初始化时有 uploadId，说明是断点续传，不能重新生成 uploadId
    if (!uploadId) {
      const headers = contentType ? { 'Content-Type': contentType } : undefined;

      try {
        uploadId = await this.minioClient.initiateNewMultipartUpload(
          multiPartBucket,
          objectName,
          headers,
        );
      } catch (error) {
        console.error(`初始化分块上传失败`, error);
      }
    }

    urlsVo.uploadId = uploadId;
    const extraParams = { uploadId };
    try {
      for (let i = 0; i < chunkCount; i++) {
        const uploadUrl = await this.minioClient.presignedGetObject(
          multiPartBucket,
          objectName,
          ONE_DAY,
          extraParams,
        );
        urlsVo.urls.push(uploadUrl);
      }
    } catch (error) {
      console.error(`获取分块上传地址失败`, error);
    }

    return urlsVo;
  }

  uploadPart(chunkUploadInfo: ChunkUploadInfo, file: Binary): Promise<ETag> {
    return this.minioClient.uploadPart(
      {
        bucketName: multiPartBucket,
        objectName: chunkUploadInfo.objectName,
        uploadID: chunkUploadInfo.uploadId,
        partNumber: Math.floor(chunkUploadInfo.partNumber) + 1,
        headers: {
          'Content-Type':
            chunkUploadInfo.contentType || 'application/octet-stream',
        },
      },
      file,
    );
  }

  mergeMultiPartUpload(
    objectName: string,
    uploadId: string,
    tags: ETag[], // 暂时由前端传过来
  ): Promise<{
    etag: string;
    versionId: string | null;
  }> {
    console.info(
      `通过 ${objectName}-${uploadId}-${multiPartBucket}> 合并<分片上传>数据`,
    );
    // 获取所有分片
    return this.minioClient.completeMultipartUpload(
      multiPartBucket,
      objectName,
      uploadId,
      tags,
    );
  }

  getListParts(objectName: string, uploadId: string): Promise<UploadedPart[]> {
    return this.minioClient.listParts(multiPartBucket, objectName, uploadId);
  }

  getUrl(objectName: string) {
    return `${END_POINT}:${PORT}/${multiPartBucket}/${objectName}`;
  }

  private async createBucket() {
    if (!(await this.minioClient.bucketExists(multiPartBucket))) {
      await this.minioClient.makeBucket(multiPartBucket);
    }
  }

  getMultiPartBucketName(): string {
    return multiPartBucket;
  }
}
