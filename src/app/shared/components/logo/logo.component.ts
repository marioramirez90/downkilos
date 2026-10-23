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

  containerClasses() {
    const align = this.centered() ? 'justify-center items-center' : 'items-center';
    return `inline-flex gap-2.5 ${align}`;
  }

  iconWrapperClasses() {
    return 'flex-shrink-0 flex items-center justify-center';
  }

  iconSize() {
    switch (this.size()) {
      case 'sm': return 24;
      case 'lg': return 42;
      case 'md':
      default: return 32;
    }
  }

  textClasses() {
    switch (this.size()) {
      case 'sm':
        return 'text-lg font-bold tracking-tight text-[#103A2A]';
      case 'lg':
        return 'text-3xl font-extrabold tracking-tight text-[#103A2A]';
      case 'md':
      default:
        return 'text-2xl font-bold tracking-tight text-[#103A2A]';
    }
  }
}
