import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class UploadFile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 256, comment: '文件上传id' })
  uploadId: string;

  @Column({ length: 256, comment: '文件计算md5' })
  md5: string;

  @Column({ length: 500, comment: '文件访问地址' })
  url: string;

  @Column({ length: 64, comment: '存储桶' })
  bucket: string;

  @Column({ length: 256, comment: 'minio中文件名' })
  objectName: string;

  @Column({ length: 256, comment: '原始文件名' })
  originFileName: string;

  @Column({ type: 'int', comment: '文件大小' })
  size: number;

  @Column({ length: 64, comment: '文件类型' })
  type: string;

  @Column({ type: 'int', comment: '分片大小' })
  chunkSize: number;

  @Column({ type: 'int', comment: '分片数量' })
  chunkCount: number;

  @Column({ comment: '是否删除', default: false })
  isDelete: boolean;
}
