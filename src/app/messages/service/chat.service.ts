import { Injectable, inject, signal } from '@angular/core';
import { UDPService } from './udp.service';
import { Message } from '../model/payload';
import { PeersService } from './peers.service';
import { Peer } from '../model/peer.state';
import { Router, RouterLink } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private udpService = inject(UDPService);
  private peersService = inject(PeersService);
  private routerLink = inject(Router);
  myNickname: string = 'guest';
  otherPeer?: Peer;

  peers$ = this.peersService.peers$;

  peer?: Peer;

  messageStack = signal<Message[]>([]);

  messages$ = this.messageStack.asReadonly();

  constructor() {}

  start(nickname: string, peerAddress: string, myNickname: string) {
    this.myNickname = myNickname;

    const address = peerAddress.split(':');

    this.udpService.configureClient();

    this.routerLink.navigate(['chat', nickname]);

    this.peersService.addPeer({
      id: nickname,
      state: {
        state: 'CONNECTED',
        address: address[0],
        port: Number(address[1]),
        messages: [],
      },
    });

    this.udpService.onMessage((message) => {
      console.log('New Message recive:');
      console.log(message);
      this.peers$.subscribe();
      if (this.peer?.state.state == 'CONNECTED') {
        this.peer.state.messages.push(JSON.parse(message) as Message);
      }
    });
  }

  send(message: string, peer: Peer) {
    if (peer.state.state == 'CONNECTED') {
      const newMessage: Message = { author: this.myNickname, content: message };
      this.udpService.sendMessage(
        JSON.stringify(newMessage),
        peer.state.port,
        peer.state.address
      );
      peer.state.messages.push(newMessage);
    }
  }
}
