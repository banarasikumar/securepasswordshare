# Design Guidelines for Password Sharing Web App

## Design Approach: Design System-Based (Utility-Focused)
**Selected System**: Material Design with security-focused customizations
**Justification**: Password management requires trust, clarity, and accessibility. Users need to feel confident about security while efficiently sharing sensitive information.

## Core Design Elements

### Color Palette
**Dark Mode Primary** (preferred for security context):
- Background: 220 15% 8%
- Surface: 220 15% 12% 
- Primary: 220 90% 65% (trust-inspiring blue)
- Secondary: 140 60% 55% (success green for secure actions)
- Accent: 25 85% 60% (warning orange for alerts)
- Text Primary: 0 0% 95%
- Text Secondary: 0 0% 70%

**Light Mode**:
- Background: 0 0% 98%
- Surface: 0 0% 100%
- Primary: 220 90% 50%
- Text Primary: 0 0% 15%

### Typography
**Font Families**: Inter (primary), JetBrains Mono (passwords/codes)
**Hierarchy**:
- Headers: 600 weight, 24-32px
- Body: 400 weight, 16px
- Passwords/Codes: JetBrains Mono, 14px
- Labels: 500 weight, 14px

### Layout System
**Spacing Units**: Tailwind 2, 4, 6, 8, 12, 16
**Grid**: Centered max-width containers with responsive breakpoints
**Focus**: Clean, card-based layouts with generous whitespace

### Component Library

**Navigation**:
- Minimal top bar with logo and user actions
- Subtle borders, no heavy shadows

**Forms**:
- Input fields with clear labels and validation states
- Password visibility toggles with eye icons
- Secure copy buttons with clipboard feedback
- Expiration time selectors with clear visual hierarchy

**Data Display**:
- Card-based password entries with metadata
- Status indicators (active/expired/viewed)
- Secure sharing links with QR code generation
- Activity logs with timestamp formatting

**Security Elements**:
- Password strength indicators (progress bars)
- Encryption status badges
- Auto-delete countdown timers
- Security warnings with appropriate color coding

**Overlays**:
- Modal dialogs for sensitive actions
- Toast notifications for copy/share confirmations
- Loading states for encryption operations

### Accessibility & Security UX
- High contrast ratios for all text
- Clear focus indicators
- Screen reader friendly labels
- Secure form autofill prevention
- Visual feedback for all security actions

### Images
**Logo/Branding**: Minimalist lock or shield icon in header
**Security Illustrations**: Simple, geometric icons for features (no large hero images)
**QR Codes**: Generated dynamically for sharing links
**Status Icons**: Material Design security and sharing icons

The design prioritizes trustworthiness through clean aesthetics, clear information hierarchy, and consistent security-focused interactions.