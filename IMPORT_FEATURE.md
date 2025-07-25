# Enhanced Import Feature

The dashboard import feature has been enhanced to support multiple import formats, including single list imports.

## Supported Import Formats

### 1. Single List Object
Import a single shopping list directly:
```json
{
  "name": "My Shopping List",
  "description": "A single shopping list",
  "items": [
    {
      "id": "item1",
      "name": "Milk",
      "quantity": 1,
      "is_checked": false
    }
  ]
}
```

### 2. Multiple Lists Array
Import multiple shopping lists (original format):
```json
{
  "lists": [
    {
      "name": "List 1",
      "description": "First list",
      "items": [...]
    },
    {
      "name": "List 2", 
      "description": "Second list",
      "items": [...]
    }
  ]
}
```

### 3. Wrapped Single List
Import a single list wrapped in a "list" object:
```json
{
  "list": {
    "name": "Wrapped List",
    "description": "A single list",
    "items": [...]
  }
}
```

### 4. Direct Array
Import an array of shopping lists directly:
```json
[
  {
    "name": "Array List 1",
    "description": "First list in array",
    "items": [...]
  },
  {
    "name": "Array List 2",
    "description": "Second list in array", 
    "items": [...]
  }
]
```

## How to Use

1. Navigate to the Dashboard
2. Click the "Import Lists" button
3. Select a JSON file with one of the supported formats
4. Click "Import Lists" to import the data

## Test Files

The following test files are provided to demonstrate each format:
- `test_single_list.json` - Single list object format
- `test_multiple_lists.json` - Multiple lists array format  
- `test_wrapped_list.json` - Wrapped single list format
- `test_direct_array.json` - Direct array format

## Implementation Details

The import logic now checks for multiple data structures:
1. Direct list object with `name` property
2. Object with `lists` array
3. Object with `list` property containing a single list
4. Direct array of list objects

This provides maximum flexibility for importing shopping lists from various sources and formats.