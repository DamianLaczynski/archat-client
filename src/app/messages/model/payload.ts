export interface SignalingMsg {
    id: MessageID,
    r?: {
        nickname?: string,
        password?: string,
        IsSuccess?: boolean,
        peers?: PeerInfo[],
        punchCode?: string,
        otherSideAddress?: string,
        otherSideNickname?: string
    } 
}

export enum MessageID {
    EchoReqID            = 1,
	EchoResID            = 128 + EchoReqID,
	ListPeersReqID       = 2,
	ListPeersResID       = 128 + ListPeersReqID,
	AuthReqID            = 3,
	AuthResID            = 128 + AuthReqID,
	StartChatAReqID      = 4,
	StartChatBReqID      = 5,
	StartChatCReqID      = 6,
	StartChatDReqID      = 7,
	StartChatFinishReqID = 8
}

export interface PeerInfo {
    id: number,
    addr: string,
    hasNickname: boolean,
    nickname?: string
}

export interface Peer {
    nickname?: string,
    address: string,
    port: number
}

export interface Message {
    author: string
    content: string
}