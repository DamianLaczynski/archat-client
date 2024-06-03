import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Peer } from '../model/peer.state';

@Injectable({
  providedIn: 'root'
})
export class PeersService {

  private peers = new BehaviorSubject<Peer[]>([]);

  peers$ = this.peers.asObservable();

  constructor() { }


  addPeer(peer: Peer)
  {
    this.peers.next([...this.peers.value, peer]);
  }

  setPeers(peers: Peer[])
  {
    this.peers.next(peers);
  }
}
