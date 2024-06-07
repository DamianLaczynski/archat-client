import { Injectable, inject, signal } from '@angular/core';
import { UDPService } from './udp.service';
import { Message } from '../model/messages';
import { PeersService } from './peers.service';
import { DisconnectedState, Peer } from '../model/peer.state';
import { Router, RouterLink } from '@angular/router';

@Injectable({
  providedIn: 'root',  // Marks this service as available throughout the application
})
export class ChatService {
  private udpService = inject(UDPService);  // Injects UDPService to handle UDP communication
  private peersService = inject(PeersService);  // Injects PeersService to manage peer connections
  private router = inject(Router);  // Injects Router to navigate between routes
  myNickname: string = 'guest';  // Default nickname for the user
  otherPeer?: Peer;  // Optional property to store the other peer's information

  peers$ = this.peersService.peers$;  // Observable stream of peers from the PeersService

  private lastKeepalive = new Date().getTime();  // Timestamp of the last keepalive message
  keepInterval?: NodeJS.Timeout;  // Interval for sending keepalive messages
  private checkInterval: any;  // Interval for checking the connection status
  private readonly TIMEOUT = 10000;  // Timeout duration in milliseconds
  private readonly CHECK_INTERVAL = 2000;  // Interval duration in milliseconds for checking connection

  peer?: Peer;  // Optional property to store the current peer

  messageStack = signal<Message[]>([]);  // Signal to hold a stack of messages

  messages$ = this.messageStack.asReadonly();  // Read-only observable of the message stack

  constructor() {
    // Set up a listener for incoming messages from the UDP service
    this.udpService.onMessage((message) => {
      const newMessage = JSON.parse(message) as Message;  // Parse the incoming message
      if (newMessage.content != '') {
        if (this.peer?.state.state == 'CONNECTED') {
          console.log('New Message received:', message);
          this.peer.state.messages.push(newMessage);  // Add the new message to the peer's message list
        }
      } else {
        this.lastKeepalive = new Date().getTime();  // Update the last keepalive timestamp
      }
    });
  }

  /**
   * Starts a chat session with the specified peer.
   * @param nickname The nickname of the peer.
   * @param peerAddress The address of the peer.
   * @param myNickname The nickname of the current user.
   */
  public start(nickname: string, peerAddress: string, myNickname: string) {
    this.myNickname = myNickname;  // Set the current user's nickname

    const address = peerAddress.split(':');  // Split the peer address into IP and port

    this.udpService.configureClient();  // Configure the UDP client

    this.router.navigate(['chat', nickname]);  // Navigate to the chat route with the peer's nickname
    
    // Add the peer to the PeersService
    this.peersService.addPeer({
      id: nickname,
      state: {
        state: 'CONNECTED',
        address: address[0],
        port: Number(address[1]),
        messages: [],
      },
    });
  }

  /**
   * Starts the interval for checking connection status.
   * Currently unused. TOFIX
   */
  private startCheckInterval() {
    this.checkInterval = setInterval(() => {
      const currentTime = new Date().getTime();  // Get the current timestamp
      if (currentTime - this.lastKeepalive > this.TIMEOUT) {
        if (this.peer) {
          // Update the peer's state to disconnected if the timeout has elapsed
          this.peer.state = { state: "DISCONNECTED", error: undefined } as DisconnectedState;
        }
        
        this.router.navigate(['/chat']);  // Navigate back to the chat route
        console.log(currentTime);
        console.log(this.lastKeepalive);
        console.error("T/0");  // Log a timeout error
        this.stopSendingKeepalive();  // Stop sending keepalive messages
      }
    }, this.CHECK_INTERVAL);
  }

  /**
   * Stops the intervals for sending keepalive messages and checking connection status.
   * Currently unused. TOFIX
   */
  private stopSendingKeepalive() {
    clearInterval(this.keepInterval);  // Clear the keepalive interval
    clearInterval(this.checkInterval);  // Clear the check interval
  }

  /**
   * Sends a message to the specified peer.
   * @param message The message to send.
   * @param peer The peer to send the message to.
   */
  public send(message: string, peer: Peer) {
    if (peer.state.state == 'CONNECTED') {
      const newMessage: Message = { author: this.myNickname, content: message };  // Create a new message object
      this.udpService.sendMessage(
        JSON.stringify(newMessage),  // Convert the message to a JSON string
        peer.state.port,  // The port of the peer
        peer.state.address  // The address of the peer
      );
      if (message != '') {
        peer.state.messages.push(newMessage);  // Add the new message to the peer's message list
      }
    }
  }
}
