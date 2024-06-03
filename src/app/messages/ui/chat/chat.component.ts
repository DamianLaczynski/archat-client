import { Component, Input, OnChanges, OnInit, SimpleChanges, computed, inject } from '@angular/core';
import { FormControl, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ChatService } from '../../service/chat.service';
import { AsyncPipe } from '@angular/common';
import { Message } from '../../model/payload';
import { PEER_STATE_VALUE, Peer } from '../../model/peer.state';
import { RouterLink } from '@angular/router';

type MessageForm = FormGroup<{
  message: FormControl<string>;
}>;

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [ReactiveFormsModule, AsyncPipe, RouterLink],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
export class ChatComponent implements OnInit, OnChanges {
  @Input() id?: string;
  private formBuilder = inject(NonNullableFormBuilder);
  private chatService = inject(ChatService);
  otherPeerName?: string = this.chatService.otherPeer?.id;
  myNick = this.chatService.myNickname;
  messages = computed(() => this.chatService.messages$());

  messageForm: MessageForm = this.formBuilder.group({
    message: this.formBuilder.control<string>('', Validators.required)
  })

  peer?: Peer;

  ngOnInit(): void {
    this.chatService.peers$.subscribe({next: (peers) => {
      this.peer = peers.find((peer) => peer.id == this.id);
      if(this.peer)
        {
          this.chatService.peer = this.peer;
        }
    }})
  }
  ngOnChanges(changes: SimpleChanges): void {
    
  }

  send()
  {
    if(this.messageForm.valid && this.peer)
      {
        console.log(this.messageForm.value);
        this.chatService.send(this.messageForm.controls.message.value, this.peer)
        this.messageForm.reset();
      }
    
  }
}
