## App.js

#### Importowanie wymaganych modułów
```javascript
const { app, BrowserWindow, ipcMain } = require('electron');
const url = require("url");
const path = require("path");
const dgram = require('dgram');
```
- `electron`: Moduł do tworzenia aplikacji desktopowych za pomocą Node.js.
- `url`, `path`: Moduły do zarządzania URL-ami i ścieżkami plików.
- `dgram`: Moduł do komunikacji UDP.

#### Deklaracja zmiennych
```javascript
let mainWindow;
let udpClient;
let clientPort = 0;
let clientHost = '127.0.0.1';
```
- `mainWindow`: Zmienna przechowująca główne okno aplikacji.
- `udpClient`: Zmienna przechowująca instancję klienta UDP.
- `clientPort`, `clientHost`: Domyślne port i host dla klienta UDP.

#### Tworzenie głównego okna aplikacji
```javascript
function createWindow() {
  mainWindow = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, `dist/archat-client/browser/index.html`),
      protocol: "file:",
      slashes: true
    })
  );

  mainWindow.webContents.openDevTools();

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}
```
- Tworzy główne okno aplikacji z włączoną integracją Node.js.
- Ładuje plik HTML z lokalnego systemu plików.
- Otwiera narzędzia deweloperskie dla debugowania.
- Obsługuje zdarzenie zamknięcia okna.

#### Nasłuchiwanie zdarzeń aplikacji
```javascript
app.on('ready', createWindow);

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
  if (mainWindow === null) createWindow();
});
```
- `ready`: Tworzy główne okno aplikacji, gdy aplikacja jest gotowa.
- `window-all-closed`: Zamyka aplikację, gdy wszystkie okna są zamknięte (z wyjątkiem macOS).
- `activate`: Reaktywuje aplikację, gdy jest otwarta (tylko na macOS).

#### Funkcja inicjalizująca klienta UDP
```javascript
function initializeUdpClient() {
  if (udpClient) {
    udpClient.close();
  }
  udpClient = dgram.createSocket('udp4');
  udpClient.bind(clientPort, () => {
    console.log(`Client bound to ${udpClient.address().port}:${clientPort}`);
  });

  udpClient.on('message', (msg, rinfo) => {
    console.log(`Server got: ${msg} from ${rinfo.address}:${rinfo.port}`);
    mainWindow.webContents.send('udp-message', msg.toString());
  });
}
```
- Tworzy i inicjalizuje nowego klienta UDP.
- Wiąże klienta UDP do losowego portu.
- Nasłuchuje wiadomości UDP i wysyła je do procesu renderującego.

#### IPC (Inter-Process Communication) dla konfiguracji klienta UDP
```javascript
ipcMain.on('configure-udp-client', (event) => {
  clientPort = udpClient.address().port;
  initializeUdpClient();
});
```
- Konfiguruje klienta UDP ponownie, używając wcześniej wygenerowanego portu.

#### IPC do wysyłania wiadomości UDP
```javascript
ipcMain.on('send-udp-message', (event, message, port, host) => {
  udpClient.send(message, port, host, (err) => {
    if (err) {
      console.error('UDP message send error:', err);
    } else {
      console.log('UDP message sent:', message);
    }
  });
});
```
- Wysyła wiadomość UDP do określonego portu i hosta.

#### Inicjalizacja klienta UDP przy starcie aplikacji
```javascript
initializeUdpClient();
```
- Inicjalizuje klienta UDP, gdy aplikacja się uruchamia.

### WebSocket.service.ts

```typescript
private socket!: WebSocket;
private messageSubject: Subject<any>;
```
- `socket`: Instancja WebSocket.
- `messageSubject`: Obiekt `Subject` do obsługi przychodzących wiadomości.

#### Konstruktor
```typescript
constructor() {
  this.messageSubject = new Subject<any>();
}
```
- Inicjalizuje `messageSubject`.

#### Łączenie z serwerem WebSocket
```typescript
public connect(url: string): void {
  this.socket = new WebSocket(url);

  this.socket.onopen = (event) => {
    console.log('WebSocket connection opened');
  };

  this.socket.onmessage = (messageEvent) => {
    this.messageSubject.next(messageEvent.data);
  };

  this.socket.onclose = () => {
    console.log('WebSocket connection closed');
  };

  this.socket.onerror = (errorEvent) => {
    console.error('WebSocket error:', errorEvent);
  };
}
```
- `connect(url: string)`: Łączy się z serwerem WebSocket pod podanym adresem URL.
  - `onopen`: Obsługuje zdarzenie otwarcia połączenia.
  - `onmessage`: Obsługuje przychodzące wiadomości, emitując je przez `messageSubject`.
  - `onclose`: Obsługuje zdarzenie zamknięcia połączenia.
  - `onerror`: Obsługuje zdarzenia błędów.

#### Wysyłanie wiadomości
```typescript
public sendMessage(message: string): void {
  this.socket.send(message);
}
```
- `sendMessage(message: string)`: Wysyła wiadomość przez połączenie WebSocket.

