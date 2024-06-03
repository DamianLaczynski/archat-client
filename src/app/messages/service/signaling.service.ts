import { Injectable, inject } from '@angular/core';
import { WebSocketService } from './web-socket.service';
import { MessageID, SignalingMsg } from '../model/payload';
import { BehaviorSubject } from 'rxjs';
import { CHAT_STATE_VALUE, ChatState } from '../model/chat.state';
import { NotExpr } from '@angular/compiler';
import { PeersListService } from './chat-state.service';
import { UDPService } from './udp.service';
import { ChatService } from './chat.service';

const WS_ENDPOINT = 'ws://81.210.88.10:8080/wsapi';
const SIGNALING_SERVER_ADDRESS = '81.210.88.10';
const SIGNALING_SERVER_PORT = 8081;

@Injectable({
  providedIn: 'root',
})
export class SignalingService {
  private webSocketService = inject(WebSocketService);
  private peersListService = inject(PeersListService);
  private udpService = inject(UDPService);
  private chatService = inject(ChatService);


  clientNickname: string = 'guest';

  signalingState = new BehaviorSubject<ChatState>({state: "IDLE"});
  peersList = this.peersListService.value$;

  constructor() {
    this.connectToWebSocket();

    this.webSocketService.getMessages().subscribe({
      next: (message) => {
        console.log('New message from server: ' + message);
        console.log(JSON.parse(message));
        this.messageMapper(message);
      },
    });

    this.signalingState.asObservable().subscribe({next: (state) => {
      switch(state.state)
      {
        case("IDLE"):
        {
          break;
        }
        case("OPENED"):
        {
          break;
        }
        case("AUTH"):
        {
          setInterval(() => {
            this.getPeers();
          }, 1000)
          break;
        }
        case("ERROR"):
        {
          break;
        }
        case("CLOSED"):
        {
          break;
        }
      }
    }});

  }

  connectToWebSocket()
  {
    this.webSocketService.closeConnection();
    this.webSocketService.connect(WS_ENDPOINT);
  }

  private messageMapper(data: any) {
    const payload = JSON.parse(data) as SignalingMsg;

    switch (payload.id) {
      case MessageID.AuthResID: {
        if (payload.r?.IsSuccess) {
          this.signalingState.next({state: "AUTH", nickname: this.clientNickname});
        }
        break;
      }
      case MessageID.EchoReqID: {
        this.signalingState.next({state: "OPENED"});
        break;
      }
      case MessageID.ListPeersResID: {
        if (payload.r?.peers) {
          this.peersListService.setPeers(payload.r.peers.filter((peer) => peer.nickname != this.clientNickname && peer.hasNickname == true))
        }
        break;
      }
      case MessageID.StartChatBReqID: {
        if (payload.r?.nickname) {
          this.acceptConnectionOffer(payload.r?.nickname);
        }
        break;
      }
      case MessageID.StartChatDReqID: {
        if (payload.r?.punchCode) {
          this.getPeerUDPInfo(payload.r.punchCode);
        }
        break;
      }
      case MessageID.StartChatFinishReqID: {
        if (payload.r?.otherSideAddress && payload.r.otherSideNickname) {
            this.chatService.start(payload.r.otherSideNickname,payload.r.otherSideAddress,this.clientNickname);
          //const address = payload.r.otherSideAddress.split(':');
          //this.udpService.configureClient(41234, "localhost");
          //this.peer = {nickname: payload.r.otherSideNickname, address: address[0], port: Number(address[1]) };
          //.udpService.sendMessage(`hello there from ${this.clientNickname}`, Number(address[1]), address[0]);
        }

        //this.udpService.onMessage((message) => console.log(message));
        //this.udpService.sendMessage("hello chuj", 62880, "127.0.0.1");
      }
    }
  }

  public getAuth(payload: { nickname: string; password: string }) {
    const authRequest = {
      id: MessageID.AuthReqID,
      r: {
        nickname: payload.nickname,
        password: payload.password,
      },
    };
    this.clientNickname = payload.nickname;
    console.log('Auth request:');
    console.log(JSON.stringify(authRequest));
    this.webSocketService.sendMessage(JSON.stringify(authRequest));
  }

  public createConnectionOffer(peerId: string) {
    const createOfferRequest = {
      id: MessageID.StartChatAReqID,
      r: {
        nickname: peerId,
      },
    };
    this.webSocketService.sendMessage(JSON.stringify(createOfferRequest));
  }

  public acceptConnectionOffer(peerId: string) {
    const acceptOfferRequest = {
      id: MessageID.StartChatCReqID,
      r: {
        nickname: peerId,
      },
    };
    this.webSocketService.sendMessage(JSON.stringify(acceptOfferRequest));
  }

  private getPeerUDPInfo(punchCode: string)
  {
    console.log(`Sending punchCode to ${SIGNALING_SERVER_ADDRESS}:${SIGNALING_SERVER_PORT} ` + punchCode)
    this.udpService.sendMessage(JSON.stringify({punchCode: punchCode}), SIGNALING_SERVER_PORT, SIGNALING_SERVER_ADDRESS);
  }

  getPeers() {
    const getPeersRequest = {
      id: MessageID.ListPeersReqID,
      r: {},
    };
    this.webSocketService.sendMessage(JSON.stringify(getPeersRequest));
  }
}
