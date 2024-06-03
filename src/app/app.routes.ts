import { Routes } from '@angular/router';
import { ChatPageComponent } from './messages/chat.page.component';
import { ChatComponent } from './messages/ui/chat/chat.component';

export const routes: Routes = [
    {path: '', redirectTo: '/chat', pathMatch: 'full'},
    {path: 'chat', component: ChatPageComponent},
    {path: 'chat/:id', component: ChatComponent}
];
