import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarMenuComponent } from './shared/components/sidebar-menu/sidebar-menu.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SidebarMenuComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('down-kilos');
}
