import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Peer } from '../model/peer.state';

@Injectable({
  providedIn: 'root'
})
export class PeersService {

  private peers = new BehaviorSubject<Peer[]>([]);  // BehaviorSubject to hold the list of peers

  peers$ = this.peers.asObservable();  // Observable stream of peers for other components to subscribe to

  constructor() { }

  /**
   * Adds a new peer to the list of peers.
   * @param peer The peer to add.
   */
  addPeer(peer: Peer) {
    this.peers.next([...this.peers.value, peer]);  // Add the new peer to the current list and emit the updated list
  }

  /**
   * Sets the entire list of peers.
   * @param peers The new list of peers.
   */
  setPeers(peers: Peer[]) {
    this.peers.next(peers);  // Set the new list of peers and emit the updated list
  }
}
