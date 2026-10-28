from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class UserProfile(models.Model):
    ROLE_CHOICES = [
        ('ADMIN', 'Administrator'),
        ('STAFF', 'Staff Member'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='STAFF')
    department = models.CharField(max_length=100, blank=True, default='')
    phone = models.CharField(max_length=30, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} ({self.role})"


class StaffMember(models.Model):
    user = models.OneToOneField(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='staff_profile')
    name = models.CharField(max_length=150)
    email = models.EmailField(unique=True)
    department = models.CharField(max_length=100)
    phone = models.CharField(max_length=30, blank=True, default='')
    job_title = models.CharField(max_length=100, blank=True, default='')
    status = models.CharField(max_length=20, default='Active') # Active, Inactive
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - {self.department}"


class Location(models.Model):
    name = models.CharField(max_length=120)
    location_type = models.CharField(max_length=60, default='Classroom') # Building, Lab, Classroom, Room, Office, Library, Storage
    building = models.CharField(max_length=100, blank=True, default='Main Campus')
    room_number = models.CharField(max_length=50, blank=True, default='')
    description = models.TextField(blank=True, default='')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.location_type})"


class Supplier(models.Model):
    name = models.CharField(max_length=150)
    contact_person = models.CharField(max_length=100, blank=True, default='')
    email = models.EmailField(blank=True, default='')
    phone = models.CharField(max_length=40, blank=True, default='')
    address = models.TextField(blank=True, default='')
    category = models.CharField(max_length=60, default='Hardware Vendor') # Equipment Vendor, Repair Provider, Software Reseller
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Asset(models.Model):
    TYPE_CHOICES = [
        ('Laptop', 'Laptop'),
        ('Monitor', 'Monitor'),
        ('Phone', 'Phone'),
        ('Other', 'Other'),
    ]

    STATUS_CHOICES = [
        ('Available', 'Available'),
        ('Assigned', 'Assigned'),
        ('Under Repair', 'Under Repair'),
        ('Retired', 'Retired'),
    ]

    name = models.CharField(max_length=150)
    asset_type = models.CharField(max_length=30, choices=TYPE_CHOICES, default='Laptop')
    asset_tag = models.CharField(max_length=60, unique=True, db_index=True)
    serial_number = models.CharField(max_length=100, blank=True, default='')
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='Available', db_index=True)
    
    location = models.ForeignKey(Location, on_delete=models.SET_NULL, null=True, blank=True, related_name='assets')
    supplier = models.ForeignKey(Supplier, on_delete=models.SET_NULL, null=True, blank=True, related_name='assets')
    
    brand = models.CharField(max_length=100, blank=True, default='')
    model = models.CharField(max_length=100, blank=True, default='')
    purchase_date = models.DateField(null=True, blank=True)
    purchase_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    warranty_expiry = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True, default='')
    qr_code_path = models.CharField(max_length=255, blank=True, default='')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} [{self.asset_tag}]"

    @property
    def current_holder(self):
        active_assignment = self.assignments.filter(status='Active').first()
        if active_assignment and active_assignment.staff_member:
            return active_assignment.staff_member.name
        return "Unassigned"


class AssetAssignment(models.Model):
    STATUS_CHOICES = [
        ('Active', 'Active'),
        ('Returned', 'Returned'),
    ]

    asset = models.ForeignKey(Asset, on_delete=models.CASCADE, related_name='assignments')
    staff_member = models.ForeignKey(StaffMember, on_delete=models.CASCADE, related_name='assignments')
    issue_date = models.DateField(default=timezone.now)
    expected_return_date = models.DateField(null=True, blank=True)
    actual_return_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Active', db_index=True)
    notes = models.TextField(blank=True, default='')
    assigned_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.asset.asset_tag} -> {self.staff_member.name} ({self.status})"


class MaintenanceRecord(models.Model):
    STATUS_CHOICES = [
        ('Requested', 'Requested'),
        ('In Progress', 'In Progress'),
        ('Completed', 'Completed'),
        ('Cancelled', 'Cancelled'),
    ]

    asset = models.ForeignKey(Asset, on_delete=models.CASCADE, related_name='repairs')
    fault_description = models.TextField()
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='Requested')
    start_date = models.DateField(default=timezone.now)
    completion_date = models.DateField(null=True, blank=True)
    repair_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    service_provider = models.ForeignKey(Supplier, on_delete=models.SET_NULL, null=True, blank=True)
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Repair: {self.asset.asset_tag} - {self.status}"


