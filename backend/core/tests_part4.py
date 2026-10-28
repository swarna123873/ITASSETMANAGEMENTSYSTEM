from django.test import TestCase, Client
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from core.models import UserProfile, Asset, Location, MaintenanceRecord, StaffMember, AssetAssignment, AuditLog
import json

class Part4OperationsTestCase(TestCase):
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

        self.location = Location.objects.create(
            name='Science Lab A',
            location_type='Lab',
            building='Science Wing',
            room_number='101'
        )

        self.asset = Asset.objects.create(
            name='Lenovo ThinkPad',
            asset_tag='HAR-LAP-901',
            asset_type='Laptop',
            status='Available',
            location=self.location,
            warranty_expiry=timezone.now().date() + timedelta(days=20) # Expiring soon
        )

        self.staff_member = StaffMember.objects.create(
            name='Dr. Brown',
            email='brown@harvest.edu',
            department='Physics'
        )

        # Overdue assignment
        self.assignment = AssetAssignment.objects.create(
            asset=self.asset,
            staff_member=self.staff_member,
            issue_date=timezone.now().date() - timedelta(days=30),
            expected_return_date=timezone.now().date() - timedelta(days=5), # Overdue
            status='Active'
        )
        self.asset.status = 'Assigned'
        self.asset.save()

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

    def test_repairs_lifecycle(self):
        # 1. Admin logs repair ticket
        res = self.admin_client.post('/api/repairs/', data=json.dumps({
            'assetId': self.asset.id,
            'faultDescription': 'Screen flicker and hinge cracked',
            'repairCost': 4500.00
        }), content_type='application/json')
        self.assertEqual(res.status_code, 201)
        repair_id = res.json()['repair']['id']

        # Asset status updated to Under Repair
        self.asset.refresh_from_db()
        self.assertEqual(self.asset.status, 'Under Repair')

        # 2. Complete repair
        res_complete = self.admin_client.patch(f'/api/repairs/{repair_id}/', data=json.dumps({
            'status': 'Completed',
            'notes': 'Screen replaced with OEM panel'
        }), content_type='application/json')
        self.assertEqual(res_complete.status_code, 200)

        # Asset status reverted to Available
        self.asset.refresh_from_db()
        self.assertEqual(self.asset.status, 'Available')

    def test_locations_stationed_assets_and_delete_protection(self):
        # List locations
        res = self.admin_client.get('/api/locations/')
        self.assertEqual(res.status_code, 200)
        loc_data = next((l for l in res.json()['locations'] if l['id'] == self.location.id), None)
        self.assertIsNotNone(loc_data)
        self.assertGreaterEqual(loc_data['assetCount'], 1)

        # Deleting location with assets must fail
        res_del = self.admin_client.delete(f'/api/locations/{self.location.id}/')
        self.assertEqual(res_del.status_code, 400)

    def test_alerts_hub_detects_overdue_and_warranty(self):
        res = self.admin_client.get('/api/alerts/')
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertGreaterEqual(data['overdueCount'], 1)
        self.assertGreaterEqual(data['warrantyCount'], 1)

    def test_audit_trail_logging(self):
        # Trigger an action
        self.admin_client.post('/api/locations/', data=json.dumps({
            'name': 'Robotics Lab',
            'type': 'Lab',
            'building': 'Innovation Center'
        }), content_type='application/json')

        res = self.admin_client.get('/api/audit/')
        self.assertEqual(res.status_code, 200)
        logs = res.json()['logs']
        self.assertTrue(any(l['actionType'] == 'CREATE_LOCATION' for l in logs))
