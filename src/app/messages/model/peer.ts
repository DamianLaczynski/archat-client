export interface PeerInfo {
    id: number,
    addr: string,
    hasNickname: boolean,
    nickname?: string
}

export interface Peer {
    id: string,
    address: string,
    port: number,
    connectionState?: PeerConnectionState,
}

export enum PeerConnectionState {
    PENDING,
    CONNECTED,
    DISCONNECTED
}