#### Zamykania połączenia
```typescript
public closeConnection(): void {
  if (this.socket) {
    this.socket.close();
  }
}
```
- `closeConnection()`: Zamyka połączenie WebSocket, jeśli istnieje.

#### Pobierania wiadomości
```typescript
public getMessages(): Observable<any> {
  return this.messageSubject.asObservable();
}
```
- `getMessages()`: Zwraca obiekt `Observable` umożliwiający subskrybowanie wiadomości przychodzących.

### UDP.service.ts

#### Importowanie modułów
```typescript
import { Injectable } from '@angular/core';
import { ElectronService } from './electron.service'

export class UDPService {
  constructor(private electronService: ElectronService) { }
```
- `ElectronService`: Usługa do interakcji z API Electron.

#### Konstruktor
```typescript
  constructor(private electronService: ElectronService) { }
```
- Inicjalizuje usługę z wstrzykniętą zależnością `ElectronService`.

#### Funkcja wysyłania wiadomości UDP
```typescript
  /**
   * Wysyła wiadomość UDP na określony port i host.
   * @param message Wiadomość do wysłania.
   * @param port Numer portu, na który ma być wysłana wiadomość.
   * @param host Adres hosta, na który ma być wysłana wiadomość.
   */
  sendMessage(message: string, port: number, host: string) {
    if (this.electronService.isElectronApp) {
      this.electronService.ipcRenderer.send('send-udp-message', message, port, host);
    }
  }
```
- `sendMessage(message: string, port: number, host: string)`: Wysyła wiadomość UDP na określony port i host za pomocą `ipcRenderer` w Electron.

#### Konfigurowanie klienta UDP
```typescript
  /**
   * Konfiguruje klienta UDP.
   */
  configureClient() {
    if (this.electronService.isElectronApp) {
      this.electronService.ipcRenderer.send('configure-udp-client');
    }
  }
```
- `configureClient()`: Konfiguruje klienta UDP za pomocą `ipcRenderer` w Electron.

#### Nasłuchiwanie wiadomości UDP
```typescript
  onMessage(callback: (message: string) => void) {
    if (this.electronService.isElectronApp) {
      this.electronService.ipcRenderer.on('udp-message', (event, message) => {
        callback(message);
      });
    }
  }
}
```
- `onMessage(callback: (message: string) => void)`: Ustawia nasłuchiwanie na przychodzące wiadomości UDP i wywołuje przekazaną funkcję zwrotną przy odbiorze wiadomości.

### Signaling.service.ts
Obsługuje komunikację z serverem ARchat server. Zarządza stanem połączenia z innymi peerami oraz przetwarza otrzymane od servera wiadomości.

#### Importowanie modułów
```typescript
import { Injectable, inject } from '@angular/core';
import { WebSocketService } from './web-socket.service';
import { MessageID, SignalingMsg } from '../model/messages';
import { BehaviorSubject } from 'rxjs';
import { CHAT_STATE_VALUE, ChatState } from '../model/chat.state';
import { PeersListService } from './chat-state.service';
import { UDPService } from './udp.service';
import { ChatService } from './chat.service';
```
- `@angular/core`: Moduł Angulara zawierający podstawowe funkcje i dekoratory.
- `rxjs`: Biblioteka do obsługi programowania reaktywnego.
- `WebSocketService`, `PeersListService`, `UDPService`, `ChatService`: Usługi używane w tej klasie.
- `MessageID`, `SignalingMsg`, `CHAT_STATE_VALUE`, `ChatState`: Modele i stałe używane do komunikacji i zarządzania stanem.

#### Stałe wartości
```typescript
const WS_ENDPOINT = 'ws://81.210.88.10:8080/wsapi';  // Punkt końcowy serwera WebSocket
const SIGNALING_SERVER_ADDRESS = '81.210.88.10';  // Adres serwera sygnalizacyjnego
const SIGNALING_SERVER_PORT = 8081;  // Port serwera sygnalizacyjnego
```

#### Klasa SignalingService
```typescript
@Injectable({
  providedIn: 'root',
})
export class SignalingService {
  private webSocketService = inject(WebSocketService);
  private peersListService = inject(PeersListService);
  private udpService = inject(UDPService);
  private chatService = inject(ChatService);

  clientNickname: string = 'guest';

  signalingState = new BehaviorSubject<ChatState>({ state: "IDLE" });
  peersList = this.peersListService.value$;

  getPeersInterval?: NodeJS.Timeout;

  constructor() {
    this.connectToWebSocket();

    this.webSocketService.getMessages().subscribe({
      next: (message) => {
        console.log('New message from server: ', message);
        this.messageMapper(message);
      },
    });

    this.signalingState.asObservable().subscribe({
      next: (state) => {
        this.stateControl(state.state);
      },
    });
  }
```
- `BehaviorSubject`: Używane do przechowywania i udostępniania aktualnego stanu sygnalizacji.
- `peersList`: Strumień obserwowalny listy peerów z `PeersListService`.


#### Łączenie z serwerem WebSocket
```typescript
  public connectToWebSocket() {
    this.webSocketService.closeConnection();
    this.webSocketService.connect(WS_ENDPOINT);
  }
```
- `connectToWebSocket()`: Łączy z serwerem WebSocket, zamykając najpierw istniejące połączenie.

