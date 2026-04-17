import { ApplicationConfig } from '@angular/core';
import { provideRouter, withInMemoryScrolling} from '@angular/router'; 
import { routes } from './app.routes'; 
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDPtVUyifeeheWlm_ox4MPDYp9K7rzWgjM",
  authDomain: "cuidadoconectado-33467.firebaseapp.com",
  projectId: "cuidadoconectado-33467",
  storageBucket: "cuidadoconectado-33467.firebasestorage.app",
  messagingSenderId: "123268161889",
  appId: "1:123268161889:web:b5aa07a1a2be6d8a1b6520"
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withInMemoryScrolling({
        scrollPositionRestoration: 'enabled',
        anchorScrolling: 'enabled',
      })
    ),
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideFirestore(() => getFirestore())
  ]
};
