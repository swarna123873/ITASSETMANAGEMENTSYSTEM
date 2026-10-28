from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from core.models import Asset, MaintenanceRecord, Supplier, StaffMember, AssetAssignment, Location, User, AuditLog

class Command(BaseCommand):
    help = 'Seeds initial Part 4 operations data: Repairs, overdue checkouts, warranty alerts, and audit trail'

    def handle(self, *args, **kwargs):
        admin = User.objects.filter(is_superuser=True).first()

        # 1. Ensure supplier exists
        sup_tech, _ = Supplier.objects.get_or_create(
            name='Campus Tech Solutions Ltd',
            defaults={'category': 'Repair Provider', 'contact_person': 'Vikram Patel', 'phone': '+91 98765 11223'}
        )

        # 2. Repair ticket for Lenovo ThinkPad (Under Repair)
        asset_lenovo = Asset.objects.filter(asset_tag='HAR-LAP-0078').first()
        if asset_lenovo:
            repair, created = MaintenanceRecord.objects.get_or_create(
                asset=asset_lenovo,
                fault_description='Spill on keyboard; several keys sticky and trackpad unresponsive.',
                defaults={
                    'status': 'In Progress',
                    'service_provider': sup_tech,
                    'start_date': timezone.now().date() - timedelta(days=4),
                    'repair_cost': 3200.00,
                    'notes': 'Parts ordered from Lenovo OEM distributor.'
                }
            )
            asset_lenovo.status = 'Under Repair'
            asset_lenovo.save()

        # 3. Create an overdue assignment for testing Alerts
        asset_display = Asset.objects.filter(asset_tag='HAR-MON-0082').first()
        staff_david = StaffMember.objects.filter(email='david.miller@harvest.edu').first()
        if asset_display and staff_david:
            # Check if assignment already exists
            existing = AssetAssignment.objects.filter(asset=asset_display, status='Active').first()
            if not existing:
                AssetAssignment.objects.create(
                    asset=asset_display,
                    staff_member=staff_david,
                    issue_date=timezone.now().date() - timedelta(days=45),
                    expected_return_date=timezone.now().date() - timedelta(days=10), # 10 days overdue
                    status='Active',
                    notes='Short-term loan for curriculum recording.',
                    assigned_by=admin
                )
                asset_display.status = 'Assigned'
                asset_display.save()

        # 4. Create an asset with warranty expiring in 25 days
        asset_phone = Asset.objects.filter(asset_tag='HAR-PHO-0012').first()
        if asset_phone:
            asset_phone.warranty_expiry = timezone.now().date() + timedelta(days=25)
            asset_phone.save()

        # 5. Log audit entries
        AuditLog.objects.create(
            actor=admin,
            action_type='SEED_DATA',
            module='Operations',
            description='Initialized Part 4 campus operations, repair tickets, and facility allocations.'
        )

        self.stdout.write(self.style.SUCCESS("Part 4 operations data seeded successfully!"))
