from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from core.models import UserProfile, StaffMember, SchoolSettings

class Command(BaseCommand):
    help = 'Seeds initial administrator and staff accounts for Harvest International School'

    def handle(self, *args, **kwargs):
        # 1. Ensure SchoolSettings exist
        settings, created = SchoolSettings.objects.get_or_create(
            id=1,
            defaults={
                'school_name': 'Harvest International School',
                'tagline': 'Education Beyond Classrooms',
                'logo_url': '/media/harvest_logo.jpg',
                'primary_color': '#2e7d32',
                'secondary_color': '#0288d1',
                'accent_color': '#c62828',
            }
        )
        self.stdout.write(self.style.SUCCESS(f"School settings initialized: {settings.school_name}"))

        # 2. Administrator Account
        admin_email = 'admin@harvest.edu'
        admin_user, created = User.objects.get_or_create(
            email=admin_email,
            defaults={
                'username': admin_email,
                'first_name': 'Campus',
                'last_name': 'Administrator',
                'is_staff': True,
                'is_superuser': True,
            }
        )
        admin_user.set_password('Admin123!')
        admin_user.save()

        admin_profile, _ = UserProfile.objects.get_or_create(
            user=admin_user,
            defaults={'role': 'ADMIN', 'department': 'IT Services'}
        )
        admin_profile.role = 'ADMIN'
        admin_profile.save()
        self.stdout.write(self.style.SUCCESS(f"Admin account configured: {admin_email} (Role: ADMIN)"))

        # 3. Staff Account
        staff_email = 'sarah.jenkins@harvest.edu'
        staff_user, created = User.objects.get_or_create(
            email=staff_email,
            defaults={
                'username': staff_email,
                'first_name': 'Sarah',
                'last_name': 'Jenkins',
                'is_staff': False,
                'is_superuser': False,
            }
        )
        staff_user.set_password('Staff123!')
        staff_user.save()

        staff_profile, _ = UserProfile.objects.get_or_create(
            user=staff_user,
            defaults={'role': 'STAFF', 'department': 'Science Dept'}
        )
        staff_profile.role = 'STAFF'
        staff_profile.department = 'Science Dept'
        staff_profile.save()

        # Also create StaffMember entry
        StaffMember.objects.get_or_create(
            email=staff_email,
            defaults={
                'name': 'Sarah Jenkins',
                'department': 'Science Dept',
                'job_title': 'Senior Science Teacher',
                'phone': '+91 98765 43210',
                'user': staff_user,
                'status': 'Active',
            }
        )
        self.stdout.write(self.style.SUCCESS(f"Staff account configured: {staff_email} (Role: STAFF)"))