#### Wysyłanie żądania uwierzytelniania
```typescript
  public getAuth(payload: { nickname: string; password: string }) {
    const authRequest = {
      id: MessageID.AuthReqID,
      r: {
        nickname: payload.nickname,
        password: payload.password,
      },
    };
    this.clientNickname = payload.nickname;
    console.log("Sending auth request: ", authRequest);
    this.webSocketService.sendMessage(JSON.stringify(authRequest));
  }
```
- `getAuth(payload: { nickname: string; password: string })`: Wysyła żądanie uwierzytelnienia z podanym nickiem i hasłem.

#### Tworzenie oferty połączenia
```typescript
  public createConnectionOffer(peerId: string) {
    const createOfferRequest = {
      id: MessageID.StartChatAReqID,
      r: {
        nickname: peerId,
      },
    };
    console.log("Sending connection offer request: ", createOfferRequest);
    this.webSocketService.sendMessage(JSON.stringify(createOfferRequest));
  }
```
- `createConnectionOffer(peerId: string)`: Wysyła żądanie utworzenia oferty połączenia do określonego peer'a.

#### Akceptowanie oferty połączenia
```typescript
  public acceptConnectionOffer(peerId: string) {
    const acceptOfferRequest = {
      id: MessageID.StartChatCReqID,
      r: {
        nickname: peerId,
      },
    };
    console.log("Sending accept connection offer request: ", acceptOfferRequest);
    this.webSocketService.sendMessage(JSON.stringify(acceptOfferRequest));
  }
```
- `acceptConnectionOffer(peerId: string)`: Wysyła żądanie akceptacji oferty połączenia od określonego peer'a.

#### Pobieranie informacji UDP peer'a
```typescript
  private getPeerUDPInfo(punchCode: string) {
    console.log(`Sending punchCode to ${SIGNALING_SERVER_ADDRESS}:${SIGNALING_SERVER_PORT} ` + punchCode);
    this.udpService.sendMessage(JSON.stringify({ punchCode: punchCode }), SIGNALING_SERVER_PORT, SIGNALING_SERVER_ADDRESS);
  }
```
- `getPeerUDPInfo(punchCode: string)`: Wysyła kod punch do serwera sygnalizacyjnego w celu uzyskania informacji UDP peer'a.

#### Pobieranie listy peerów
```typescript
  private getPeers() {
    const getPeersRequest = {
      id: MessageID.ListPeersReqID,
      r: {},
    };
    console.log("Sending get list of peer request: ", getPeersRequest);
    this.webSocketService.sendMessage(JSON.stringify(getPeersRequest));
  }
```
- `getPeers()`: Wysyła żądanie pobrania listy peerów.

#### Kontrola stanu sygnalizacji
```typescript
  private stateControl(state: string) {
    switch (state) {
      case "IDLE": {
        // Działania dla stanu IDLE
        break;
      }
      case "OPENED": {
        // Działania dla stanu OPENED
        break;
      }
      case "AUTH": {
        // Okresowe pobieranie listy peerów po uwierzytelnieniu
        setInterval(() => {
          this.getPeers();
        }, 1000);
        break;
      }
      case "ERROR": {
        // Czyszczenie interwału w przypadku błędu
        clearInterval(this.getPeersInterval);
        break;
      }
      case "CLOSED": {
        // Czyszczenie interwału w przypadku zamknięcia połączenia
        clearInterval(this.getPeersInterval);
        break;
      }
    }
  }
```
- `stateControl(state: string)`: Kontroluje działania w zależności od stanu sygnalizacji.

#### Mapowanie wiadomości na działania
```typescript
  private messageMapper(data: any) {
    const payload = JSON.parse(data) as SignalingMsg;

    switch (payload.id) {
      case MessageID.AuthResID: {
        if (payload.r?.IsSuccess) {
          this.signalingState.next({ state: "AUTH", nickname: this.clientNickname });
        }
        break;
      }
      case MessageID.EchoReqID: {
        this.signalingState.next({ state: "OPENED" });
        break;
      }
      case MessageID.ListPeersResID: {
        if (payload.r?.peers) {
          this.peersListService.setPeers(
            payload.r.peers.filter((peer) => peer.nickname != this.clientNickname && peer.hasNickname == true)
          );
        }
        break;
      }
      case MessageID.StartChatBReqID: {
        if (payload.r?.nickname) {
          this.acceptConnectionOffer(payload.r?.nickname);
        }
        break;
      }
      case MessageID.StartChatDReqID: {
        if (payload.r?.punchCode) {
          this.getPeerUDPInfo(payload.r.punchCode);
        }
        break;
      }
      case MessageID.StartChatFinishReqID: {
        if (payload.r?.otherSideAddress && payload.r.otherSideNickname) {
          this.chatService.start(payload.r.otherSideNickname, payload.r.otherSideAddress, this.clientNickname);
        }
        break;
      }
    }
  }
}
```
- `messageMapper(data: any)`: Mapuje otrzymane wiadomości na odpowiednie działania na podstawie ich ID.
### Peers.service.ts

