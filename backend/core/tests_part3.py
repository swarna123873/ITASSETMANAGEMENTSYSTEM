from django.test import TestCase, Client
from django.contrib.auth.models import User
from core.models import UserProfile, Asset, StaffMember, Location, AssetAssignment
import json

class Part3AssetsTestCase(TestCase):
    def setUp(self):
        # Admin User
        self.admin = User.objects.create_user(
            username='admin@harvest.edu',
            email='admin@harvest.edu',
            password='AdminPassword123!'
        )
        UserProfile.objects.create(user=self.admin, role='ADMIN')

        # Staff User
        self.staff_user = User.objects.create_user(
            username='staff@harvest.edu',
            email='staff@harvest.edu',
            password='StaffPassword123!'
        )
        UserProfile.objects.create(user=self.staff_user, role='STAFF')

        # Staff Member record
        self.staff_member = StaffMember.objects.create(
            name='Sarah Jenkins',
            email='sarah.jenkins@harvest.edu',
            department='Science Dept'
        )

        # Asset
        self.asset = Asset.objects.create(
            name='Dell Latitude 5430',
            asset_tag='HAR-LAP-001',
            asset_type='Laptop',
            status='Available'
        )

        self.admin_client = Client()
        self.admin_client.post('/api/auth/login/', data=json.dumps({
            'email': 'admin@harvest.edu',
            'password': 'AdminPassword123!'
        }), content_type='application/json')

        self.staff_client = Client()
        self.staff_client.post('/api/auth/login/', data=json.dumps({
            'email': 'staff@harvest.edu',
            'password': 'StaffPassword123!'
        }), content_type='application/json')

    def test_list_assets_authenticated(self):
        res = self.staff_client.get('/api/assets/')
        self.assertEqual(res.status_code, 200)
        self.assertGreaterEqual(len(res.json()['assets']), 1)

    def test_admin_create_asset_success(self):
        res = self.admin_client.post('/api/assets/', data=json.dumps({
            'name': 'MacBook Pro M3',
            'tag': 'HAR-LAP-002',
            'type': 'Laptop',
            'serialNumber': 'MBP-M3-999',
            'status': 'Available'
        }), content_type='application/json')
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.json()['asset']['tag'], 'HAR-LAP-002')

    def test_duplicate_asset_tag_rejected(self):
        res = self.admin_client.post('/api/assets/', data=json.dumps({
            'name': 'MacBook Clone',
            'tag': 'HAR-LAP-001', # Duplicate
            'type': 'Laptop'
        }), content_type='application/json')
        self.assertEqual(res.status_code, 400)

    def test_staff_cannot_create_asset(self):
        res = self.staff_client.post('/api/assets/', data=json.dumps({
            'name': 'Unauthorized Asset',
            'tag': 'HAR-LAP-099',
            'type': 'Laptop'
        }), content_type='application/json')
        self.assertEqual(res.status_code, 403)

    def test_single_holder_assignment_and_return_lifecycle(self):
        # 1. Issue Available asset to Staff
        res_issue = self.admin_client.post('/api/assignments/issue/', data=json.dumps({
            'assetId': self.asset.id,
            'staffId': self.staff_member.id,
            'issueDate': '2026-10-01'
        }), content_type='application/json')
        self.assertEqual(res_issue.status_code, 201)
        assignment_id = res_issue.json()['assignmentId']

        # Verify asset status updated to Assigned
        self.asset.refresh_from_db()
        self.assertEqual(self.asset.status, 'Assigned')

        # 2. Try to re-assign the SAME asset to someone else -> MUST FAIL (Single-Holder Rule)
        second_staff = StaffMember.objects.create(name='Dr. Fox', email='fox@harvest.edu', department='Maths')
        res_conflict = self.admin_client.post('/api/assignments/issue/', data=json.dumps({
            'assetId': self.asset.id,
            'staffId': second_staff.id
        }), content_type='application/json')
        self.assertEqual(res_conflict.status_code, 400)

        # 3. Return Asset
        res_return = self.admin_client.post(f'/api/assignments/{assignment_id}/return/', data=json.dumps({
            'returnDate': '2026-10-28',
            'notes': 'Returned in mint condition.'
        }), content_type='application/json')
        self.assertEqual(res_return.status_code, 200)

        # Verify asset reverted to Available
        self.asset.refresh_from_db()
        self.assertEqual(self.asset.status, 'Available')

    def test_staff_asset_matrix(self):
        res = self.admin_client.get('/api/assignments/staff-matrix/')
        self.assertEqual(res.status_code, 200)
        self.assertIn('matrix', res.json())
