/**
 * JSX type declarations for @material/web custom elements.
 * Placed in app/ to ensure it is always included in the Vercel build.
 */

type _MdEl = React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
  slot?: string
  class?: string
  'aria-label'?: string
  'aria-expanded'?: string | boolean
  'aria-disabled'?: string | boolean
  'aria-selected'?: string | boolean
  'aria-controls'?: string
  'aria-haspopup'?: string | boolean
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

declare global {
  namespace JSX {
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
      'md-dialog': _MdEl & { open?: boolean; quick?: boolean }
      'md-divider': _MdEl & { inset?: boolean; 'inset-start'?: boolean; 'inset-end'?: boolean }
      'md-list': _MdEl
      'md-list-item': _MdEl & { disabled?: boolean; type?: 'text' | 'button' | 'link'; href?: string; target?: string; 'supporting-text'?: string; 'multi-line-supporting-text'?: boolean; 'trailing-supporting-text'?: string }
      'md-chip-set': _MdEl
      'md-filter-chip': _MdEl & { label?: string; selected?: boolean; disabled?: boolean; elevated?: boolean; removable?: boolean }
      'md-assist-chip': _MdEl & { label?: string; disabled?: boolean; elevated?: boolean; href?: string }
      'md-suggestion-chip': _MdEl & { label?: string; disabled?: boolean; elevated?: boolean }
      'md-input-chip': _MdEl & { label?: string; disabled?: boolean; avatar?: boolean; href?: string; removable?: boolean }
      'md-tabs': _MdEl & { 'active-tab-index'?: number }
      'md-primary-tab': _MdEl & { 'inline-icon'?: boolean; active?: boolean }
      'md-secondary-tab': _MdEl & { active?: boolean }
      'md-menu': _MdEl & { anchor?: string; open?: boolean; positioning?: string }
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
      'md-navigation-bar': _MdEl & { 'active-index'?: number }
      'md-navigation-tab': _MdEl & { label?: string; active?: boolean; 'badge-value'?: string; 'show-badge'?: boolean }
      'md-navigation-drawer': _MdEl & { opened?: boolean; pivot?: 'start' | 'end' }
    }
  }

  namespace React {
    namespace JSX {
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
        'md-dialog': _MdEl & { open?: boolean; quick?: boolean }
        'md-divider': _MdEl & { inset?: boolean; 'inset-start'?: boolean; 'inset-end'?: boolean }
        'md-list': _MdEl
        'md-list-item': _MdEl & { disabled?: boolean; type?: 'text' | 'button' | 'link'; href?: string; target?: string; 'supporting-text'?: string; 'multi-line-supporting-text'?: boolean; 'trailing-supporting-text'?: string }
        'md-chip-set': _MdEl
        'md-filter-chip': _MdEl & { label?: string; selected?: boolean; disabled?: boolean; elevated?: boolean; removable?: boolean }
        'md-assist-chip': _MdEl & { label?: string; disabled?: boolean; elevated?: boolean; href?: string }
        'md-suggestion-chip': _MdEl & { label?: string; disabled?: boolean; elevated?: boolean }
        'md-input-chip': _MdEl & { label?: string; disabled?: boolean; avatar?: boolean; href?: string; removable?: boolean }
        'md-tabs': _MdEl & { 'active-tab-index'?: number }
        'md-primary-tab': _MdEl & { 'inline-icon'?: boolean; active?: boolean }
        'md-secondary-tab': _MdEl & { active?: boolean }
        'md-menu': _MdEl & { anchor?: string; open?: boolean; positioning?: string }
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
        'md-navigation-bar': _MdEl & { 'active-index'?: number }
        'md-navigation-tab': _MdEl & { label?: string; active?: boolean; 'badge-value'?: string; 'show-badge'?: boolean }
        'md-navigation-drawer': _MdEl & { opened?: boolean; pivot?: 'start' | 'end' }
      }
    }
  }
}
