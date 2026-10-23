import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-logo',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './logo.component.html',
  styleUrl: './logo.component.scss'
})
export class LogoComponent {
  size = input<'sm' | 'md' | 'lg'>('md');
  showTagline = input<boolean>(false);
  centered = input<boolean>(false);
  variant = input<'full' | 'leaf-text'>('full');

  iconSize() {
    switch (this.size()) {
      case 'sm': return 26;
      case 'lg': return 48;
      case 'md':
      default: return 34;
    }
  }
}
