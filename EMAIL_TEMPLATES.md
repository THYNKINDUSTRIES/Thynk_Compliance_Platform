# Email Templates Documentation

## Overview
Thynk.guru uses HTML email templates for digest notifications. Templates are responsive and branded.

## Template Structure

### Daily/Weekly Digest Template
Located in: `src/lib/emailTemplates.ts`

**Key Features:**
- Responsive design (mobile-friendly)
- Branded header with Thynk.guru colors
- Regulation cards with color-coded criticality
- Unsubscribe link
- Call-to-action buttons

### Template Variables
```typescript
interface DigestEmailData {
  userName: string;
  regulations: Array<{
    title: string;
    jurisdiction: string;
    effectiveDate: string;
    summary: string;
    url: string;
    criticality: 'high' | 'medium' | 'low';
  }>;
  frequency: 'daily' | 'weekly';
  unsubscribeUrl: string;
}
```

## Customization

### Colors
- Primary: `#794108` (brown)
- Background: `#FAF8F5` (cream)
- Accent: `#F5DFC6` (light tan)
- High Priority: `#DC2626` (red)
- Medium Priority: `#F59E0B` (orange)
- Low Priority: `#10B981` (green)

### Email Providers
Currently configured for **Resend** API.

To use a different provider:
1. Update edge function to use new API
2. Adjust authentication headers
3. Update environment variables

### Testing Templates
Use the DigestTestButton component in Settings to send test emails.

## Best Practices

1. **Keep HTML Simple**: Email clients have limited CSS support
2. **Use Tables**: For layout structure (better email client support)
3. **Inline Styles**: Most email clients strip `<style>` tags
4. **Alt Text**: Always include for images
5. **Plain Text**: Consider adding plain text version
6. **Test Across Clients**: Gmail, Outlook, Apple Mail, etc.

## Unsubscribe Management
Unsubscribe links point to: `/unsubscribe?token={profile_id}`

The Unsubscribe page handles:
- Token validation
- Profile deactivation
- Confirmation message
