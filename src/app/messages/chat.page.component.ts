import { Component, Input, OnInit, inject } from '@angular/core';
import { ChatComponent } from './ui/chat/chat.component';
import { RoomsListComponent } from './ui/rooms-list/rooms-list.component';
import { AsyncPipe } from '@angular/common';
import { SignalingService } from './service/signaling.service';

@Component({
  selector: 'app-chatpage',
  standalone: true,
  imports: [ChatComponent, RoomsListComponent, AsyncPipe],
  templateUrl: './chat.page.component.html',
  styleUrl: './chat.page.component.css'
})
export class ChatPageComponent implements OnInit{
  @Input() chatId?: string;

  private signalingService = inject(SignalingService);

  peersList$ = this.signalingService.peersList;

  isConnectedToPeer: boolean = this.signalingService.clientNickname ? true : false;
  ngOnInit(): void {
    //this.chatsService.getMessages().subscribe((val) => console.log(val))
  }

  login(payload: {nickname: string, password: string})
  {
    this.signalingService.getAuth(payload);
  }

  connect(nickname: string)
  {
    this.signalingService.createConnectionOffer(nickname);
  }

  refreshList()
  {
    this.signalingService.getPeers();
  }
}
