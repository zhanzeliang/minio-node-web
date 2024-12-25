import { DataSource } from 'typeorm';
import * as path from 'path';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

export const databaseProviders = [
  {
    provide: 'DATA_SOURCE',
    useFactory: async () => {
      const dataSource = new DataSource({
        type: 'mysql',
        host: 'localhost',
        port: 3307,
        username: 'root',
        password: 'raymon',
        database: 'miniotest',
        namingStrategy: new SnakeNamingStrategy(),
        entities: [
          path.join(__dirname, '/../dbEntities') + '/*.entity{.ts,.js}',
        ],
        synchronize: true,
      });

      return dataSource.initialize();
    },
  },
];
