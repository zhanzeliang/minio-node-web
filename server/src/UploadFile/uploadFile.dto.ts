import { UploadFile } from 'src/dbEntities/uploadFile.entity';

export type CreateUploadFileDto = Omit<UploadFile, 'id' | 'isDelete'>;
