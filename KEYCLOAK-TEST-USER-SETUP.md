# Keycloak Test User Setup Guide

This guide provides step-by-step instructions for creating test users in Keycloak for E2E testing of the Lumina authentication flow.

## Prerequisites

- Keycloak running on http://localhost:8086
- Access to Keycloak admin console
- Lumina realm already created and configured

## Accessing Keycloak Admin Console

1. Navigate to http://localhost:8086
2. Click "Administration Console"
3. Log in with admin credentials

## Creating a Test User

### Method 1: Using Keycloak Admin Console (GUI)

1. **Navigate to Users:**
   - In the left sidebar, select the "lumina" realm (top left dropdown)
   - Click "Users" in the left navigation menu
   - Click "Add user" button

2. **Fill User Information:**
   ```
   Username: test-user@lumina.com
   Email: test-user@lumina.com
   First Name: Test
   Last Name: User
   Email Verified: ON (toggle to enabled)
   Enabled: ON (toggle to enabled)
   ```

3. **Save User:**
   - Click "Create" button

4. **Set Password:**
   - After user creation, go to "Credentials" tab
   - Click "Set password"
   - Enter password: `Test123!@#`
   - Set "Temporary" to OFF (toggle to disabled)
   - Click "Save"
   - Confirm by clicking "Save password"

5. **Verify User:**
   - Go back to "Details" tab
   - Ensure "Email Verified" is ON
   - Ensure "Enabled" is ON

### Method 2: Using Keycloak Admin CLI (kcadm.sh)

```bash
# Navigate to Keycloak bin directory
cd /path/to/keycloak/bin

# Login to admin console
./kcadm.sh config credentials --server http://localhost:8086 --realm master --user admin

# Create user
./kcadm.sh create users -r lumina \
  -s username=test-user@lumina.com \
  -s email=test-user@lumina.com \
  -s firstName=Test \
  -s lastName=User \
  -s emailVerified=true \
  -s enabled=true

# Get user ID
USER_ID=$(./kcadm.sh get users -r lumina -q username=test-user@lumina.com --fields id --format csv --noquotes)

# Set password
./kcadm.sh set-password -r lumina --username test-user@lumina.com --new-password Test123!@# --temporary false
```

### Method 3: Using Keycloak REST API

```bash
# Get admin access token
ACCESS_TOKEN=$(curl -X POST http://localhost:8086/realms/master/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin" \
  -d "password=<admin-password>" \
  -d "grant_type=password" \
  -d "client_id=admin-cli" \
  | jq -r '.access_token')

# Create user
curl -X POST http://localhost:8086/admin/realms/lumina/users \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test-user@lumina.com",
    "email": "test-user@lumina.com",
    "firstName": "Test",
    "lastName": "User",
    "emailVerified": true,
    "enabled": true,
    "credentials": [{
      "type": "password",
      "value": "Test123!@#",
      "temporary": false
    }]
  }'
```

## Recommended Test Users

For comprehensive testing, create the following test users:

### 1. Standard Test User
- **Username:** test-user@lumina.com
- **Password:** Test123!@#
- **Purpose:** General authentication testing
- **Email Verified:** Yes
- **Enabled:** Yes

### 2. Onboarding Test User
- **Username:** onboarding-test@lumina.com
- **Password:** Onboard123!@#
- **Purpose:** Testing first-time user onboarding flow
- **Email Verified:** Yes
- **Enabled:** Yes
- **Note:** Should not have completed onboarding

### 3. Existing User (With Profile)
- **Username:** existing-user@lumina.com
- **Password:** Existing123!@#
- **Purpose:** Testing existing user login (skip onboarding)
- **Email Verified:** Yes
- **Enabled:** Yes
- **Note:** Should have completed profile setup

### 4. Admin Test User
- **Username:** admin-test@lumina.com
- **Password:** Admin123!@#
- **Purpose:** Testing admin/elevated permissions
- **Email Verified:** Yes
- **Enabled:** Yes
- **Roles:** Add admin roles as needed

## Verifying Test User Creation

After creating test users, verify they work correctly:

```bash
# Test authentication with curl
curl -X POST http://localhost:8086/realms/lumina/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=test-user@lumina.com" \
  -d "password=Test123!@#" \
  -d "grant_type=password" \
  -d "client_id=lumina-client"
```

If successful, you should receive an access token in the response.

## Using Test Users in E2E Tests

Update the test credentials in the Playwright test file:

```typescript
// /apps/e2e/playwright/oidc-keycloak-auth.spec.ts

const testCredentials = [
  { username: 'test-user@lumina.com', password: 'Test123!@#' },
  { username: 'onboarding-test@lumina.com', password: 'Onboard123!@#' },
  { username: 'existing-user@lumina.com', password: 'Existing123!@#' },
];
```

## Troubleshooting

### Issue: "Email Not Verified" Error

**Solution:**
1. Go to Keycloak Admin Console
2. Navigate to Users > [Select User] > Details
3. Toggle "Email Verified" to ON
4. Click "Save"

### Issue: "Account Disabled" Error

**Solution:**
1. Go to Keycloak Admin Console
2. Navigate to Users > [Select User] > Details
3. Toggle "Enabled" to ON
4. Click "Save"

### Issue: "Invalid Username or Password"

**Solution:**
1. Verify credentials are correct
2. Reset password in Keycloak:
   - Users > [Select User] > Credentials
   - Click "Reset password"
   - Enter new password
   - Set "Temporary" to OFF
   - Save

### Issue: "User Not Found"

**Solution:**
1. Verify user exists in correct realm (lumina)
2. Check username spelling (case-sensitive)
3. Recreate user if necessary

## Security Notes

- Test credentials should NEVER be used in production
- Change all test passwords before deploying to production
- Use environment variables for test credentials
- Regularly rotate test user passwords
- Delete test users from production environments

## Cleanup

To delete test users after testing:

```bash
# Using Keycloak Admin Console:
# 1. Go to Users
# 2. Select user
# 3. Click "Delete"
# 4. Confirm deletion

# Using CLI:
./kcadm.sh delete users/<USER_ID> -r lumina
```

## Next Steps

After creating test users:

1. Update E2E test configuration with credentials
2. Run full authentication test suite
3. Verify all authentication flows work correctly
4. Test onboarding flows with new users
5. Test existing user login flows

## Resources

- [Keycloak Admin REST API Documentation](https://www.keycloak.org/docs-api/latest/rest-api/)
- [Keycloak Admin CLI Documentation](https://www.keycloak.org/docs/latest/server_admin/#the-admin-cli)
- Lumina OIDC Test Report: `/apps/e2e/OIDC-KEYCLOAK-TEST-REPORT.md`

---

**Last Updated:** October 27, 2025
**Maintained By:** Lumina QA Team
