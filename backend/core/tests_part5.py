from django.test import TestCase, Client
from django.contrib.auth.models import User
from core.models import (
    UserProfile,
    Asset,
    SoftwareLicense,
    HardwareComponent,
    ConsumableItem,
    Supplier,
    SchoolSettings
)
import json

class Part5AdvancedTestCase(TestCase):
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

        self.asset = Asset.objects.create(
            name='Dell OptiPlex Desktop',
            asset_tag='HAR-DSK-001',
            asset_type='Other',
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

    def test_software_license_lifecycle_and_seat_allocation(self):
        # 1. Admin creates license
        res = self.admin_client.post('/api/licenses/', data=json.dumps({
            'name': 'Adobe Creative Cloud',
            'publisher': 'Adobe Systems',
            'licenseKey': 'ADOBE-CC-9988-7766',
            'purchasedSeats': 2,
            'renewalCost': 24000.00
        }), content_type='application/json')
        self.assertEqual(res.status_code, 201)
        lic_id = res.json()['license']['id']
        self.assertEqual(res.json()['license']['availableSeats'], 2)

        # 2. Allocate seat 1
        res_alloc = self.admin_client.patch(f'/api/licenses/{lic_id}/', data=json.dumps({
            'action': 'allocate'
        }), content_type='application/json')
        self.assertEqual(res_alloc.status_code, 200)
        self.assertEqual(res_alloc.json()['license']['allocatedSeats'], 1)
        self.assertEqual(res_alloc.json()['license']['availableSeats'], 1)

        # 3. Allocate seat 2
        self.admin_client.patch(f'/api/licenses/{lic_id}/', data=json.dumps({'action': 'allocate'}), content_type='application/json')

        # 4. Attempt to allocate seat 3 (Exceeds capacity) -> 400 Error
        res_full = self.admin_client.patch(f'/api/licenses/{lic_id}/', data=json.dumps({'action': 'allocate'}), content_type='application/json')
        self.assertEqual(res_full.status_code, 400)

        # 5. Deallocate seat
        res_dealloc = self.admin_client.patch(f'/api/licenses/{lic_id}/', data=json.dumps({'action': 'deallocate'}), content_type='application/json')
        self.assertEqual(res_dealloc.status_code, 200)
        self.assertEqual(res_dealloc.json()['license']['availableSeats'], 1)

    def test_hardware_component_creation_and_linking(self):
        res = self.admin_client.post('/api/components/', data=json.dumps({
            'name': 'Corsair Vengeance 16GB DDR5',
            'type': 'RAM',
            'serialNumber': 'RAM-DDR5-8819',
            'parentAssetId': self.asset.id
        }), content_type='application/json')
        self.assertEqual(res.status_code, 201)
        comp_id = res.json()['component']['id']

        # List components
        res_list = self.admin_client.get('/api/components/')
        self.assertEqual(res_list.status_code, 200)
        self.assertGreaterEqual(res_list.json()['total'], 1)

    def test_consumable_stock_and_dispense_workflow(self):
        # 1. Create Consumable
        res = self.admin_client.post('/api/consumables/', data=json.dumps({
            'name': 'HP LaserJet 85A Black Toner',
            'category': 'Printing',
            'quantity': 10,
            'minimumThreshold': 3,
            'unit': 'cartridges'
        }), content_type='application/json')
        self.assertEqual(res.status_code, 201)
        item_id = res.json()['consumable']['id']

        # 2. Dispense (Usage) of 4 units
        res_use = self.admin_client.post(f'/api/consumables/{item_id}/adjust/', data=json.dumps({
            'type': 'Usage',
            'quantity': 4,
            'notes': 'Dispensed to Science faculty office'
        }), content_type='application/json')
        self.assertEqual(res_use.status_code, 200)
        self.assertEqual(res_use.json()['consumable']['quantity'], 6)

        # 3. Usage exceeding balance -> Rejected
        res_excess = self.admin_client.post(f'/api/consumables/{item_id}/adjust/', data=json.dumps({
            'type': 'Usage',
            'quantity': 20
        }), content_type='application/json')
        self.assertEqual(res_excess.status_code, 400)

        # 4. Restock (Addition) of 5 units
        res_add = self.admin_client.post(f'/api/consumables/{item_id}/adjust/', data=json.dumps({
            'type': 'Addition',
            'quantity': 5
        }), content_type='application/json')
        self.assertEqual(res_add.status_code, 200)
        self.assertEqual(res_add.json()['consumable']['quantity'], 11)

    def test_reports_summary_and_csv_export(self):
        # Summary
        res_sum = self.admin_client.get('/api/reports/summary/')
        self.assertEqual(res_sum.status_code, 200)
        self.assertIn('totalAssets', res_sum.json())
        self.assertIn('financials', res_sum.json())

        # CSV Export
        res_csv = self.admin_client.get('/api/reports/export/assets/')
        self.assertEqual(res_csv.status_code, 200)
        self.assertEqual(res_csv['Content-Type'], 'text/csv')

    def test_settings_branding_update(self):
        res = self.admin_client.patch('/api/settings/', data=json.dumps({
            'schoolName': 'Harvest International Academy',
            'tagline': 'Empowering Future Leaders'
        }), content_type='application/json')
        self.assertEqual(res.status_code, 200)

        res_get = self.admin_client.get('/api/settings/')
        self.assertEqual(res_get.json()['schoolName'], 'Harvest International Academy')
