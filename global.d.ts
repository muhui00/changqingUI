/**
 * Extends React.JSX.IntrinsicElements with @material/web custom element typings.
 *
 * With `jsx: "react-jsx"` and `moduleResolution: "bundler"` (Next.js / React 19),
 * TypeScript resolves JSX element types from React.JSX.IntrinsicElements.
 * This ambient script file (no imports) merges the declarations at the global level.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
type _MdEl = {
  id?: string
  className?: string
  style?: any
  slot?: string
  class?: string
  ref?: any
  key?: any
  children?: any
  role?: string
  tabIndex?: number
  onClick?: any
  onChange?: any
  onInput?: any
  onKeyDown?: any
  onKeyUp?: any
  onFocus?: any
  onBlur?: any
  'aria-label'?: string
  'aria-hidden'?: string | boolean
  'aria-expanded'?: string | boolean
  'aria-controls'?: string
  'aria-current'?: string | boolean
  'aria-describedby'?: string
  'aria-labelledby'?: string
  'aria-selected'?: string | boolean
  'aria-checked'?: string | boolean
  'aria-disabled'?: string | boolean
  title?: string
  type?: string
  name?: string
  form?: string
  value?: string | number
  defaultValue?: string | number
  placeholder?: string
  readOnly?: boolean
  multiple?: boolean
  oninput?: (e: Event) => void
  onchange?: (e: Event) => void
  onclosed?: (e: Event) => void
  onopened?: (e: Event) => void
  onclose?: (e: Event) => void
}

// Legacy global JSX namespace (used by tsc type-checker)
declare namespace JSX {
  interface IntrinsicElements {
    'md-filled-button': _MdEl & { disabled?: boolean; href?: string; target?: string; trailing?: boolean }
    'md-outlined-button': _MdEl & { disabled?: boolean; href?: string }
    'md-text-button': _MdEl & { disabled?: boolean; href?: string }
    'md-tonal-button': _MdEl & { disabled?: boolean }
    'md-filled-tonal-button': _MdEl & { disabled?: boolean }
    'md-icon-button': _MdEl & { disabled?: boolean; toggle?: boolean; selected?: boolean; href?: string }
    'md-filled-icon-button': _MdEl & { disabled?: boolean }
    'md-outlined-icon-button': _MdEl & { disabled?: boolean; toggle?: boolean; selected?: boolean }
    'md-tonal-icon-button': _MdEl & { disabled?: boolean }
    'md-fab': _MdEl & { label?: string; size?: 'small' | 'medium' | 'large'; variant?: 'surface' | 'primary' | 'secondary' | 'tertiary'; lowered?: boolean }
    'md-icon': _MdEl
    'md-filled-text-field': _MdEl & { label?: string; value?: string; type?: string; placeholder?: string; disabled?: boolean; error?: boolean; 'error-text'?: string; 'supporting-text'?: string; 'trailing-icon'?: boolean; 'leading-icon'?: boolean; required?: boolean; readonly?: boolean; rows?: number }
    'md-outlined-text-field': _MdEl & { label?: string; value?: string; type?: string; placeholder?: string; disabled?: boolean; error?: boolean; 'error-text'?: string; 'supporting-text'?: string; required?: boolean; readonly?: boolean }
    'md-filled-select': _MdEl & { label?: string; disabled?: boolean; required?: boolean; value?: string }
    'md-outlined-select': _MdEl & { label?: string; disabled?: boolean; required?: boolean; value?: string }
    'md-select-option': _MdEl & { value?: string; selected?: boolean; disabled?: boolean }
    'md-checkbox': _MdEl & { checked?: boolean; indeterminate?: boolean; disabled?: boolean; value?: string; name?: string }
    'md-radio': _MdEl & { checked?: boolean; disabled?: boolean; value?: string; name?: string }
    'md-switch': _MdEl & { selected?: boolean; disabled?: boolean; icons?: boolean; 'show-only-selected-icon'?: boolean }
    'md-slider': _MdEl & { min?: number; max?: number; value?: number; step?: number; disabled?: boolean; labeled?: boolean; oninput?: (e: Event) => void }
    'md-linear-progress': _MdEl & { value?: number; max?: number; buffer?: number; indeterminate?: boolean }
    'md-circular-progress': _MdEl & { value?: number; max?: number; indeterminate?: boolean }
    'md-dialog': _MdEl & { open?: boolean; quick?: boolean; onclosed?: (e: Event) => void; onopened?: (e: Event) => void; onclose?: (e: Event) => void }
    'md-divider': _MdEl & { inset?: boolean; 'inset-start'?: boolean; 'inset-end'?: boolean }
    'md-list': _MdEl
    'md-list-item': _MdEl & { disabled?: boolean; type?: 'text' | 'button' | 'link'; href?: string; target?: string; 'supporting-text'?: string; 'multi-line-supporting-text'?: boolean; 'trailing-supporting-text'?: string }
    'md-chip-set': _MdEl
    'md-filter-chip': _MdEl & { label?: string; selected?: boolean; disabled?: boolean; elevated?: boolean; removable?: boolean }
    'md-assist-chip': _MdEl & { label?: string; disabled?: boolean; elevated?: boolean; href?: string }
    'md-suggestion-chip': _MdEl & { label?: string; disabled?: boolean; elevated?: boolean }
    'md-input-chip': _MdEl & { label?: string; disabled?: boolean; avatar?: boolean; href?: string; removable?: boolean }
    'md-tabs': _MdEl & { 'active-tab-index'?: number; onchange?: (e: Event) => void }
    'md-primary-tab': _MdEl & { 'inline-icon'?: boolean; active?: boolean }
    'md-secondary-tab': _MdEl & { active?: boolean }
    'md-menu': _MdEl & { anchor?: string; open?: boolean; positioning?: string; onclosed?: (e: Event) => void; onopened?: (e: Event) => void }
    'md-menu-item': _MdEl & { disabled?: boolean; type?: 'menuitem' | 'option' | 'button' | 'link'; href?: string; target?: string; 'keep-open'?: boolean }
    'md-sub-menu': _MdEl
    'md-badge': _MdEl & { value?: string }
    'md-ripple': _MdEl & { disabled?: boolean }
    'md-focus-ring': _MdEl & { visible?: boolean }
    'md-elevation': _MdEl
    'md-elevated-card': _MdEl
    'md-filled-card': _MdEl
    'md-outlined-card': _MdEl
    'md-segmented-button-set': _MdEl
    'md-segmented-button': _MdEl & { label?: string; selected?: boolean; disabled?: boolean }
    'md-navigation-bar': _MdEl & { 'active-index'?: number; onchange?: (e: Event) => void }
    'md-navigation-tab': _MdEl & { label?: string; active?: boolean; 'badge-value'?: string; 'show-badge'?: boolean }
    'md-navigation-drawer': _MdEl & { opened?: boolean; pivot?: 'start' | 'end' }
  }
}

// React 19 / react-jsx transform namespace
declare namespace React {
  namespace JSX {
    interface IntrinsicElements {
      // Buttons
      'md-filled-button': _MdEl & { disabled?: boolean; href?: string; target?: string; trailing?: boolean }
      'md-outlined-button': _MdEl & { disabled?: boolean; href?: string }
      'md-text-button': _MdEl & { disabled?: boolean; href?: string }
      'md-tonal-button': _MdEl & { disabled?: boolean }
      'md-filled-tonal-button': _MdEl & { disabled?: boolean }
      'md-icon-button': _MdEl & { disabled?: boolean; toggle?: boolean; selected?: boolean; href?: string }
      'md-filled-icon-button': _MdEl & { disabled?: boolean }
      'md-outlined-icon-button': _MdEl & { disabled?: boolean; toggle?: boolean; selected?: boolean }
      'md-tonal-icon-button': _MdEl & { disabled?: boolean }

      // FAB
      'md-fab': _MdEl & {
        label?: string
        size?: 'small' | 'medium' | 'large'
        variant?: 'surface' | 'primary' | 'secondary' | 'tertiary'
        lowered?: boolean
      }

      // Icon
      'md-icon': _MdEl

      // Text fields
      'md-filled-text-field': _MdEl & {
        label?: string; value?: string; type?: string; placeholder?: string
        disabled?: boolean; error?: boolean; 'error-text'?: string
        'supporting-text'?: string; 'trailing-icon'?: boolean; 'leading-icon'?: boolean
        required?: boolean; readonly?: boolean; rows?: number
      }
      'md-outlined-text-field': _MdEl & {
        label?: string; value?: string; type?: string; placeholder?: string
        disabled?: boolean; error?: boolean; 'error-text'?: string
        'supporting-text'?: string; required?: boolean; readonly?: boolean
      }

      // Select
      'md-filled-select': _MdEl & { label?: string; disabled?: boolean; required?: boolean; value?: string }
      'md-outlined-select': _MdEl & { label?: string; disabled?: boolean; required?: boolean; value?: string }
      'md-select-option': _MdEl & { value?: string; selected?: boolean; disabled?: boolean }

      // Checkbox
      'md-checkbox': _MdEl & { checked?: boolean; indeterminate?: boolean; disabled?: boolean; value?: string; name?: string }

      // Radio
      'md-radio': _MdEl & { checked?: boolean; disabled?: boolean; value?: string; name?: string }

      // Switch
      'md-switch': _MdEl & { selected?: boolean; disabled?: boolean; icons?: boolean; 'show-only-selected-icon'?: boolean }

      // Slider
      'md-slider': _MdEl & { min?: number; max?: number; value?: number; step?: number; disabled?: boolean; labeled?: boolean; oninput?: (e: Event) => void }

      // Progress
      'md-linear-progress': _MdEl & { value?: number; max?: number; buffer?: number; indeterminate?: boolean }
      'md-circular-progress': _MdEl & { value?: number; max?: number; indeterminate?: boolean }

      // Dialog
      'md-dialog': _MdEl & {
        open?: boolean; quick?: boolean
        onclosed?: (e: Event) => void; onopened?: (e: Event) => void; onclose?: (e: Event) => void
      }

      // Divider
      'md-divider': _MdEl & { inset?: boolean; 'inset-start'?: boolean; 'inset-end'?: boolean }

      // List
      'md-list': _MdEl
      'md-list-item': _MdEl & {
        disabled?: boolean; type?: 'text' | 'button' | 'link'; href?: string; target?: string
        'supporting-text'?: string; 'multi-line-supporting-text'?: boolean; 'trailing-supporting-text'?: string
      }

      // Chips
      'md-chip-set': _MdEl
      'md-filter-chip': _MdEl & { label?: string; selected?: boolean; disabled?: boolean; elevated?: boolean; removable?: boolean }
      'md-assist-chip': _MdEl & { label?: string; disabled?: boolean; elevated?: boolean; href?: string }
      'md-suggestion-chip': _MdEl & { label?: string; disabled?: boolean; elevated?: boolean }
      'md-input-chip': _MdEl & { label?: string; disabled?: boolean; avatar?: boolean; href?: string; removable?: boolean }

      // Tabs
      'md-tabs': _MdEl & { 'active-tab-index'?: number; onchange?: (e: Event) => void }
      'md-primary-tab': _MdEl & { 'inline-icon'?: boolean; active?: boolean }
      'md-secondary-tab': _MdEl & { active?: boolean }

      // Menu
      'md-menu': _MdEl & {
        anchor?: string; open?: boolean | undefined; positioning?: string
        onclosed?: (e: Event) => void; onopened?: (e: Event) => void
      }
      'md-menu-item': _MdEl & {
        disabled?: boolean; type?: 'menuitem' | 'option' | 'button' | 'link'
        href?: string; target?: string; 'keep-open'?: boolean
      }
      'md-sub-menu': _MdEl

      // Badge
      'md-badge': _MdEl & { value?: string }

      // Ripple / Focus ring / Elevation
      'md-ripple': _MdEl & { disabled?: boolean }
      'md-focus-ring': _MdEl & { visible?: boolean }
      'md-elevation': _MdEl

      // Cards (labs)
      'md-elevated-card': _MdEl
      'md-filled-card': _MdEl
      'md-outlined-card': _MdEl

      // Segmented button (labs)
      'md-segmented-button-set': _MdEl
      'md-segmented-button': _MdEl & { label?: string; selected?: boolean; disabled?: boolean }

      // Navigation bar / tab / drawer (labs)
      'md-navigation-bar': _MdEl & { 'active-index'?: number; onchange?: (e: Event) => void }
      'md-navigation-tab': _MdEl & { label?: string; active?: boolean; 'badge-value'?: string; 'show-badge'?: boolean }
      'md-navigation-drawer': _MdEl & { opened?: boolean; pivot?: 'start' | 'end' }
    }
  }
}
