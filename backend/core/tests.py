from django.test import TestCase, Client
from django.contrib.auth.models import User
from core.models import UserProfile
import json

class AuthAndRegistrationTestCase(TestCase):
    def setUp(self):
        # Create initial Admin user
        self.admin_user = User.objects.create_user(
            username='admin@harvest.edu',
            email='admin@harvest.edu',
            password='AdminPassword123!',
            first_name='Campus',
            last_name='Administrator',
            is_staff=True,
            is_superuser=True
        )
        UserProfile.objects.create(user=self.admin_user, role='ADMIN', department='IT Support')

        # Create Staff user
        self.staff_user = User.objects.create_user(
            username='sarah.jenkins@harvest.edu',
            email='sarah.jenkins@harvest.edu',
            password='StaffPassword123!',
            first_name='Sarah',
            last_name='Jenkins'
        )
        UserProfile.objects.create(user=self.staff_user, role='STAFF', department='Science Dept')

    def test_admin_login_success(self):
        client = Client()
        res = client.post('/api/auth/login/', data=json.dumps({
            'email': 'admin@harvest.edu',
            'password': 'AdminPassword123!'
        }), content_type='application/json')
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data['user']['role'], 'ADMIN')
        self.assertTrue(data['user']['isAdmin'])

    def test_staff_login_success(self):
        client = Client()
        res = client.post('/api/auth/login/', data=json.dumps({
            'email': 'sarah.jenkins@harvest.edu',
            'password': 'StaffPassword123!'
        }), content_type='application/json')
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data['user']['role'], 'STAFF')
        self.assertTrue(data['user']['isStaff'])

    def test_login_invalid_password(self):
        client = Client()
        res = client.post('/api/auth/login/', data=json.dumps({
            'email': 'admin@harvest.edu',
            'password': 'WrongPassword!'
        }), content_type='application/json')
        self.assertEqual(res.status_code, 401)

    def test_login_empty_fields(self):
        client = Client()
        res = client.post('/api/auth/login/', data=json.dumps({
            'email': '',
            'password': ''
        }), content_type='application/json')
        self.assertEqual(res.status_code, 400)

    def test_rbac_admin_vs_staff(self):
        admin_client = Client()
        admin_client.post('/api/auth/login/', data=json.dumps({
            'email': 'admin@harvest.edu',
            'password': 'AdminPassword123!'
        }), content_type='application/json')

        staff_client = Client()
        staff_client.post('/api/auth/login/', data=json.dumps({
            'email': 'sarah.jenkins@harvest.edu',
            'password': 'StaffPassword123!'
        }), content_type='application/json')

        # Admin gets 200
        res_admin = admin_client.get('/api/auth/users/')
        self.assertEqual(res_admin.status_code, 200)

        # Staff gets 403 Forbidden
        res_staff = staff_client.get('/api/auth/users/')
        self.assertEqual(res_staff.status_code, 403)

    def test_registration_validation(self):
        client = Client()

        # Bad email
        res = client.post('/api/auth/register/', data=json.dumps({
            'name': 'Test User',
            'email': 'bademail',
            'password': 'Password123!',
            'confirmPassword': 'Password123!'
        }), content_type='application/json')
        self.assertEqual(res.status_code, 400)

        # Short password
        res = client.post('/api/auth/register/', data=json.dumps({
            'name': 'Test User',
            'email': 'valid@harvest.edu',
            'password': '123',
            'confirmPassword': '123'
        }), content_type='application/json')
        self.assertEqual(res.status_code, 400)

        # Password mismatch
        res = client.post('/api/auth/register/', data=json.dumps({
            'name': 'Test User',
            'email': 'valid@harvest.edu',
            'password': 'Password123!',
            'confirmPassword': 'Mismatch123!'
        }), content_type='application/json')
        self.assertEqual(res.status_code, 400)

    def test_registration_privilege_escalation_and_no_autologin(self):
        client = Client()
        res = client.post('/api/auth/register/', data=json.dumps({
            'name': 'New Staff Member',
            'email': 'newstaff@harvest.edu',
            'department': 'Science',
            'password': 'SecurePass123!',
            'confirmPassword': 'SecurePass123!',
            'role': 'ADMIN' # Attempt privilege escalation
        }), content_type='application/json')
        self.assertEqual(res.status_code, 201)
        data = res.json()
        self.assertEqual(data['user']['role'], 'STAFF')

        # Verify registration did NOT auto-login
        res_me = client.get('/api/auth/me/')
        self.assertFalse(res_me.json().get('authenticated'))

        # Explicit login is required
        res_login = client.post('/api/auth/login/', data=json.dumps({
            'email': 'newstaff@harvest.edu',
            'password': 'SecurePass123!'
        }), content_type='application/json')
        self.assertEqual(res_login.status_code, 200)

        # Now user is authenticated
        res_me_logged_in = client.get('/api/auth/me/')
        self.assertTrue(res_me_logged_in.json().get('authenticated'))

    def test_registration_duplicate_email(self):
        client = Client()
        res = client.post('/api/auth/register/', data=json.dumps({
            'name': 'Duplicate',
            'email': 'admin@harvest.edu',
            'password': 'Password123!',
            'confirmPassword': 'Password123!'
        }), content_type='application/json')
        self.assertEqual(res.status_code, 400)

    def test_logout_and_session_cleared(self):
        client = Client()
        client.post('/api/auth/login/', data=json.dumps({
            'email': 'admin@harvest.edu',
            'password': 'AdminPassword123!'
        }), content_type='application/json')

        res_logout = client.post('/api/auth/logout/')
        self.assertEqual(res_logout.status_code, 200)

        res_me = client.get('/api/auth/me/')
        self.assertFalse(res_me.json().get('authenticated'))
