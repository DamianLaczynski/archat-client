import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { PeerInfo } from '../model/payload';

export type ChatState = {
  peers: PeerInfo[]
}

const initialState = {
  peers: []
}

@Injectable({
  providedIn: 'root'
})
export class PeersListService {

  constructor() { }

  private state$ = new BehaviorSubject<ChatState>(initialState);

  value$ = this.state$.asObservable();

  addPeer(peer: any)
  {
    this.state$.next({
      peers: [...this.state$.value.peers, peer]
    });
  }

  setPeers(peers: PeerInfo[])
  {
    this.state$.next({
      peers
    });
  }

  removePeer(peerId: number)
  {
    const updatedTasks = this.state$.value.peers.filter((peer) => {
      return peer.id !== peerId;
    });

    this.state$.next({
      peers: updatedTasks
    });
  }
}





@Injectable({
  providedIn: 'root'
})
export class TaskStateService {

  constructor() { }

  
}
