import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
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

  buttonClasses() {
    const base = 'group relative inline-flex items-center justify-center font-semibold transition-all duration-200 active:scale-[0.98] select-none';
    const width = this.fullWidth() ? 'w-full' : '';
    const rounded = 'rounded-2xl';

    let sizeStyle = '';
    switch (this.size()) {
      case 'sm':
        sizeStyle = 'px-4 py-2.5 text-sm gap-1.5';
        break;
      case 'md':
        sizeStyle = 'px-5 py-3 text-base gap-2';
        break;
      case 'lg':
      default:
        sizeStyle = 'px-6 py-4 text-base font-bold gap-2';
        break;
    }

    let variantStyle = '';
    switch (this.variant()) {
      case 'secondary':
        variantStyle = 'bg-[#EDF5EF] hover:bg-[#E2EDE5] text-[#17241D] active:bg-[#D5E3DA]';
        break;
      case 'outline':
        variantStyle = 'border-2 border-[#278F39] text-[#278F39] hover:bg-[#E5F5E8] bg-transparent';
        break;
      case 'ghost':
        variantStyle = 'bg-transparent text-[#627264] hover:text-[#103A2A] hover:bg-[#F1F5F2]';
        break;
      case 'primary':
      default:
        variantStyle = 'bg-[#278F39] hover:bg-[#217A30] text-white shadow-button hover:shadow-lg active:shadow-sm';
        break;
    }

    const disabledStyle = this.disabled() ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer';

    return `${base} ${width} ${rounded} ${sizeStyle} ${variantStyle} ${disabledStyle}`;
  }
}
