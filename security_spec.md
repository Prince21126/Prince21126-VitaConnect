# Security Specification - VitaConnect

## Data Invariants
1. A Diagnostic must be linked to a valid Village and Prediction type.
2. An Alert can only be created by the system (or designated coordinator).
3. Diagnostic data is clinical and must be strictly validated for types and sizes.

## The Dirty Dozen Payloads
1. **Shadow Field Attack**: Adding `isVerified: true` to a Diagnostic.
2. **Identity Spoofing**: Setting `patientId` to another user's ID during create.
3. **Resource Poisoning**: Sending a 1MB string in `rawInput`.
4. **State Shortcutting**: Manually setting an `Alert` to `active: false` from the client.
5. **Orphaned Writes**: Creating a Diagnostic for a non-existent Patient.
6. **Timeline Fraud**: Setting `timestamp` to a future date.
7. **Cross-Village Leak**: Listing all diagnostics without village filtering (if restricted).
8. **Malicious ID Injection**: Using `/diagnostics/../../../..` style IDs.
9. **Type Confusion**: Sending `probability` as a string.
10. **Urgency Manipulation**: Setting `urgency: "SUPER_RED"`.
11. **Mass Delete**: Attempting to delete the `alerts` collection.
12. **PII Leakage**: Reading full patient profiles without proper auth.

## Proposed Rules Logic
- `isValidId(id)`: Enforces size <= 128 and regex.
- `isValidDiagnostic(data)`: Enforces exact keys for create and strict types.
- `isAdmin()`: Check if user is in `/admins/$(auth.uid)`.
- `isOwner(userId)`: `auth.uid == userId`.

## Test Runner (Logic Check)
- `create /patients`: Should fail if `fullName` is missing or > 100 chars.
- `create /diagnostics`: Should fail if `probability` > 1 or `prediction` is not a string.
