# AI Auto-Populate Feature

## Overview
The AI Auto-Populate feature intelligently fills in item details (amount, unit, category, notes) when users type item names in the add item form. This feature uses Google Gemini AI to analyze the item name and suggest appropriate default values.

## Features

### Core Functionality
- **Smart Auto-Population**: Automatically fills amount, unit, category, and notes based on item name
- **Debounced API Calls**: 1-second delay to avoid excessive API requests
- **Fallback Logic**: Uses local fallback when AI is unavailable
- **Visual Feedback**: Shows loading spinner during auto-population
- **User Control**: Enable/disable via settings page

### User Experience
- **Seamless Integration**: Works within existing add item form
- **Non-Intrusive**: Silently fails if AI is unavailable
- **Visual Indicators**: Shows when feature is enabled and active
- **Minimum Length**: Only triggers for item names with 3+ characters

## Technical Implementation

### Database Schema
```sql
-- Add to profiles table
ALTER TABLE profiles 
ADD COLUMN ai_auto_populate_enabled BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN profiles.ai_auto_populate_enabled IS 'Whether AI auto-populate feature is enabled for this user';
```

### New Files Created
1. `src/lib/ai/auto-populate.ts` - AI auto-populate logic
2. `sql/07_add_ai_auto_populate_toggle.sql` - Database migration

### Modified Files
1. `src/lib/supabase/types.ts` - Updated Profile type
2. `src/app/settings/page.tsx` - Added toggle in AI settings
3. `src/app/list/[listId]/page.tsx` - Integrated auto-populate functionality

## AI Implementation

### Auto-Populate Function
```typescript
export async function autoPopulateItemDetails(
  itemName: string,
  apiKey: string
): Promise<AutoPopulateResponse>
```

### AI Prompt
The AI is prompted to analyze item names and return:
- **amount**: Suggested quantity (default: 1)
- **unit**: Appropriate unit (pcs, kg, L, etc.)
- **category**: Logical category (Produce, Dairy, Meat, etc.)
- **notes**: Helpful notes about the item

### Fallback Logic
When AI fails, the system uses local fallback logic:
- Basic unit detection (milk → L, bananas → bunch, etc.)
- Simple category mapping
- Default values for common items

## User Interface

### Settings Page
- New toggle in AI Settings section
- Clear description of functionality
- Demo mode support

### Add Item Form
- Auto-populate trigger on item name input
- Loading spinner during processing
- Info text when feature is enabled
- Non-blocking operation

## Configuration

### Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL` - Required
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Required
- User's Gemini API key - Required for AI functionality

### Feature Toggle
- Controlled via `ai_auto_populate_enabled` in user profile
- Default: `false`
- Can be changed in settings page

## Usage Examples

### Example 1: Basic Item
**Input**: "milk"
**Output**: 
- amount: 1
- unit: L
- category: Dairy
- notes: "Consider organic or preferred brand"

### Example 2: Specific Item
**Input**: "chicken breast"
**Output**:
- amount: 1
- unit: lb
- category: Meat
- notes: "Check for best before date"

### Example 3: Produce Item
**Input**: "bananas"
**Output**:
- amount: 1
- unit: bunch
- category: Produce
- notes: "Choose ripe bananas"

## Error Handling

### AI Failures
- Silent fallback to local logic
- No error toasts for auto-populate
- Graceful degradation

### Network Issues
- Timeout handling
- Retry logic not implemented (keeps it simple)
- Fallback to local detection

### Invalid Responses
- JSON parsing error handling
- Validation of AI responses
- Fallback to safe defaults

## Performance Considerations

### API Rate Limiting
- 1-second debounce on input
- Minimum 3-character trigger
- Single API call per item name

### Caching
- No caching implemented (keeps it simple)
- Each input triggers fresh AI analysis
- Future enhancement: cache common items

## Security

### API Key Management
- Uses user's personal Gemini API key
- Encrypted storage in database
- No server-side key storage

### Input Validation
- Sanitizes item names
- Validates AI responses
- Prevents injection attacks

## Testing

### Manual Testing
1. Enable feature in settings
2. Type item names in add form
3. Verify auto-population works
4. Test with various item types
5. Verify fallback behavior

### Edge Cases
- Very short item names (< 3 chars)
- Special characters in names
- Network failures
- Invalid API responses

## Future Enhancements

### Potential Improvements
1. **Caching**: Cache common items for faster response
2. **Learning**: Learn from user corrections
3. **Batch Processing**: Handle multiple items at once
4. **Custom Categories**: User-defined categories
5. **Smart Suggestions**: Based on shopping history

### Advanced Features
1. **Image Recognition**: Auto-populate from item photos
2. **Barcode Scanning**: Lookup item details
3. **Voice Input**: Combine with voice recognition
4. **Smart Units**: Context-aware unit suggestions

## Troubleshooting

### Common Issues
1. **Feature not working**: Check if enabled in settings
2. **No auto-population**: Verify API key is set
3. **Slow response**: Check network connection
4. **Wrong suggestions**: AI may need better prompting

### Debug Steps
1. Check browser console for errors
2. Verify API key is valid
3. Test with simple item names
4. Check network tab for API calls

## Database Migration

### Manual Setup
If automatic migration fails, run manually:

```sql
-- Connect to your Supabase database
-- Run the following SQL:

ALTER TABLE profiles 
ADD COLUMN ai_auto_populate_enabled BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN profiles.ai_auto_populate_enabled IS 'Whether AI auto-populate feature is enabled for this user';
```

### Verification
```sql
-- Check if column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name = 'ai_auto_populate_enabled';
```

## Conclusion

The AI Auto-Populate feature enhances the user experience by intelligently filling in item details, reducing manual input and improving accuracy. The implementation is robust with proper error handling, fallback logic, and user control over the feature. 