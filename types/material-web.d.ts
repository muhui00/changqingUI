/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Ambient JSX intrinsic element typings for @material/web custom elements.
 * This file must NOT contain any top-level import/export statements so that
 * TypeScript treats it as a script (ambient module) and merges the JSX
 * namespace declarations into the global scope automatically.
 */

// Use the built-in DOM types rather than importing from 'react' to keep this
// file as a pure ambient declaration with no imports.
type _MdHTMLProps = {
  id?: string
  className?: string
  style?: any
  slot?: string
  class?: string
  ref?: any
  key?: any
  children?: any
  onClick?: React.MouseEventHandler<HTMLElement>
  onChange?: React.ChangeEventHandler<HTMLElement>
  onInput?: React.FormEventHandler<HTMLElement>
  onKeyDown?: React.KeyboardEventHandler<HTMLElement>
  onKeyUp?: React.KeyboardEventHandler<HTMLElement>
  onFocus?: React.FocusEventHandler<HTMLElement>
  onBlur?: React.FocusEventHandler<HTMLElement>
  'aria-label'?: string
  'aria-hidden'?: string | boolean
  'aria-expanded'?: string | boolean
  'aria-controls'?: string
  'aria-current'?: string | boolean
  role?: string
  tabIndex?: number
}

declare namespace JSX {
  interface IntrinsicElements {
    // Buttons
    'md-filled-button': _MdHTMLProps & { disabled?: boolean; href?: string; target?: string; trailing?: boolean }
    'md-outlined-button': _MdHTMLProps & { disabled?: boolean; href?: string }
    'md-text-button': _MdHTMLProps & { disabled?: boolean; href?: string }
    'md-tonal-button': _MdHTMLProps & { disabled?: boolean }
    'md-filled-tonal-button': _MdHTMLProps & { disabled?: boolean }
    'md-icon-button': _MdHTMLProps & { disabled?: boolean; toggle?: boolean; selected?: boolean; href?: string }
    'md-filled-icon-button': _MdHTMLProps & { disabled?: boolean }
    'md-outlined-icon-button': _MdHTMLProps & { disabled?: boolean; toggle?: boolean; selected?: boolean }
    'md-tonal-icon-button': _MdHTMLProps & { disabled?: boolean }

    // FAB
    'md-fab': _MdHTMLProps & { label?: string; size?: 'small' | 'medium' | 'large'; variant?: 'surface' | 'primary' | 'secondary' | 'tertiary'; lowered?: boolean }

    // Icon
    'md-icon': _MdHTMLProps

    // Text fields
    'md-filled-text-field': _MdHTMLProps & {
      label?: string; value?: string; type?: string; placeholder?: string
      disabled?: boolean; error?: boolean; 'error-text'?: string
      'supporting-text'?: string; 'trailing-icon'?: boolean; 'leading-icon'?: boolean
      required?: boolean; readonly?: boolean; rows?: number
    }
    'md-outlined-text-field': _MdHTMLProps & {
      label?: string; value?: string; type?: string; placeholder?: string
      disabled?: boolean; error?: boolean; 'error-text'?: string
      'supporting-text'?: string; required?: boolean; readonly?: boolean
    }

    // Select
    'md-filled-select': _MdHTMLProps & { label?: string; disabled?: boolean; required?: boolean; value?: string }
    'md-outlined-select': _MdHTMLProps & { label?: string; disabled?: boolean; required?: boolean; value?: string }
    'md-select-option': _MdHTMLProps & { value?: string; selected?: boolean; disabled?: boolean }

    // Checkbox
    'md-checkbox': _MdHTMLProps & { checked?: boolean; indeterminate?: boolean; disabled?: boolean; value?: string; name?: string }

    // Radio
    'md-radio': _MdHTMLProps & { checked?: boolean; disabled?: boolean; value?: string; name?: string }

    // Switch
    'md-switch': _MdHTMLProps & { selected?: boolean; disabled?: boolean; icons?: boolean; 'show-only-selected-icon'?: boolean }

    // Slider
    'md-slider': _MdHTMLProps & { min?: number; max?: number; value?: number; step?: number; disabled?: boolean; labeled?: boolean }

    // Progress
    'md-linear-progress': _MdHTMLProps & { value?: number; max?: number; buffer?: number; indeterminate?: boolean }
    'md-circular-progress': _MdHTMLProps & { value?: number; max?: number; indeterminate?: boolean }

    // Dialog
    'md-dialog': _MdHTMLProps & {
      open?: boolean; quick?: boolean
      onclosed?: (e: Event) => void; onopened?: (e: Event) => void; onclose?: (e: Event) => void
    }

    // Divider
    'md-divider': _MdHTMLProps & { inset?: boolean; 'inset-start'?: boolean; 'inset-end'?: boolean }

    // List
    'md-list': _MdHTMLProps
    'md-list-item': _MdHTMLProps & {
      disabled?: boolean; type?: 'text' | 'button' | 'link'; href?: string; target?: string
      'supporting-text'?: string; 'multi-line-supporting-text'?: boolean; 'trailing-supporting-text'?: string
    }

    // Chips
    'md-chip-set': _MdHTMLProps
    'md-filter-chip': _MdHTMLProps & { label?: string; selected?: boolean; disabled?: boolean; elevated?: boolean; removable?: boolean }
    'md-assist-chip': _MdHTMLProps & { label?: string; disabled?: boolean; elevated?: boolean; href?: string }
    'md-suggestion-chip': _MdHTMLProps & { label?: string; disabled?: boolean; elevated?: boolean }
    'md-input-chip': _MdHTMLProps & { label?: string; disabled?: boolean; avatar?: boolean; href?: string; removable?: boolean }

    // Tabs
    'md-tabs': _MdHTMLProps & { 'active-tab-index'?: number; onchange?: (e: Event) => void }
    'md-primary-tab': _MdHTMLProps & { 'inline-icon'?: boolean; active?: boolean }
    'md-secondary-tab': _MdHTMLProps & { active?: boolean }

    // Menu
    'md-menu': _MdHTMLProps & {
      anchor?: string; open?: boolean | undefined; positioning?: string
      onclosed?: (e: Event) => void; onopened?: (e: Event) => void
    }
    'md-menu-item': _MdHTMLProps & {
      disabled?: boolean; type?: 'menuitem' | 'option' | 'button' | 'link'
      href?: string; target?: string; 'keep-open'?: boolean
    }
    'md-sub-menu': _MdHTMLProps

    // Badge
    'md-badge': _MdHTMLProps & { value?: string }

    // Ripple
    'md-ripple': _MdHTMLProps & { disabled?: boolean }

    // Focus ring
    'md-focus-ring': _MdHTMLProps & { visible?: boolean }

    // Elevation
    'md-elevation': _MdHTMLProps

    // Cards (labs)
    'md-elevated-card': _MdHTMLProps
    'md-filled-card': _MdHTMLProps
    'md-outlined-card': _MdHTMLProps

    // Segmented button (labs)
    'md-segmented-button-set': _MdHTMLProps
    'md-segmented-button': _MdHTMLProps & { label?: string; selected?: boolean; disabled?: boolean }

    // Navigation bar (labs)
    'md-navigation-bar': _MdHTMLProps & { 'active-index'?: number; onchange?: (e: Event) => void }
    'md-navigation-tab': _MdHTMLProps & { label?: string; active?: boolean; 'badge-value'?: string; 'show-badge'?: boolean }

    // Navigation drawer (labs)
    'md-navigation-drawer': _MdHTMLProps & { opened?: boolean; pivot?: 'start' | 'end' }
  }
}
