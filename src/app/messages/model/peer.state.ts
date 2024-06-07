import { Message } from "./messages";

export type IdleState = { state: PEER_STATE_VALUE['IDLE'] };

type ConnectedState = { state: PEER_STATE_VALUE['CONNECTED'], address: string, port: number, messages: Message[]};

type PendingState = { state: PEER_STATE_VALUE['PENDING']};

export type DisconnectedState = { state: PEER_STATE_VALUE['DISCONNECTED'], error?: Event };



type PEER_STATE_VALUE = typeof PEER_STATE_VALUE;

export const PEER_STATE_VALUE = {
  IDLE: 'IDLE',
  CONNECTED: 'CONNECTED',
  PENDING: 'PENDING',
  DISCONNECTED: 'DISCONNECTED',
} as const;

export type PeerStateValue = keyof typeof PEER_STATE_VALUE;

export type PeerState =
  | IdleState
  | ConnectedState
  | DisconnectedState
  | PendingState;


  export interface Peer {
    id: string,
    state: PeerState
  }