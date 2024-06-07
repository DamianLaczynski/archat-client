import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { MessageCellComponent } from '../message-cell/message-cell.component';
import { AsyncPipe } from '@angular/common';
import { SignalingService } from '../../service/signaling.service';
import { PeerInfo } from '../../model/peer';

@Component({
  selector: 'app-rooms-list',
  standalone: true,
  imports: [MessageCellComponent, AsyncPipe],
  templateUrl: './rooms-list.component.html',
  styleUrl: './rooms-list.component.css'
})
export class RoomsListComponent {
  @Input() peers: PeerInfo[] = [];
  @Output() login = new EventEmitter<{nickname: string, password: string}>();
  @Output() connect = new EventEmitter<string>();
  @Output() refreshList = new EventEmitter();
  @Output() reconnect = new EventEmitter();


  private signalingService = inject(SignalingService);

  chatState$ = this.signalingService.signalingState;
}
