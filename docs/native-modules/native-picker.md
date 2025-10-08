# Native Picker Element — Rich Selection Controls for LynxJS

Why this module

HTML select and web-based pickers often provide sub-par UX on mobile. A native picker element ensures consistent behavior, accessibility, and platform look-and-feel for dropdowns, date/time selectors, multi-select, and cascading pickers.

Design goals

- Standalone element that can be inserted into LynxJS views like any other element
- Declarative API that maps to native pickers (Android Spinner, DatePickerDialog, iOS UIPickerView/UIDatePicker)
- Work seamlessly with LynxJS dual-threading model and be usable from worker threads
- Provide customization hooks and styling tokens that map to native themes

Capabilities

- Dropdown / Spinner picker with single-select
- Date and time pickers with locale and min/max support
- Multi-selection picker with checkboxes
- Cascading (dependent) pickers (e.g., Country -> State -> City)
- Keyboard/Accessibility support and content descriptions
- Custom styling: text size, colors, icons, and modal presentation styles

TypeScript interface

export type PickerOption = { label: string; value: string; meta?: any };

export interface INativePickerElementProps {
mode?: 'dropdown' | 'modal' | 'compact';
options?: PickerOption[];
selectedValue?: string | string[]; // single string for single-select, string[] for multi
multiple?: boolean;
disabled?: boolean;
placeholder?: string;
// For date/time
date?: string; // ISO date
minDate?: string;
maxDate?: string;
time?: string; // ISO time or full datetime
// Callbacks
onChange?: (value: string | string[], option?: PickerOption) => void;
onOpen?: () => void;
onClose?: () => void;
// Styling
style?: { fontSize?: number; color?: string; backgroundColor?: string };
}

Element usage (JSX-like)

<NativePicker
mode="modal"
options={[{label: 'Apple', value: 'apple'}, {label: 'Banana', value: 'banana'}]}
selectedValue={'apple'}
onChange={(v) => console.log('picked', v)}
/>

Programmatic API (LynxJS module)

export interface INativePickerModule {
open(options: { options: PickerOption[]; multiple?: boolean; selected?: string[]; title?: string; anchorId?: string }): Promise<string[] | string | null>;
close(): Promise<void>;
}

Integration notes

- Android: use Spinner for inline dropdowns and MaterialDatePicker / MaterialTimePicker (from Material Components) for date/time. For modal multi-select, use AlertDialog with RecyclerView.
- iOS: use UIPickerView for lists and UIDatePicker for date/time. For modal multi-select use a UITableView inside a modal presentation.
- Accessibility: ensure each option has an accessibilityLabel and supports VoiceOver/TalkBack navigation.
- Styling: map platform tokens (accentColor, textAppearance) and allow a style object to set a few basic tokens. For deeper theme changes, provide native theme overrides.

Edge cases

- Very large option lists: support incremental loading and a searchable option mode that launches a searchable modal
- Dynamic options: allow an optionsChange event to update the current options without closing the picker
- Timezones and localizations: date/time pickers should respect device locale and timezone. Also provide an option to force UTC.

Testing

- Snapshot tests for the TypeScript wrapper
- Android instrumentation for date/time constraints and cascading pickers
- iOS XCTest for UIPickerView delegate/dataSource correctness

Next: I'll create the File System module doc.  
(Updating todo list: native picker completed, moving to file system.)
