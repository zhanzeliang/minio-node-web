export interface FileUploadInfo {
  bucket: string;
  md5: string;

  uploadId: string;

  originFileName: string;

  // 仅秒传会有值
  url: string;
  // 后端使用
  objectName: string;
  type: string;

  size: number;

  chunkCount: number;

  chunkSize: number;

  contentType: string;

  // listParts 从 1 开始，前端需要上传的分片索引+1
  listParts: number[];
}

export interface ChunkUploadInfo {
  uploadId: string;
  partNumber: number;
  md5: string;
  objectName: string;
  contentType: string;
}

export type ChunkUploadInfoDto = {
  partNumber: number;
  fileMd5: string;
  contentType: string;
};

export interface UploadUrlsVO {
  uploadId: string;
  urls: string[];
}

export interface ETag {
  etag: string;
  key: string;
  part: number;
}

export type Binary = Buffer | string;
