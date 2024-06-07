import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { PeerInfo } from '../model/peer';
/**
 * Define the structure of the chat state.
 */
export type ChatState = {
  peers: PeerInfo[]
}

/**
 * Initial state of the chat.
 */
const initialState: ChatState = {
  peers: []
}

@Injectable({
  providedIn: 'root'  // Marks this service as available throughout the application
})
export class PeersListService {
  constructor() { }

  /**
   * BehaviorSubject to hold the current state of the peers list.
   */
  private state$ = new BehaviorSubject<ChatState>(initialState);

  /**
   * Observable stream of the peers list.
   */
  value$ = this.state$.asObservable();

  /**
   * Method to add a new peer to the list.
   * @param peer The peer to add.
   */
  addPeer(peer: PeerInfo) {
    this.state$.next({
      peers: [...this.state$.value.peers, peer]  // Adds the new peer to the current list of peers
    });
  }

  /**
   * Method to set the entire list of peers.
   * @param peers The new list of peers.
   */
  setPeers(peers: PeerInfo[]) {
    this.state$.next({
      peers: peers  // Replaces the current list of peers with the provided list
    });
  }

  /**
   * Method to remove a peer from the list by ID.
   * @param peerId The ID of the peer to remove.
   */
  removePeer(peerId: number) {
    const updatedPeers = this.state$.value.peers.filter((peer) => {
      return peer.id !== peerId;  // Filters out the peer with the specified ID
    });

    this.state$.next({
      peers: updatedPeers  // Updates the list of peers after removing the specified peer
    });
  }
}
