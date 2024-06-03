import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket!: WebSocket;
  private messageSubject: Subject<any>;

  constructor() {
    this.messageSubject = new Subject<any>();
  }

  public connect(url: string): void {

    this.socket = new WebSocket(url);

    this.socket.onopen = (event) => {
      console.log('WebSocket connection opened');
    };

    this.socket.onmessage = (messageEvent) => {
      console.log(messageEvent)
      this.messageSubject.next(messageEvent.data);
    };

    this.socket.onclose = () => {
      console.log('WebSocket connection closed');
    };

    this.socket.onerror = (errorEvent) => {
      console.error('WebSocket error:', errorEvent);
    };
  }

  public sendMessage(message: string): void {
    this.socket.send(message);
  }

  public closeConnection(): void {
    if (this.socket) {
      this.socket.close();
    }
  }

  public getMessages(): Observable<any> {
    return this.messageSubject.asObservable();
  }
}
