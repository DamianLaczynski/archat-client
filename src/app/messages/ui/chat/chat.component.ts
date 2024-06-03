import { Component, OnInit, computed, inject } from '@angular/core';
import { FormControl, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ChatService } from '../../service/chat.service';
import { AsyncPipe } from '@angular/common';
import { Message } from '../../model/payload';

type MessageForm = FormGroup<{
  message: FormControl<string>;
}>;

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [ReactiveFormsModule, AsyncPipe],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
export class ChatComponent implements OnInit {
  private formBuilder = inject(NonNullableFormBuilder);
  private chatService = inject(ChatService);
  otherPeerName?: string = this.chatService.otherPeer?.nickname;
  myNick = this.chatService.myNickname;
  messages = computed(() => this.chatService.messages$());

  messageForm: MessageForm = this.formBuilder.group({
    message: this.formBuilder.control<string>('', Validators.required)
  })

  ngOnInit(): void {
    
  }

  send()
  {
    if(this.messageForm.valid)
      {
        console.log(this.messageForm.value);
        this.chatService.send(this.messageForm.value.message || '')
        this.messageForm.reset();
      }
    
  }
}
