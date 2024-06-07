import { Injectable, inject } from '@angular/core';
import { WebSocketService } from './web-socket.service';
import { MessageID, SignalingMsg } from '../model/messages';
import { BehaviorSubject } from 'rxjs';
import { CHAT_STATE_VALUE, ChatState } from '../model/chat.state';
import { PeersListService } from './chat-state.service';
import { UDPService } from './udp.service';
import { ChatService } from './chat.service';

const WS_ENDPOINT = 'ws://81.210.88.10:8080/wsapi';  // WebSocket server endpoint
const SIGNALING_SERVER_ADDRESS = '81.210.88.10';  // Signaling server address
const SIGNALING_SERVER_PORT = 8081;  // Signaling server port

@Injectable({
  providedIn: 'root',
})
export class SignalingService {
  private webSocketService = inject(WebSocketService);  // Injects WebSocketService for WebSocket communication
  private peersListService = inject(PeersListService);  // Injects PeersListService to manage the list of peers
  private udpService = inject(UDPService);  // Injects UDPService for UDP communication
  private chatService = inject(ChatService);  // Injects ChatService to manage chat sessions

  clientNickname: string = 'guest';  // Default nickname for the client

  signalingState = new BehaviorSubject<ChatState>({ state: "IDLE" });  // BehaviorSubject to hold the signaling state
  peersList = this.peersListService.value$;  // Observable stream of peers from PeersListService

  getPeersInterval?: NodeJS.Timeout;  // Interval for fetching the list of peers

  constructor() {
    this.connectToWebSocket();  // Connect to the WebSocket server

    // Subscribe to messages from the WebSocket server
    this.webSocketService.getMessages().subscribe({
      next: (message) => {
        console.log('New message from server: ', message);
        this.messageMapper(message);  // Map the received message to an action
      },
    });

    // Subscribe to changes in the signaling state
    this.signalingState.asObservable().subscribe({
      next: (state) => {
        this.stateControl(state.state);  // Control the state based on the signaling state
      },
    });
  }

  /**
   * Connects to the WebSocket server.
   */
  public connectToWebSocket() {
    this.webSocketService.closeConnection();  // Close any existing WebSocket connection
    this.webSocketService.connect(WS_ENDPOINT);  // Connect to the WebSocket server
  }

  /**
   * Sends an authentication request to the server.
   * @param payload The authentication payload containing nickname and password.
   */
  public getAuth(payload: { nickname: string; password: string }) {
    const authRequest = {
      id: MessageID.AuthReqID,
      r: {
        nickname: payload.nickname,
        password: payload.password,
      },
    };
    this.clientNickname = payload.nickname;  // Set the client's nickname
    console.log("Sending auth request: ", authRequest);
    this.webSocketService.sendMessage(JSON.stringify(authRequest));  // Send the authentication request
  }

  /**
   * Sends a request to create a connection offer to a peer.
   * @param peerId The ID of the peer.
   */
  public createConnectionOffer(peerId: string) {
    const createOfferRequest = {
      id: MessageID.StartChatAReqID,
      r: {
        nickname: peerId,
      },
    };
    console.log("Sending connection offer request: ", createOfferRequest);
    this.webSocketService.sendMessage(JSON.stringify(createOfferRequest));  // Send the connection offer request
  }

  /**
   * Sends a request to accept a connection offer from a peer.
   * @param peerId The ID of the peer.
   */
  public acceptConnectionOffer(peerId: string) {
    const acceptOfferRequest = {
      id: MessageID.StartChatCReqID,
      r: {
        nickname: peerId,
      },
    };
    console.log("Sending accept connection offer request: ", acceptOfferRequest);
    this.webSocketService.sendMessage(JSON.stringify(acceptOfferRequest));  // Send the accept connection offer request
  }

  /**
   * Sends a punch code to the signaling server to get peer UDP info.
   * @param punchCode The punch code.
   */
  private getPeerUDPInfo(punchCode: string) {
    console.log(`Sending punchCode to ${SIGNALING_SERVER_ADDRESS}:${SIGNALING_SERVER_PORT} ` + punchCode);
    this.udpService.sendMessage(JSON.stringify({ punchCode: punchCode }), SIGNALING_SERVER_PORT, SIGNALING_SERVER_ADDRESS);  // Send the punch code via UDP
  }

  /**
   * Sends a request to get the list of peers.
   */
  private getPeers() {
    const getPeersRequest = {
      id: MessageID.ListPeersReqID,
      r: {},
    };
    console.log("Sending get list of peer request: ", getPeersRequest);
    this.webSocketService.sendMessage(JSON.stringify(getPeersRequest));  // Send the get peers request
  }

  /**
   * Controls the signaling state and performs actions based on the state.
   * @param state The current signaling state.
   */
  private stateControl(state: string) {
    switch (state) {
      case "IDLE": {
        // Perform actions when the state is IDLE
        break;
      }
      case "OPENED": {
        // Perform actions when the state is OPENED
        break;
      }
      case "AUTH": {
        // Periodically fetch the list of peers when authenticated
        setInterval(() => {
          this.getPeers();
        }, 1000);
        break;
      }
      case "ERROR": {
        // Clear the interval when there is an error
        clearInterval(this.getPeersInterval);
        break;
      }
      case "CLOSED": {
        // Clear the interval when the connection is closed
        clearInterval(this.getPeersInterval);
        break;
      }
    }
  }

  /**
   * Maps the received message to the appropriate action based on its ID.
   * @param data The received message data.
   */
  private messageMapper(data: any) {
    const payload = JSON.parse(data) as SignalingMsg;  // Parse the received message

    switch (payload.id) {
      case MessageID.AuthResID: {
        if (payload.r?.IsSuccess) {
          this.signalingState.next({ state: "AUTH", nickname: this.clientNickname });  // Update the signaling state to AUTH
        }
        break;
      }
      case MessageID.EchoReqID: {
        this.signalingState.next({ state: "OPENED" });  // Update the signaling state to OPENED
        break;
      }
      case MessageID.ListPeersResID: {
        if (payload.r?.peers) {
          // Update the list of peers in the PeersListService
          this.peersListService.setPeers(
            payload.r.peers.filter((peer) => peer.nickname != this.clientNickname && peer.hasNickname == true)
          );
        }
        break;
      }
      case MessageID.StartChatBReqID: {
        if (payload.r?.nickname) {
          this.acceptConnectionOffer(payload.r?.nickname);  // Accept the connection offer
        }
        break;
      }
      case MessageID.StartChatDReqID: {
        if (payload.r?.punchCode) {
          this.getPeerUDPInfo(payload.r.punchCode);  // Get peer UDP info
        }
        break;
      }
      case MessageID.StartChatFinishReqID: {
        if (payload.r?.otherSideAddress && payload.r.otherSideNickname) {
          // Start the chat session
          this.chatService.start(payload.r.otherSideNickname, payload.r.otherSideAddress, this.clientNickname);
        }
        break;
      }
    }
  }
}
