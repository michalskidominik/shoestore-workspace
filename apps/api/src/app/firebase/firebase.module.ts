import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FirebaseAdminService } from './firebase-admin.service';
import { FirebaseConfigService } from './firebase.config';
import { FirestoreService } from './firestore.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    FirebaseConfigService,
    FirebaseAdminService,
    FirestoreService,
  ],
  exports: [
    FirebaseAdminService,
    FirebaseConfigService,
    FirestoreService,
  ],
})
export class FirebaseModule {}
