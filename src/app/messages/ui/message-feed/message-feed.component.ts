import { Component } from '@angular/core';
import { FeedHeaderComponent } from '../feed-header/feed-header.component';
import { MessageCellComponent } from '../message-cell/message-cell.component';
import { ChatNotification, NotificationType } from '../../../notifications/model/notification';

@Component({
  selector: 'app-messages-feed',
  standalone: true,
  imports: [FeedHeaderComponent, MessageCellComponent],
  templateUrl: './message-feed.component.html',
  styleUrl: './message-feed.component.css'
})
export class MessagesFeedComponent {
  chatNotifications: ChatNotification[] = [
    {
      id: "1",
      type: NotificationType.Chat,
      timestamp: new Date(new Date().getTime() - 13000*130000),
      isRead: true,
      sender: "user123",
      message: "Hello, how are you?",
      chatId: "chat123",
      chatName: "Chat Room 1", // Added chatName property
    },
    {
      id: "2",
      type: NotificationType.Chat,
      timestamp: new Date(new Date().getTime() - 13000), // Adding 1 second to make timestamps unique
      isRead: false,
      sender: "user456",
      message: "Good morning!",
      chatId: "chat456",
      chatName: "Chat Room 2", // Added chatName property
    },
    {
      id: "3",
      type: NotificationType.Chat,
      timestamp: new Date(new Date().getTime() - 22504500), // Adding 2 seconds to make timestamps unique
      isRead: false,
      sender: "user789",
      message: "Hi there!",
      chatId: "chat789",
      chatName: "Chat Room 3", // Added chatName property
    },
  ];
  
}
