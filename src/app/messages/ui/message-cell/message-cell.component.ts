import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PeerInfo } from '../../model/peer';


@Component({
  selector: 'app-message-cell',
  standalone: true,
  imports: [DatePipe, RouterLink],
  templateUrl: './message-cell.component.html',
  styleUrl: './message-cell.component.css'
})
export class MessageCellComponent {
  @Input({required: true}) notification!: PeerInfo;
  @Output()connect = new EventEmitter<string>();
}
