import { Injectable } from '@angular/core';
import { ElectronService } from 'ngx-electron';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UDPService {
  constructor(private electronService: ElectronService) { }

  sendMessage(message: string, port: number, host: string) {
    if (this.electronService.isElectronApp) {
      this.electronService.ipcRenderer.send('send-udp-message', message, port, host);
    }
  }

  configureClient() {
    if (this.electronService.isElectronApp) {
      this.electronService.ipcRenderer.send('configure-udp-client');
    }
  }

  onMessage(callback: (message: string) => void) {
    if (this.electronService.isElectronApp) {
      this.electronService.ipcRenderer.on('udp-message', (event, message) => {
        callback(message);
      });
    }
  }
}
