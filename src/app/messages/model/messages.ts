import { PeerInfo } from "./peer"

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

export interface Message {
    author: string
    content: string
}

export type Connected = {state: "CONNECTED", address: string, port: number, messages: Message[]}


