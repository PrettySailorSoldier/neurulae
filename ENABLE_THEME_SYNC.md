# Steps to Enable Custom Theme Syncing

## 1. Tell Lovable:
"Add 'customTheme' to the data_type_enum in the database so custom themes can sync across devices"

## 2. After Lovable confirms, tell me:
"The database is updated, enable theme syncing"

## 3. I'll update the code to:
- Change from `useLocalStorage` back to `useSyncedStorage` for customTheme
- Re-enable cloud sync for themes
- Update the toast message

## What This Will Fix:
✅ Custom themes will sync across all devices
✅ No more losing custom themes when switching devices
✅ Seamless experience like tasks and playbooks
