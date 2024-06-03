import { Routes } from '@angular/router';
import { ChatPageComponent } from './messages/chat.page.component';

export const routes: Routes = [
    {path: '', redirectTo: '/chat', pathMatch: 'full'},
    {path: 'chat', component: ChatPageComponent}
];
