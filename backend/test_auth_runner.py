import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from core.models import UserProfile
from django.test import Client
import json

print("==================================================")
print(" IT ASSET MANAGEMENT - AUTH & REGISTRATION SUITE ")
print("==================================================")

client = Client()

# ----------------------------------------------------
# 1. POSITIVE LOGIN TESTS
# ----------------------------------------------------
print("\n--- 1. Positive Login Tests ---")

# 1.1 Admin Login
res = client.post('/api/auth/login/', data=json.dumps({
    'email': 'admin@harvest.edu',
    'password': 'Admin123!'
}), content_type='application/json')
assert res.status_code == 200, f"Expected 200, got {res.status_code}"
admin_data = res.json()['user']
print(f" [PASS] Admin Login: {admin_data['name']} (Role: {admin_data['role']}, isAdmin: {admin_data['isAdmin']})")

# 1.2 Staff Login
staff_client = Client()
res = staff_client.post('/api/auth/login/', data=json.dumps({
    'email': 'sarah.jenkins@harvest.edu',
    'password': 'Staff123!'
}), content_type='application/json')
assert res.status_code == 200, f"Expected 200, got {res.status_code}"
staff_data = res.json()['user']
print(f" [PASS] Staff Login: {staff_data['name']} (Role: {staff_data['role']}, isStaff: {staff_data['isStaff']})")

# ----------------------------------------------------
# 2. NEGATIVE LOGIN TESTS
# ----------------------------------------------------
print("\n--- 2. Negative Login Tests ---")

# 2.1 Wrong password
res = Client().post('/api/auth/login/', data=json.dumps({
    'email': 'admin@harvest.edu',
    'password': 'WrongPassword999!'
}), content_type='application/json')
assert res.status_code == 401, f"Expected 401, got {res.status_code}"
print(f" [PASS] Wrong password rejected (401): {res.json().get('error')}")

# 2.2 Non-existent user
res = Client().post('/api/auth/login/', data=json.dumps({
    'email': 'unknown.ghost@harvest.edu',
    'password': 'SomePassword123!'
}), content_type='application/json')
assert res.status_code == 401, f"Expected 401, got {res.status_code}"
print(f" [PASS] Unknown user rejected (401): {res.json().get('error')}")

# 2.3 Blank fields
res = Client().post('/api/auth/login/', data=json.dumps({
    'email': '',
    'password': ''
}), content_type='application/json')
assert res.status_code == 400, f"Expected 400, got {res.status_code}"
print(f" [PASS] Blank credentials rejected (400): {res.json().get('error')}")

# ----------------------------------------------------
# 3. RBAC RESTRICTION ON PROTECTED ENDPOINTS
# ----------------------------------------------------
print("\n--- 3. Role-Based Access Control (RBAC) ---")

# 3.1 Admin allowed to list users
res = client.get('/api/auth/users/')
assert res.status_code == 200, f"Expected 200, got {res.status_code}"
total_users = len(res.json().get('users', []))
print(f" [PASS] Admin accessed /api/auth/users/ (200 OK) -> Listed {total_users} users")

# 3.2 Staff forbidden from listing users
res = staff_client.get('/api/auth/users/')
assert res.status_code == 403, f"Expected 403, got {res.status_code}"
print(f" [PASS] Staff forbidden from /api/auth/users/ (403 Forbidden): {res.json().get('error')}")

# 3.3 Anonymous forbidden from listing users
anon_client = Client()
res = anon_client.get('/api/auth/users/')
assert res.status_code in (401, 403), f"Expected 401/403, got {res.status_code}"
print(f" [PASS] Anonymous user rejected from /api/auth/users/ ({res.status_code})")

# ----------------------------------------------------
# 4. REGISTRATION VALIDATION & PRIVILEGE ESCALATION
# ----------------------------------------------------
print("\n--- 4. Registration & Security Tests ---")

test_user_email = "robert.fox@harvest.edu"
User.objects.filter(email=test_user_email).delete()

