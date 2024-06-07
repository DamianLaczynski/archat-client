import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'  // Marks this service as available throughout the application
})
export class WebSocketService {
  private socket!: WebSocket;  // WebSocket instance
  private messageSubject: Subject<any>;  // Subject to handle incoming messages

  constructor() {
    this.messageSubject = new Subject<any>();  // Initializes the Subject
  }

  /**
   * Connects to the WebSocket server at the given URL.
   * @param url The URL of the WebSocket server.
   */
  public connect(url: string): void {
    this.socket = new WebSocket(url);  // Creates a new WebSocket instance

    // Event listener for when the WebSocket connection is opened
    this.socket.onopen = (event) => {
      console.log('WebSocket connection opened');
    };

    // Event listener for when a message is received from the server
    this.socket.onmessage = (messageEvent) => {
      this.messageSubject.next(messageEvent.data);  // Emits the received message to the Subject
    };

    // Event listener for when the WebSocket connection is closed
    this.socket.onclose = () => {
      console.log('WebSocket connection closed');
    };

    // Event listener for when an error occurs with the WebSocket
    this.socket.onerror = (errorEvent) => {
      console.error('WebSocket error:', errorEvent);
    };
  }

  /**
   * Sends a message through the WebSocket connection.
   * @param message The message to be sent.
   */
  public sendMessage(message: string): void {
    this.socket.send(message);  // Sends the message via WebSocket
  }

  /**
   * Closes the WebSocket connection.
   */
  public closeConnection(): void {
    if (this.socket) {
      this.socket.close();  // Closes the WebSocket connection
    }
  }

  /**
   * Returns an observable for receiving messages from the WebSocket.
   * @returns An observable of incoming messages.
   */
  public getMessages(): Observable<any> {
    return this.messageSubject.asObservable();  // Converts the Subject to an Observable
  }
}
