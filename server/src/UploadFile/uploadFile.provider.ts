import { DataSource } from 'typeorm';
import { UploadFile } from '../dbEntities/uploadFile.entity';

export const uploadFileProviders = [
  {
    provide: 'UPLOAD_FILE_REPOSITORY',
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(UploadFile),
    inject: ['DATA_SOURCE'],
  },
];