# 4.1 Invalid email format
res = Client().post('/api/auth/register/', data=json.dumps({
    'name': 'Invalid Email User',
    'email': 'not-an-email',
    'password': 'Password123!',
    'confirmPassword': 'Password123!'
}), content_type='application/json')
assert res.status_code == 400, f"Expected 400, got {res.status_code}"
print(f" [PASS] Bad email format rejected (400): {res.json().get('error')}")

# 4.2 Password too short (< 8 chars)
res = Client().post('/api/auth/register/', data=json.dumps({
    'name': 'Short Pass User',
    'email': 'short.pass@harvest.edu',
    'password': '123',
    'confirmPassword': '123'
}), content_type='application/json')
assert res.status_code == 400, f"Expected 400, got {res.status_code}"
print(f" [PASS] Short password (< 8 chars) rejected (400): {res.json().get('error')}")

# 4.3 Password mismatch
res = Client().post('/api/auth/register/', data=json.dumps({
    'name': 'Mismatch User',
    'email': 'mismatch@harvest.edu',
    'password': 'Password123!',
    'confirmPassword': 'DifferentPassword456!'
}), content_type='application/json')
assert res.status_code == 400, f"Expected 400, got {res.status_code}"
print(f" [PASS] Password mismatch rejected (400): {res.json().get('error')}")

# 4.4 Successful Registration with Privilege Escalation Prevention
reg_client = Client()
res = reg_client.post('/api/auth/register/', data=json.dumps({
    'name': 'Robert Fox',
    'email': test_user_email,
    'department': 'Mathematics Dept',
    'password': 'FoxSecure123!',
    'confirmPassword': 'FoxSecure123!',
    'role': 'ADMIN'  # Attempt privilege escalation from client
}), content_type='application/json')
assert res.status_code == 201, f"Expected 201, got {res.status_code}"
reg_user = res.json()['user']
print(f" [PASS] User registered successfully (201 Created): {reg_user['email']}")
assert reg_user['role'] == 'STAFF', "Security flaw: Client was able to elevate role!"
print(" [PASS] Privilege Escalation Blocked: Role defaulted to STAFF.")

# 4.5 Duplicate email registration
res = Client().post('/api/auth/register/', data=json.dumps({
    'name': 'Duplicate User',
    'email': test_user_email,
    'password': 'AnotherPassword123!',
    'confirmPassword': 'AnotherPassword123!'
}), content_type='application/json')
assert res.status_code == 400, f"Expected 400, got {res.status_code}"
print(f" [PASS] Duplicate email registration rejected (400): {res.json().get('error')}")

# ----------------------------------------------------
# 5. NO AUTO-LOGIN ON REGISTRATION & MANUAL LOGIN TEST
# ----------------------------------------------------
print("\n--- 5. Registration Session Check & Subsequent Login ---")

# Verify session is NOT active immediately after registration
me_after_reg = reg_client.get('/api/auth/me/')
assert me_after_reg.json().get('authenticated') == False, "Security flaw: Registration auto-logged in!"
print(" [PASS] Verification Successful: User is NOT logged in after registration (authenticated: False).")

# Now perform explicit login with the newly registered credentials
login_new_user = reg_client.post('/api/auth/login/', data=json.dumps({
    'email': test_user_email,
    'password': 'FoxSecure123!'
}), content_type='application/json')
assert login_new_user.status_code == 200, f"Expected 200 on login, got {login_new_user.status_code}"
print(" [PASS] User successfully logged in with new credentials (200 OK).")

# Verify session is now active after explicit login
me_after_login = reg_client.get('/api/auth/me/')
assert me_after_login.json().get('authenticated') == True
print(" [PASS] Dashboard Access Granted: /api/auth/me/ returns authenticated: True.")

# Logout
res = reg_client.post('/api/auth/logout/')
assert res.status_code == 200
print(f" [PASS] Logout successful (200): {res.json().get('message')}")

# Verify session destroyed after logout
me_after_logout = reg_client.get('/api/auth/me/')
assert me_after_logout.json().get('authenticated') == False
print(" [PASS] Session invalidated: /api/auth/me/ returns authenticated: False.")

# Clean up test user
User.objects.filter(email=test_user_email).delete()

print("\n==================================================")
print(" ALL 12 AUTHENTICATION & REGISTRATION TESTS PASSED! ")
print("==================================================")
