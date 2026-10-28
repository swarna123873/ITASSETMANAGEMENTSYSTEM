from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from core.models import SoftwareLicense, HardwareComponent, ConsumableItem, Supplier, Asset, User, AuditLog

class Command(BaseCommand):
    help = 'Seeds initial Part 5 advanced data: Software licenses, components, suppliers, and consumables'

    def handle(self, *args, **kwargs):
        admin = User.objects.filter(is_superuser=True).first()

        # 1. Software Licenses
        SoftwareLicense.objects.get_or_create(
            software_name='Microsoft 365 Education A3',
            publisher='Microsoft Corporation',
            defaults={
                'license_key_masked': '••••-••••-••••-9921',
                'purchased_seats': 50,
                'allocated_seats': 34,
                'purchase_date': '2025-06-01',
                'expiration_date': '2027-06-01',
                'renewal_cost': 65000.00,
                'status': 'Active'
            }
        )
        SoftwareLicense.objects.get_or_create(
            software_name='Adobe Creative Cloud All Apps',
            publisher='Adobe Systems',
            defaults={
                'license_key_masked': '••••-••••-••••-4481',
                'purchased_seats': 15,
                'allocated_seats': 12,
                'purchase_date': '2025-07-15',
                'expiration_date': '2027-07-15',
                'renewal_cost': 48000.00,
                'status': 'Active'
            }
        )
        SoftwareLicense.objects.get_or_create(
            software_name='Zoom Education Pro',
            publisher='Zoom Video Communications',
            defaults={
                'license_key_masked': '••••-••••-••••-1102',
                'purchased_seats': 20,
                'allocated_seats': 8,
                'purchase_date': '2025-08-01',
                'expiration_date': '2027-08-01',
                'renewal_cost': 22000.00,
                'status': 'Active'
            }
        )

        # 2. Hardware Components
        asset_mac = Asset.objects.filter(asset_tag='HAR-LAP-0219').first()
        asset_dell = Asset.objects.filter(asset_tag='HAR-LAP-0104').first()

        HardwareComponent.objects.get_or_create(
            name='Kingston Fury 16GB DDR5 5600MHz',
            serial_number='KF-DDR5-9921',
            defaults={
                'component_type': 'RAM',
                'parent_asset': asset_dell,
                'condition': 'Good',
                'notes': 'Installed in primary SO-DIMM slot.'
            }
        )
        HardwareComponent.objects.get_or_create(
            name='Samsung 980 Pro 1TB NVMe PCIe 4.0 SSD',
            serial_number='SAM-980-8841',
            defaults={
                'component_type': 'SSD',
                'parent_asset': None, # Unattached spare
                'condition': 'Good',
                'notes': 'Spare NVMe drive kept in IT store shelf 1.'
            }
        )
        HardwareComponent.objects.get_or_create(
            name='Nvidia GeForce RTX 4060 8GB',
            serial_number='NV-4060-7712',
            defaults={
                'component_type': 'Graphics Card',
                'parent_asset': None,
                'condition': 'Good',
                'notes': 'Spare GPU reserved for Physics simulation lab workstation.'
            }
        )

        # 3. Consumable Items
        ConsumableItem.objects.get_or_create(
            name='HP LaserJet 85A Black Toner Cartridge',
            defaults={
                'category': 'Printing',
                'quantity': 8,
                'minimum_threshold': 3,
                'unit': 'cartridges',
                'unit_cost': 2850.00,
                'storage_location': 'Central IT Store Shelf B'
            }
        )
        ConsumableItem.objects.get_or_create(
            name='JK Copier A4 Paper 75GSM (500 Sheets)',
            defaults={
                'category': 'Printing',
                'quantity': 2, # Low stock! (threshold is 5)
                'minimum_threshold': 5,
                'unit': 'reams',
                'unit_cost': 340.00,
                'storage_location': 'Central Admin Stationery Room'
            }
        )
        ConsumableItem.objects.get_or_create(
            name='D-Link Cat6 UTP Patch Cable (2 Meter)',
            defaults={
                'category': 'Cables',
                'quantity': 35,
                'minimum_threshold': 10,
                'unit': 'pcs',
                'unit_cost': 120.00,
                'storage_location': 'Networking Lab Rack 3'
            }
        )
        ConsumableItem.objects.get_or_create(
            name='High-Speed Braided HDMI 2.1 Cable (3 Meter)',
            defaults={
                'category': 'Cables',
                'quantity': 14,
                'minimum_threshold': 5,
                'unit': 'pcs',
                'unit_cost': 450.00,
                'storage_location': 'AV Storage Cabinet 2'
            }
        )

        # 4. Audit Log
        AuditLog.objects.create(
            actor=admin,
            action_type='SEED_DATA',
            module='Advanced',
            description='Initialized Part 5 digital licenses, modular spare components, and consumable stock.'
        )

        self.stdout.write(self.style.SUCCESS("Part 5 data seeded successfully!"))
