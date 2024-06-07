import { Injectable } from '@angular/core';
import { ElectronService } from 'ngx-electron';

@Injectable({
  providedIn: 'root',
})
export class UDPService {
  constructor(private electronService: ElectronService) { }

  /**
   * Sends a UDP message to the specified port and host.
   * @param message The message to be sent.
   * @param port The port number to send the message to.
   * @param host The host address to send the message to.
   */
  sendMessage(message: string, port: number, host: string) {
    if (this.electronService.isElectronApp) {
      this.electronService.ipcRenderer.send('send-udp-message', message, port, host);  // Sends the message via Electron's ipcRenderer
    }
  }

  /**
   * Configures the UDP client.
   */
  configureClient() {
    if (this.electronService.isElectronApp) {
      this.electronService.ipcRenderer.send('configure-udp-client');  // Configures the UDP client via Electron's ipcRenderer
    }
  }

  /**
   * Sets up a listener for incoming UDP messages.
   * @param callback The callback function to handle received messages.
   */
  onMessage(callback: (message: string) => void) {
    if (this.electronService.isElectronApp) {
      this.electronService.ipcRenderer.on('udp-message', (event, message) => {
        callback(message);  // Invokes the callback with the received message
      });
    }
  }
}
