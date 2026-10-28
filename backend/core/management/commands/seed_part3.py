from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from core.models import Location, Supplier, StaffMember, Asset, AssetAssignment, User

class Command(BaseCommand):
    help = 'Seeds initial campus assets, locations, suppliers, and assignments for Part 3'

    def handle(self, *args, **kwargs):
        # 1. Locations
        loc_science, _ = Location.objects.get_or_create(
            name='Science Lab B',
            defaults={'location_type': 'Lab', 'building': 'Science Wing', 'room_number': '102'}
        )
        loc_store, _ = Location.objects.get_or_create(
            name='Main IT Store',
            defaults={'location_type': 'Storage', 'building': 'Admin Block', 'room_number': 'IT-01'}
        )
        loc_room204, _ = Location.objects.get_or_create(
            name='Room 204',
            defaults={'location_type': 'Classroom', 'building': 'Academic Block A', 'room_number': '204'}
        )
        loc_workshop, _ = Location.objects.get_or_create(
            name='Repair Workshop',
            defaults={'location_type': 'Lab', 'building': 'Facilities Block', 'room_number': 'WS-02'}
        )

        # 2. Suppliers
        sup_dell, _ = Supplier.objects.get_or_create(
            name='Dell Technologies Commercial',
            defaults={'category': 'Hardware Vendor', 'contact_person': 'Rohan Mehta', 'email': 'enterprise@dell.partner.edu'}
        )
        sup_apple, _ = Supplier.objects.get_or_create(
            name='Apple Authorised Education Store',
            defaults={'category': 'Hardware Vendor', 'contact_person': 'Anita Roy', 'email': 'edu@applepartners.in'}
        )

        # 3. Staff Members
        staff_sarah, _ = StaffMember.objects.get_or_create(
            email='sarah.jenkins@harvest.edu',
            defaults={'name': 'Sarah Jenkins', 'department': 'Science Dept', 'job_title': 'Senior Science Teacher', 'phone': '+91 98765 43210'}
        )
        staff_david, _ = StaffMember.objects.get_or_create(
            email='david.miller@harvest.edu',
            defaults={'name': 'David Miller', 'department': 'Maths Dept', 'job_title': 'Mathematics Faculty', 'phone': '+91 98765 43211'}
        )
        staff_priya, _ = StaffMember.objects.get_or_create(
            email='priya.sharma@harvest.edu',
            defaults={'name': 'Priya Sharma', 'department': 'IT Services', 'job_title': 'Systems Engineer', 'phone': '+91 98765 43212'}
        )

        # 4. Assets
        a1, _ = Asset.objects.get_or_create(
            asset_tag='HAR-LAP-0104',
            defaults={
                'name': 'Dell Latitude 5430',
                'asset_type': 'Laptop',
                'serial_number': 'DL-5430-88192',
                'brand': 'Dell',
                'model': 'Latitude 5430',
                'status': 'Available',
                'location': loc_science,
                'supplier': sup_dell,
                'purchase_price': 65000.00,
                'purchase_date': '2025-06-15',
                'warranty_expiry': '2028-06-15',
                'notes': 'Staff high-performance laptop for curriculum planning.'
            }
        )

        a2, _ = Asset.objects.get_or_create(
            asset_tag='HAR-LAP-0219',
            defaults={
                'name': 'Apple MacBook Air M2',
                'asset_type': 'Laptop',
                'serial_number': 'AP-M2-77319',
                'brand': 'Apple',
                'model': 'MacBook Air M2 13"',
                'status': 'Available',
                'location': loc_store,
                'supplier': sup_apple,
                'purchase_price': 98000.00,
                'purchase_date': '2025-08-01',
                'warranty_expiry': '2028-08-01',
                'notes': 'Available in IT storage for immediate deployment.'
            }
        )

        a3, _ = Asset.objects.get_or_create(
            asset_tag='HAR-MON-0082',
            defaults={
                'name': 'HP Pavilion 27" Display',
                'asset_type': 'Monitor',
                'serial_number': 'HP-27-33100',
                'brand': 'HP',
                'model': 'Pavilion 27QHD',
                'status': 'Available',
                'location': loc_room204,
                'purchase_price': 18500.00,
                'purchase_date': '2025-07-10',
                'warranty_expiry': '2027-07-10',
            }
        )

        a4, _ = Asset.objects.get_or_create(
            asset_tag='HAR-LAP-0078',
            defaults={
                'name': 'Lenovo ThinkPad T14',
                'asset_type': 'Laptop',
                'serial_number': 'LN-T14-99021',
                'brand': 'Lenovo',
                'model': 'ThinkPad T14 Gen 3',
                'status': 'Under Repair',
                'location': loc_workshop,
                'purchase_price': 72000.00,
                'notes': 'Keyboard replacement pending at workshop.'
            }
        )

        a5, _ = Asset.objects.get_or_create(
            asset_tag='HAR-PHO-0012',
            defaults={
                'name': 'Cisco IP Phone 8845',
                'asset_type': 'Phone',
                'serial_number': 'CS-8845-1234',
                'brand': 'Cisco',
                'model': '8845 Video Phone',
                'status': 'Available',
                'location': loc_store,
                'purchase_price': 14000.00,
            }
        )

        # 5. One Active Assignment
        admin_user = User.objects.filter(is_superuser=True).first()
        active_assignment = AssetAssignment.objects.filter(asset=a1, status='Active').first()
        if not active_assignment:
            AssetAssignment.objects.create(
                asset=a1,
                staff_member=staff_sarah,
                issue_date=timezone.now().date() - timedelta(days=20),
                expected_return_date=timezone.now().date() + timedelta(days=70),
                status='Active',
                notes='Assigned for academic term.',
                assigned_by=admin_user
            )
            a1.status = 'Assigned'
            a1.save()

        self.stdout.write(self.style.SUCCESS("Part 3 seed completed successfully!"))
