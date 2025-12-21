# Sync Debugging Steps

## Check What's Syncing

1. Open browser console (F12)
2. Run these commands:

```javascript
// Check localStorage
console.log('Tasks:', localStorage.getItem('neurulae-tasks'));
console.log('Playbooks:', localStorage.getItem('neurulae-playbooks'));
console.log('CustomTheme:', localStorage.getItem('neurulae-customTheme'));

// Check if user is logged in
console.log('User:', await supabase.auth.getUser());

// Check sync service
console.log('Sync check...');
```

## If Syncing is Completely Broken

The customTheme change might have broken something. To rollback:

1. Revert the customTheme sync change:
   - Remove `useSyncedStorage` for customTheme
   - Go back to `useLocalStorage` only

## Manual Fix for CustomTheme Syncing

If only customTheme isn't syncing, that's expected - it needs the database to have the data type registered.

Ask Lovable to:
"Add 'customTheme' to the allowed data_type_enum in the user_data table"