class SoftwareLicense(models.Model):
    software_name = models.CharField(max_length=150)
    publisher = models.CharField(max_length=120)
    license_key_masked = models.CharField(max_length=100, blank=True, default='')
    license_key_encrypted = models.TextField(blank=True, default='')
    purchased_seats = models.PositiveIntegerField(default=1)
    allocated_seats = models.PositiveIntegerField(default=0)
    purchase_date = models.DateField(null=True, blank=True)
    expiration_date = models.DateField(null=True, blank=True)
    renewal_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    status = models.CharField(max_length=30, default='Active') # Active, Expiring Soon, Expired
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.software_name} ({self.allocated_seats}/{self.purchased_seats})"

    @property
    def available_seats(self):
        return max(0, self.purchased_seats - self.allocated_seats)


class HardwareComponent(models.Model):
    COMPONENT_CHOICES = [
        ('RAM', 'RAM'),
        ('SSD', 'SSD'),
        ('Hard Drive', 'Hard Drive'),
        ('Graphics Card', 'Graphics Card'),
        ('Other', 'Other'),
    ]

    name = models.CharField(max_length=120)
    component_type = models.CharField(max_length=40, choices=COMPONENT_CHOICES, default='RAM')
    serial_number = models.CharField(max_length=100, blank=True, default='')
    parent_asset = models.ForeignKey(Asset, on_delete=models.SET_NULL, null=True, blank=True, related_name='components')
    condition = models.CharField(max_length=40, default='Good')
    repair_status = models.CharField(max_length=40, default='Operational')
    installed_date = models.DateField(null=True, blank=True)
    removed_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.component_type} - {self.name}"


class ConsumableItem(models.Model):
    name = models.CharField(max_length=120)
    category = models.CharField(max_length=60, default='Printing') # Printing, Cables, Batteries, Stationeries
    quantity = models.PositiveIntegerField(default=0)
    minimum_threshold = models.PositiveIntegerField(default=5)
    unit = models.CharField(max_length=30, default='pcs')
    unit_cost = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)
    storage_location = models.CharField(max_length=100, blank=True, default='Central IT Store')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.quantity} {self.unit})"

    @property
    def is_low_stock(self):
        return self.quantity <= self.minimum_threshold


class StockMovement(models.Model):
    MOVEMENT_CHOICES = [
        ('Addition', 'Addition'),
        ('Usage', 'Usage'),
    ]

    consumable = models.ForeignKey(ConsumableItem, on_delete=models.CASCADE, related_name='movements')
    movement_type = models.CharField(max_length=20, choices=MOVEMENT_CHOICES)
    quantity = models.PositiveIntegerField()
    recorded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.movement_type} {self.quantity} x {self.consumable.name}"


class Notification(models.Model):
    CATEGORY_CHOICES = [
        ('overdue', 'Overdue Return'),
        ('repair', 'Under Repair'),
        ('license', 'License Expiry'),
        ('warranty', 'Warranty Reminder'),
        ('stock', 'Low Stock Warning'),
        ('system', 'System Notice'),
    ]

    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES, default='system')
    title = models.CharField(max_length=150)
    message = models.TextField()
    related_type = models.CharField(max_length=50, blank=True, default='')
    related_id = models.CharField(max_length=50, blank=True, default='')
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"[{self.category}] {self.title}"


class AuditLog(models.Model):
    actor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    action_type = models.CharField(max_length=50) # CREATE, UPDATE, DELETE, ASSIGN, RETURN, REPAIR_START, etc.
    module = models.CharField(max_length=50) # Assets, Staff, Assignments, Repairs, Licenses, etc.
    description = models.TextField()
    record_id = models.CharField(max_length=50, blank=True, default='')
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.action_type} on {self.module} at {self.timestamp}"


class SchoolSettings(models.Model):
    school_name = models.CharField(max_length=150, default='Harvest International School')
    tagline = models.CharField(max_length=150, default='Education Beyond Classrooms')
    logo_url = models.CharField(max_length=255, default='/media/harvest_logo.jpg')
    primary_color = models.CharField(max_length=20, default='#2e7d32')
    secondary_color = models.CharField(max_length=20, default='#0288d1')
    accent_color = models.CharField(max_length=20, default='#c62828')
    default_asset_type = models.CharField(max_length=30, default='Laptop')
    overdue_days_alert = models.PositiveIntegerField(default=1)
    license_days_alert = models.PositiveIntegerField(default=30)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.school_name