#### Importowanie modułów
```typescript
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Peer } from '../model/peer.state';
```
- `@angular/core`: Moduł Angulara zawierający podstawowe funkcje i dekoratory.
- `rxjs`: Biblioteka do obsługi programowania reaktywnego.
- `Peer`: Model reprezentujący pojedynczego peer'a.

#### Klasa PeersService
```typescript
export class PeersService {
  private peers = new BehaviorSubject<Peer[]>([]);  // BehaviorSubject do przechowywania listy peerów
  peers$ = this.peers.asObservable();  // Strumień Observable listy peerów dostępny do subskrypcji dla innych komponentów

  constructor() { }

  /**
   * Dodaje nowego peer'a do listy peerów.
   * @param peer Nowy peer do dodania.
   */
  addPeer(peer: Peer) {
    this.peers.next([...this.peers.value, peer]);  // Dodaje nowego peer'a do bieżącej listy i emituje zaktualizowaną listę
  }

  /**
   * Ustawia całą listę peerów.
   * @param peers Nowa lista peerów.
   */
  setPeers(peers: Peer[]) {
    this.peers.next(peers);  // Ustawia nową listę peerów i emituje zaktualizowaną listę
  }
}
```
- `BehaviorSubject`: Używany do przechowywania i emitowania aktualnej listy peerów.
- `peers$`: Strumień Observable dla listy peerów, do którego mogą się subskrybować inne komponenty.


#### Dodanie nowego peer do listy
```typescript
  addPeer(peer: Peer) {
    this.peers.next([...this.peers.value, peer]);  // Dodaje nowego peer'a do bieżącej listy i emituje zaktualizowaną listę
  }
```
- `addPeer(peer: Peer)`: Dodaje nowego peer'a do aktualnej listy peerów.
  - Argumenty:
    - `peer`: Obiekt typu `Peer`, reprezentujący nowego peer'a do dodania.
  - Działanie:
    - Tworzy nową listę zawierającą wszystkie obecne peery oraz nowego peer'a.
    - Aktualizuje BehaviorSubject `peers` nową listą peerów, co powoduje emisję zaktualizowanej listy dla subskrybentów.

#### Ustawienie początkowej listy peerów
```typescript
  setPeers(peers: Peer[]) {
    this.peers.next(peers);  // Ustawia nową listę peerów i emituje zaktualizowaną listę
  }
```
- `setPeers(peers: Peer[])`: Ustawia nową listę peerów.
  - Argumenty:
    - `peers`: Tablica obiektów typu `Peer`, reprezentująca nową listę peerów.
  - Działanie:
    - Aktualizuje BehaviorSubject `peers` nową listą peerów, co powoduje emisję zaktualizowanej listy dla subskrybentów.

### Chat.service.ts
Obsługa widomości między peerami przesyłanymi poprzez UDP

#### Importowanie modułów
```typescript
import { Injectable, inject, signal } from '@angular/core';
import { UDPService } from './udp.service';
import { Message } from '../model/messages';
import { PeersService } from './peers.service';
import { DisconnectedState, Peer } from '../model/peer.state';
import { Router } from '@angular/router';
```
- `@angular/core`: Moduł Angulara zawierający podstawowe funkcje i dekoratory.
- `UDPService`: Serwis do obsługi komunikacji UDP.
- `Message`: Model reprezentujący wiadomość.
- `PeersService`: Serwis do zarządzania połączeniami peer-to-peer.
- `DisconnectedState`, `Peer`: Modele reprezentujące stan połączenia peer-to-peer oraz pojedynczego peer'a.
- `Router`: Moduł Angulara do nawigacji między trasami.

