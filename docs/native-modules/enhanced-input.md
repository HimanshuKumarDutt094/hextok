# Enhanced Input Element — Rich Text and Advanced Input Controls

Why this module

Modern mobile apps need more than simple text fields. Rich editors, OTP controls, auto-complete, and input validation are essential for polished UX. An Enhanced Input element provides these features natively for better performance and consistency.

Design goals

- Standalone element usable like any other LynxJS element
- Support complex input behaviors while exposing a simple declarative API
- Background-thread compatible for validation and suggestion lookups
- Lightweight rich-text (formatting, lists, links) and extendable plugin architecture

Capabilities

- Rich text editing with inline formatting (bold, italic, underline), lists, and links
- Auto-complete and suggestion popovers (local and remote sources)
- Input validation with custom rule functions and visual feedback
- Password strength indicator with rules and entropy estimate
- OTP/PIN input fields with auto-fill and paste handling
- Floating labels and Material design variants

TypeScript interface (element props)

export interface IEnhancedInputProps {
value?: string;
placeholder?: string;
multiline?: boolean;
rich?: boolean; // enable rich text features
suggestions?: { source: 'local'|'remote'; fetcher?: string }; // fetcher is callback id
validators?: Array<{ id?: string; validate: (value: string) => boolean | Promise<boolean>; message?: string }>;
password?: boolean;
passwordRules?: { minLength?: number; requireNumbers?: boolean; requireSpecial?: boolean };
otp?: { length: number; autoFill?: boolean; mask?: boolean };
onChange?: (value: string) => void;
onSubmit?: (value: string) => void;
onFocus?: () => void;
onBlur?: () => void;
style?: { fontSize?: number; color?: string };
}

Rich text API (module-level)

export interface IEnhancedInputModule {
// Convert HTML/Delta to native representation and back
toHtml(handle: string): Promise<string>;
fromHtml(handle: string, html: string): Promise<void>;
// Formatting commands
format(handle: string, range: {start:number;end:number}, command: { type: 'bold'|'italic'|'underline'|'link'|'list'; payload?: any}): Promise<void>;
}

Usage examples

// OTP control
<EnhancedInput otp={{length: 6, autoFill: true}} onChange={(v)=>{ /_ ... _/ }} />

// Rich editor
<EnhancedInput rich multiline value={content} onChange={setContent} />

Integration notes

- Android: use EditText/TextInputLayout for simple inputs; for rich text consider a lightweight editor like Markwon or build on WebView if advanced formatting is necessary (but try to keep native for performance). Use InputMethodManager for keyboard handling and Autofill Framework for OTP.
- iOS: use UITextView/UITextField with accessory views for formatting toolbars; use UITextInput for advanced selection and attributed strings for rich text.
- Auto-complete/suggestions: provide a mechanism to register a callback id that the native element will call with the current query; the registered JS callback returns suggestion items which native will show.
- Validation: support sync and async validators; show inline error messages and allow custom error templates.

Edge cases

- Large rich content: paginate or limit history to avoid memory blowup
- Copy/paste: sanitize pasted HTML or rich content to allowed formats
- Keyboard types and IME: ensure proper inputType mapping for numeric, email, phone, etc.

Testing

- Unit tests for validator functions and suggestion adapter
- Android instrumentation for IME behaviors and OTP autofill
- iOS XCTest for attributed string roundtrips and paste behaviors

Security

- Sanitize any HTML passed into the rich editor to avoid injecting unsafe content
- For password fields, never log values and prefer secure text entry methods

Next: I'll create `docs/native-modules/README.md` that indexes all five modules and provides install/use quickstart.  
(Updating todo list: enhanced input completed, moving to README.)
