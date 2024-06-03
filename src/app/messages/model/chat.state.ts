export type IdleState = { state: 'IDLE' };

type OpenedState = { state: CHAT_STATE_VALUE['OPENED']};

type AuthState = { state: CHAT_STATE_VALUE['AUTH'], nickname: string};

export type ErrorState = { state: CHAT_STATE_VALUE['ERROR'], error: Event };

export type ClosedState = { state: CHAT_STATE_VALUE['CLOSED'] };


type CHAT_STATE_VALUE = typeof CHAT_STATE_VALUE;

export const CHAT_STATE_VALUE = {
  IDLE: 'IDLE',
  OPENED: 'OPENED',
  AUTH: 'AUTH',
  SUCCESS_GET_LIST_OF_PEERS: 'SUCCESS_GET_LIST_OF_PEERS',
  ERROR: 'ERROR',
  CLOSED: "CLOSED"
} as const;

export type ChatStateValue = keyof typeof CHAT_STATE_VALUE;

export type ChatState =
  | IdleState
  | OpenedState
  | AuthState
  | ErrorState
  | ClosedState;