#### Klasa ChatService
```typescript
@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private udpService = inject(UDPService);  // Wstrzykuje UDPService do obsługi komunikacji UDP
  private peersService = inject(PeersService);  // Wstrzykuje PeersService do zarządzania połączeniami peer-to-peer
  private router = inject(Router);  // Wstrzykuje Router do nawigacji między trasami
  myNickname: string = 'guest';  // Domyślny nick użytkownika
  otherPeer?: Peer;  // Opcjonalna właściwość do przechowywania informacji o drugim peer'ze

  peers$ = this.peersService.peers$;  // Strumień Observable z listą peerów z PeersService

  private lastKeepalive = new Date().getTime();  // Czas ostatniego komunikatu keepalive
  keepInterval?: NodeJS.Timeout;  // Interval do wysyłania komunikatów keepalive
  private checkInterval: any;  // Interval do sprawdzania stanu połączenia
  private readonly TIMEOUT = 10000;  // Czas trwania timeoutu w milisekundach
  private readonly CHECK_INTERVAL = 2000;  // Czas trwania interwału do sprawdzania połączenia w milisekundach

  peer?: Peer;  // Opcjonalna właściwość do przechowywania aktualnego peer'a

  messageStack = signal<Message[]>([]);  // Sygnał do przechowywania stosu wiadomości

  messages$ = this.messageStack.asReadonly();  // Strumień Observable tylko do odczytu dla stosu wiadomości

  constructor() {
    // Ustawienie nasłuchiwania na przychodzące wiadomości z UDP service
    this.udpService.onMessage((message) => {
      const newMessage = JSON.parse(message) as Message;  // Parsowanie przychodzącej wiadomości
      if (newMessage.content != '') {
        if (this.peer?.state.state == 'CONNECTED') {
          console.log('New Message received:', message);
          this.peer.state.messages.push(newMessage);  // Dodanie nowej wiadomości do listy wiadomości peer'a
        }
      } else {
        this.lastKeepalive = new Date().getTime();  // Aktualizacja czasu ostatniego komunikatu keepalive
      }
    });
  }

  // Pozostałe metody...
}
```
- `ChatService`: Serwis do zarządzania sesjami czatu, wysyłania i odbierania wiadomości oraz zarządzania połączeniami peer-to-peer.
- `udpService`: Wstrzyknięty serwis UDP do obsługi komunikacji UDP.
- `peersService`: Wstrzyknięty serwis do zarządzania połączeniami peer-to-peer.
- `router`: Wstrzyknięty router do nawigacji między trasami.
- `myNickname`: Domyślny nick użytkownika.
- `otherPeer`, `peer`: Opcjonalne właściwości do przechowywania informacji o peer'ach.
- `peers$`: Strumień Observable z listą peerów.
- `lastKeepalive`: Czas ostatniego komunikatu keepalive.
- `keepInterval`, `checkInterval`: Interwały do wysyłania komunikatów keepalive i sprawdzania stanu połączenia.
- `TIMEOUT`, `CHECK_INTERVAL`: Stałe czasowe dla timeoutu i interwału sprawdzania.
- `messageStack`: Sygnał do przechowywania stosu wiadomości.
- `messages$`: Strumień Observable tylko do odczytu dla stosu wiadomości.

#### Konstruktor
```typescript
constructor() {
  // Ustawienie nasłuchiwania na przychodzące wiadomości z UDP service
  this.udpService.onMessage((message) => {
    const newMessage = JSON.parse(message) as Message;  // Parsowanie przychodzącej wiadomości
    if (newMessage.content != '') {
      if (this.peer?.state.state == 'CONNECTED') {
        console.log('New Message received:', message);
        this.peer.state.messages.push(newMessage);  // Dodanie nowej wiadomości do listy wiadomości peer'a
      }
    } else {
      this.lastKeepalive = new Date().getTime();  // Aktualizacja czasu ostatniego komunikatu keepalive
    }
  });
}
```
- Ustawia nasłuchiwanie na przychodzące wiadomości z serwisu UDP.
- Parsuje przychodzącą wiadomość i dodaje ją do listy wiadomości peer'a, jeśli treść nie jest pusta.
- Aktualizuje czas ostatniego komunikatu keepalive, jeśli treść jest pusta.

#### Metoda `start`
```typescript
/**
 * Rozpoczyna sesję czatu z określonym peer'em.
 * @param nickname Nick peer'a.
 * @param peerAddress Adres peer'a.
 * @param myNickname Nick bieżącego użytkownika.
 */
public start(nickname: string, peerAddress: string, myNickname: string) {
  this.myNickname = myNickname;  // Ustawia nick bieżącego użytkownika

  const address = peerAddress.split(':');  // Rozdziela adres peer'a na IP i port

  this.udpService.configureClient();  // Konfiguruje klienta UDP

  this.router.navigate(['chat', nickname]);  // Nawiguje do trasy czatu z nickiem peer'a
  
  // Dodaje peer'a do PeersService
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
```
- `start(nickname: string, peerAddress: string, myNickname: string)`: Rozpoczyna sesję czatu z określonym peer'em.
  - Argumenty:
    - `nickname`: Nick peer'a.
    - `peerAddress`: Adres peer'a.
    - `myNickname`: Nick bieżącego użytkownika.
  - Działanie:
    - Ustawia nick bieżącego użytkownika.
    - Rozdziela adres peer'a na IP i port.
    - Konfiguruje klienta UDP.
    - Nawiguje do trasy czatu z nickiem peer'a.
    - Dodaje peer'a do PeersService.

#### Metoda `startCheckInterval`
```typescript
/**
 * Rozpoczyna interwał do sprawdzania stanu połączenia.
 * Obecnie nieużywany. TOFIX
 */
private startCheckInterval() {
  this.checkInterval = setInterval(() => {
    const currentTime = new Date().getTime();  // Pobiera aktualny czas
    if (currentTime - this.lastKeepalive > this.TIMEOUT) {
      if (this.peer) {
        // Aktualizuje stan peer'a na rozłączony, jeśli minął timeout
        this.peer.state = { state: "DISCONNECTED", error: undefined } as DisconnectedState;
      }
      
      this.router.navigate(['/chat']);  // Nawiguje z powrotem do trasy czatu
      console.log(currentTime);
      console.log(this.lastKeepalive);
      console.error("T/0");  // Loguje błąd timeoutu
      this.stopSendingKeepalive();  // Zatrzymuje wysyłanie komunikatów keepalive
    }
  }, this.CHECK_INTERVAL);
}
```
- `startCheckInterval()`: Rozpoczyna interwał do sprawdzania stanu połączenia (obecnie nieużywany).
  - Działanie:
    - Pobiera aktualny czas.
    - Aktualizuje stan peer'a na rozłączony, jeśli minął timeout.
    - Nawiguje z powrotem do trasy czatu.
    - Loguje błąd timeoutu.
    - Zatrzymuje wysyłanie komunikatów keepalive.

