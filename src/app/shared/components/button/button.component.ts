import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [],
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss'
})
export class ButtonComponent {
  variant = input<'primary' | 'secondary' | 'outline' | 'ghost'>('primary');
  size = input<'sm' | 'md' | 'lg'>('lg');
  fullWidth = input<boolean>(true);
  disabled = input<boolean>(false);
  type = input<'button' | 'submit' | 'reset'>('button');
  iconRight = input<boolean>(false);

  clicked = output<MouseEvent>();
}

