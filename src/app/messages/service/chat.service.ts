import { Injectable, inject, signal } from '@angular/core';
import { UDPService } from './udp.service';
import { Message, Peer } from '../model/payload';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private udpService = inject(UDPService);
  myNickname: string = 'guest';
  otherPeer?: Peer;

  messageStack = signal<Message[]>([]);

  messages$ = this.messageStack.asReadonly();

  constructor() {}

  start(nickname: string, peerAddress: string, myNickname: string) {
    this.myNickname = myNickname;

    const address = peerAddress.split(':');

    this.udpService.configureClient();

    this.otherPeer = {
      nickname: nickname,
      address: address[0],
      port: Number(address[1]),
    };
    this.send(`hello from ${myNickname}`);

    //this.udpService.onMessage((message) => this.messageStack.next([...this.messageStack.value, message]));
    this.udpService.onMessage((message) => {
      console.log(message);
      this.messageStack.update((val) => {
        return [...val, JSON.parse(message)];
      });
    });
  }

  send(message: string) {
    if (this.otherPeer) {
      const newMessage: Message = { author: this.myNickname, content: message };
      this.udpService.sendMessage(
        JSON.stringify(newMessage),
        this.otherPeer?.port,
        this.otherPeer?.address
      );
      console.log(newMessage);
      this.messageStack.update((val) => {
        return [...val, newMessage];
      });
    }
  }
}