#### Metoda `stopSendingKeepalive`
```typescript
/**
 * Zatrzymuje interwały do wysyłania komunikatów keepalive i sprawdzania stanu połączenia.
 * Obecnie nieużywany. TOFIX
 */
private stopSendingKeepalive() {
  clearInterval(this.keepInterval);  // Czyści interwał keepalive
  clearInterval(this.checkInterval);  // Czyści interwał sprawdzania połączenia
}
```
- `stopSendingKeepalive()`: Zatrzymuje interwa

ły do wysyłania komunikatów keepalive i sprawdzania stanu połączenia (obecnie nieużywany).
  - Działanie:
    - Czyści interwał keepalive.
    - Czyści interwał sprawdzania połączenia.

#### Metoda `send`
```typescript
/**
 * Wysyła wiadomość do określonego peer'a.
 * @param message Wiadomość do wysłania.
 * @param peer Peer, do którego wysyłana jest wiadomość.
 */
public send(message: string, peer: Peer) {
  if (peer.state.state == 'CONNECTED') {
    const newMessage: Message = { author: this.myNickname, content: message };  // Tworzy nowy obiekt wiadomości
    this.udpService.sendMessage(
      JSON.stringify(newMessage),  // Konwertuje wiadomość na JSON string
      peer.state.port,  // Port peer'a
      peer.state.address  // Adres peer'a
    );
    if (message != '') {
      peer.state.messages.push(newMessage);  // Dodaje nową wiadomość do listy wiadomości peer'a
    }
  }
}
```
- `send(message: string, peer: Peer)`: Wysyła wiadomość do określonego peer'a.
  - Argumenty:
    - `message`: Wiadomość do wysłania.
    - `peer`: Peer, do którego wysyłana jest wiadomość.
  - Działanie:
    - Sprawdza, czy stan peer'a to `CONNECTED`.
    - Tworzy nowy obiekt wiadomości.
    - Konwertuje wiadomość na JSON string i wysyła ją do peer'a.
    - Dodaje nową wiadomość do listy wiadomości peer'a, jeśli treść nie jest pusta.

### PeersList.service.ts
Przechowywanie i wykonywanie działań na liście chatów reprezentowanych przez peerów

#### Importowanie modułów
```typescript
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { PeerInfo } from '../model/peer';
```
- `@angular/core`: Moduł Angulara zawierający podstawowe funkcje i dekoratory.
- `rxjs`: Biblioteka do obsługi programowania reaktywnego.
- `PeerInfo`: Model reprezentujący informacje o peer'ach.

#### Typ ChatState
```typescript
export type ChatState = {
  peers: PeerInfo[]
}
```
- `ChatState`: Typ definiujący strukturę stanu czatu zawierającą listę peer'ów.

#### Początkowy stan czatu
```typescript
/**
 * Początkowy stan czatu.
 */
const initialState: ChatState = {
  peers: []
}
```
- `initialState`: Początkowy stan czatu z pustą listą peer'ów.

#### Klasa PeersListService
```typescript
@Injectable({
  providedIn: 'root'  // Oznacza, że serwis jest dostępny w całej aplikacji
})
export class PeersListService {
  constructor() { }

  /**
   * BehaviorSubject przechowujący aktualny stan listy peer'ów.
   */
  private state$ = new BehaviorSubject<ChatState>(initialState);

  /**
   * Strumień Observable listy peer'ów.
   */
  value$ = this.state$.asObservable();
}
```
- `PeersListService`: Serwis do zarządzania listą peer'ów.
- `state$`: BehaviorSubject przechowujący aktualny stan listy peer'ów.
- `value$`: Strumień Observable listy peer'ów.

#### Metoda `addPeer`
```typescript
/**
 * Metoda do dodawania nowego peer'a do listy.
 * @param peer Peer do dodania.
 */
addPeer(peer: PeerInfo) {
  this.state$.next({
    peers: [...this.state$.value.peers, peer]  // Dodaje nowego peer'a do bieżącej listy peer'ów
  });
}
```
- `addPeer(peer: PeerInfo)`: Dodaje nowego peer'a do listy peer'ów.
  - Argumenty:
    - `peer`: Obiekt typu `PeerInfo`, reprezentujący nowego peer'a do dodania.
  - Działanie:
    - Tworzy nową listę zawierającą wszystkie obecne peery oraz nowego peer'a.
    - Aktualizuje `BehaviorSubject` `state$` nową listą peer'ów, co powoduje emisję zaktualizowanego stanu.

