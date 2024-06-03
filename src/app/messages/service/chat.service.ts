import { Injectable, inject, signal } from '@angular/core';
import { UDPService } from './udp.service';
import { Message } from '../model/payload';
import { PeersService } from './peers.service';
import { DisconnectedState, Peer } from '../model/peer.state';
import { Router, RouterLink } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private udpService = inject(UDPService);
  private peersService = inject(PeersService);
  private router = inject(Router);
  myNickname: string = 'guest';
  otherPeer?: Peer;

  peers$ = this.peersService.peers$;

  private lastKeepalive = new Date().getTime();
  keepInterval?: NodeJS.Timeout;
  private checkInterval: any;
  private readonly TIMEOUT = 10000; 
  private readonly CHECK_INTERVAL = 2000; 

  peer?: Peer;

  messageStack = signal<Message[]>([]);

  messages$ = this.messageStack.asReadonly();

  constructor() {

    this.udpService.onMessage((message) => {
      console.log('New Message recive:');
      console.log(message);
      const newMessage = JSON.parse(message) as Message;
      if(newMessage.content != '')
        {
          if (this.peer?.state.state == 'CONNECTED') {
            this.peer.state.messages.push(newMessage);
          }
        }
        else {
          this.lastKeepalive = new Date().getTime();
        }
      
    });
  }

  start(nickname: string, peerAddress: string, myNickname: string) {
    this.myNickname = myNickname;

    const address = peerAddress.split(':');

    this.udpService.configureClient();

    this.router.navigate(['chat', nickname]);

    this.keepInterval = setInterval(()=> {
      if(this.peer)
        {
          //keep message
          this.send('', this.peer);
        }
    }, 1000)

    
    
    this.peersService.addPeer({
      id: nickname,
      state: {
        state: 'CONNECTED',
        address: address[0],
        port: Number(address[1]),
        messages: [],
      },
    });

    
    this.startCheckInterval();
    
  }

  private startCheckInterval() {
    this.checkInterval = setInterval(() => {
      const currentTime = new Date().getTime();
      if (currentTime - this.lastKeepalive > this.TIMEOUT) {
        if(this.peer)
          {
            this.peer.state = { state: "DISCONNECTED", error: undefined} as DisconnectedState;
          }
        
        this.router.navigate(['/chat']);
        console.log(currentTime)
        console.log(this.lastKeepalive)
        console.error("T/0")
        this.stopSendingKeepalive();
        
      }
    }, this.CHECK_INTERVAL);
  }

  stopSendingKeepalive() {
    clearInterval(this.keepInterval);
    clearInterval(this.checkInterval);
  }

  send(message: string, peer: Peer) {
    if (peer.state.state == 'CONNECTED') {
      const newMessage: Message = { author: this.myNickname, content: message };
      this.udpService.sendMessage(
        JSON.stringify(newMessage),
        peer.state.port,
        peer.state.address
      );
      if(message != '')
        {
          peer.state.messages.push(newMessage);
        }
    }
  }
}
