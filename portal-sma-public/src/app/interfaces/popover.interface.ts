export interface Popover {
  id: string;
  title: string;
  text: string;
  position: PopoverPosition;
  has_icon: number;
  icon?: string;
  is_active?: number;
  created_at?: Date;
  updated_at?: Date;
}

export type PopoverPosition = 'top' | 'bottom' | 'left' | 'right';