#### Metoda `setPeers`
```typescript
/**
 * Metoda do ustawiania całej listy peer'ów.
 * @param peers Nowa lista peer'ów.
 */
setPeers(peers: PeerInfo[]) {
  this.state$.next({
    peers: peers  // Zastępuje bieżącą listę peer'ów podaną listą
  });
}
```
- `setPeers(peers: PeerInfo[])`: Ustawia nową listę peer'ów.
  - Argumenty:
    - `peers`: Tablica obiektów typu `PeerInfo`, reprezentująca nową listę peer'ów.
  - Działanie:
    - Aktualizuje `BehaviorSubject` `state$` nową listą peer'ów, co powoduje emisję zaktualizowanego stanu.

#### Metoda `removePeer`
```typescript
/**
 * Metoda do usuwania peer'a z listy na podstawie ID.
 * @param peerId ID peer'a do usunięcia.
 */
removePeer(peerId: number) {
  const updatedPeers = this.state$.value.peers.filter((peer) => {
    return peer.id !== peerId;  // Filtruje peer'a z podanym ID
  });

  this.state$.next({
    peers: updatedPeers  // Aktualizuje listę peer'ów po usunięciu określonego peer'a
  });
}
```
- `removePeer(peerId: number)`: Usuwa peer'a z listy na podstawie ID.
  - Argumenty:
    - `peerId`: ID peer'a do usunięcia.
  - Działanie:
    - Filtruje listę peer'ów, usuwając peer'a z podanym ID.
    - Aktualizuje `BehaviorSubject` `state$` nową listą peer'ów, co powoduje emisję zaktualizowanego stanu.

## Typy Danych 

### PeerInfo i Peer

#### Interfejs `PeerInfo`
```typescript
export interface PeerInfo {
    id: number,             // Unikalne ID peer'a
    addr: string,           // Adres peer'a
    hasNickname: boolean,   // Informacja, czy peer ma przypisany pseudonim
    nickname?: string       // Opcjonalny pseudonim peer'a
}
```
- `id`: Unikalne ID peer'a.
- `addr`: Adres peer'a.
- `hasNickname`: Informacja, czy peer ma przypisany pseudonim.
- `nickname`: Opcjonalny pseudonim peer'a.

#### Interfejs `Peer`
```typescript
export interface Peer {
    id: string,                  // Unikalne ID peer'a
    address: string,             // Adres peer'a
    port: number,                // Port peer'a
    connectionState?: PeerConnectionState  // Opcjonalny stan połączenia peer'a
}
```
- `id`: Unikalne ID peer'a.
- `address`: Adres peer'a.
- `port`: Port peer'a.
- `connectionState`: Opcjonalny stan połączenia peer'a, używający wyliczenia `PeerConnectionState`.

#### Wyliczenie `PeerConnectionState`
```typescript
export enum PeerConnectionState {
    PENDING,        // Połączenie w trakcie nawiązywania
    CONNECTED,      // Połączenie nawiązane
    DISCONNECTED    // Połączenie rozłączone
}
```
- `PENDING`: Połączenie w trakcie nawiązywania.
- `CONNECTED`: Połączenie nawiązane.
- `DISCONNECTED`: Połączenie rozłączone.

### Peer State and Peer Interface

#### Importowanie modułów
```typescript
import { Message } from "./messages";
```
- `./messages`: Importuje moduł z definicją typu `Message`.

#### Typy stanów peer'a
```typescript
export type IdleState = { state: PEER_STATE_VALUE['IDLE'] };
type ConnectedState = { state: PEER_STATE_VALUE['CONNECTED'], address: string, port: number, messages: Message[] };
type PendingState = { state: PEER_STATE_VALUE['PENDING'] };
export type DisconnectedState = { state: PEER_STATE_VALUE['DISCONNECTED'], error?: Event };
```
- `IdleState`: Reprezentuje stan bezczynności peer'a.
- `ConnectedState`: Reprezentuje stan połączenia peer'a, zawiera adres, port i wiadomości.
- `PendingState`: Reprezentuje stan oczekiwania na połączenie peer'a.
- `DisconnectedState`: Reprezentuje stan rozłączenia peer'a, opcjonalnie zawiera błąd.

#### Konstanta `PEER_STATE_VALUE`
```typescript
export const PEER_STATE_VALUE = {
  IDLE: 'IDLE',
  CONNECTED: 'CONNECTED',
  PENDING: 'PENDING',
  DISCONNECTED: 'DISCONNECTED',
} as const;
```
- `PEER_STATE_VALUE`: Zawiera możliwe wartości stanów peer'a:
  - `IDLE`: Bezczynność.
  - `CONNECTED`: Połączenie.
  - `PENDING`: Oczekiwanie.
  - `DISCONNECTED`: Rozłączenie.

#### Typ `PeerStateValue`
```typescript
export type PeerStateValue = keyof typeof PEER_STATE_VALUE;
```
- `PeerStateValue`: Typ definiujący klucze `PEER_STATE_VALUE`.

#### Typ `PeerState`
```typescript
export type PeerState =
  | IdleState
  | ConnectedState
  | DisconnectedState
  | PendingState;
```
- `PeerState`: Typ definiujący możliwe stany peer'a:
  - `IdleState`
  - `ConnectedState`
  - `DisconnectedState`
  - `PendingState`

