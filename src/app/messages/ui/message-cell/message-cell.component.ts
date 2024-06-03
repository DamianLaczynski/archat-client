import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PeerInfo } from '../../model/payload';


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

 timeAgo(timestamp: Date) {
  const now = new Date().getTime();
    const messageTime = typeof timestamp === 'number' ? timestamp : timestamp.getTime();
    const seconds = Math.floor((now - messageTime) / 1000);
  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) {
      return interval + " years ago";
  }

  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) {
      return interval + " months ago";
  }

  interval = Math.floor(seconds / 86400);
  if (interval >= 1) {
      return interval + " days ago";
  }

  interval = Math.floor(seconds / 3600);
  if (interval >= 1) {
      return interval + " hours ago";
  }

  interval = Math.floor(seconds / 60);
  if (interval >= 1) {
      return interval + " minutes ago";
  }

  return Math.floor(seconds) + " seconds ago";
}
}
