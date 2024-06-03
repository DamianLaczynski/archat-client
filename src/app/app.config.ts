import { ApplicationConfig } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { routes } from './app.routes';
import { ElectronService } from 'ngx-electron';

export const appConfig: ApplicationConfig = {
  providers: [ElectronService, provideRouter(routes, withComponentInputBinding()) ]
};