#### Interfejs `Peer`
```typescript
export interface Peer {
  id: string,       // Unikalne ID peer'a
  state: PeerState  // Stan peer'a
}
```
- `Peer`: Interfejs definiujący peer'a.
  - `id`: Unikalne ID peer'a.
  - `state`: Stan peer'a, zdefiniowany przez typ `PeerState`.

### SignalingMsg 

#### Importowanie modułów
```typescript
import { PeerInfo } from "./peer"
```
- `./peer`: Importuje moduł z definicją typu `PeerInfo`.

#### Interfejs `SignalingMsg`
```typescript
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
```
- `SignalingMsg`: Interfejs definiujący strukturę wiadomości sygnalizacyjnych.
  - `id`: Identyfikator wiadomości, typ `MessageID`.
  - `r`: Opcjonalny obiekt zawierający dodatkowe dane:
    - `nickname`: Opcjonalny pseudonim.
    - `password`: Opcjonalne hasło.
    - `IsSuccess`: Opcjonalna informacja o powodzeniu operacji.
    - `peers`: Opcjonalna lista peer'ów, typ `PeerInfo[]`.
    - `punchCode`: Opcjonalny kod punch.
    - `otherSideAddress`: Opcjonalny adres drugiej strony.
    - `otherSideNickname`: Opcjonalny pseudonim drugiej strony.

#### Wyliczenie `MessageID`
```typescript
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
```
- `MessageID`: Wyliczenie definiujące identyfikatory różnych typów wiadomości:
  - `EchoReqID`: 1
  - `EchoResID`: 129 (128 + 1)
  - `ListPeersReqID`: 2
  - `ListPeersResID`: 130 (128 + 2)
  - `AuthReqID`: 3
  - `AuthResID`: 131 (128 + 3)
  - `StartChatAReqID`: 4
  - `StartChatBReqID`: 5
  - `StartChatCReqID`: 6
  - `StartChatDReqID`: 7
  - `StartChatFinishReqID`: 8

#### Interfejs `Message`
```typescript
export interface Message {
    author: string,  // Autor wiadomości
    content: string  // Treść wiadomości
}
```
- `Message`: Interfejs definiujący strukturę wiadomości.
  - `author`: Autor wiadomości.
  - `content`: Treść wiadomości.

#### Typ `Connected`
```typescript
export type Connected = { state: "CONNECTED", address: string, port: number, messages: Message[] }
```
- `Connected`: Typ definiujący stan połączenia.
  - `state`: Stan połączenia, zawsze "CONNECTED".
  - `address`: Adres połączenia.
  - `port`: Port połączenia.
  - `messages`: Lista wiadomości, typ `Message[]`.

### Chat State

#### Typy stanów czatu
```typescript
export type IdleState = { state: 'IDLE' };

type OpenedState = { state: CHAT_STATE_VALUE['OPENED'] };

type AuthState = { state: CHAT_STATE_VALUE['AUTH'], nickname: string };

export type ErrorState = { state: CHAT_STATE_VALUE['ERROR'], error: Event };

export type ClosedState = { state: CHAT_STATE_VALUE['CLOSED'] };
```
- `IdleState`: Reprezentuje stan bezczynności czatu.
- `OpenedState`: Reprezentuje stan otwartego czatu.
- `AuthState`: Reprezentuje stan autoryzacji czatu, zawiera pseudonim.
- `ErrorState`: Reprezentuje stan błędu czatu, zawiera błąd.
- `ClosedState`: Reprezentuje stan zamknięcia czatu.

#### Konstanta `CHAT_STATE_VALUE`
```typescript
export const CHAT_STATE_VALUE = {
  IDLE: 'IDLE',
  OPENED: 'OPENED',
  AUTH: 'AUTH',
  SUCCESS_GET_LIST_OF_PEERS: 'SUCCESS_GET_LIST_OF_PEERS',
  ERROR: 'ERROR',
  CLOSED: 'CLOSED'
} as const;
```
- `CHAT_STATE_VALUE`: Zawiera możliwe wartości stanów czatu:
  - `IDLE`: Bezczynność.
  - `OPENED`: Otwarte.
  - `AUTH`: Autoryzacja.
  - `SUCCESS_GET_LIST_OF_PEERS`: Sukces w uzyskaniu listy peer'ów.
  - `ERROR`: Błąd.
  - `CLOSED`: Zamknięte.

#### Typ `ChatStateValue`
```typescript
export type ChatStateValue = keyof typeof CHAT_STATE_VALUE;
```
- `ChatStateValue`: Typ definiujący klucze `CHAT_STATE_VALUE`.

#### Typ `ChatState`
```typescript
export type ChatState =
  | IdleState
  | OpenedState
  | AuthState
  | ErrorState
  | ClosedState;
```
- `ChatState`: Typ definiujący możliwe stany czatu:
  - `IdleState`
  - `OpenedState`
  - `AuthState`
  - `ErrorState`
  - `ClosedState`