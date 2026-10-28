from django.http import JsonResponse
from django.utils import timezone
from django.db.models import Q, Count
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from .models import Asset, StaffMember, Location, Supplier, AssetAssignment, AuditLog, UserProfile

def is_admin(user):
    profile = getattr(user, 'profile', None)
    return profile and profile.role == 'ADMIN'

# ============================================================================
# MODULE 5: ASSET INVENTORY MANAGEMENT
# ============================================================================

def serialize_asset(asset):
    active_assignment = asset.assignments.filter(status='Active').select_related('staff_member').first()
    holder_data = None
    if active_assignment and active_assignment.staff_member:
        holder_data = {
            'id': active_assignment.staff_member.id,
            'name': active_assignment.staff_member.name,
            'email': active_assignment.staff_member.email,
            'department': active_assignment.staff_member.department,
            'assignmentId': active_assignment.id,
            'issueDate': str(active_assignment.issue_date),
            'expectedReturnDate': str(active_assignment.expected_return_date) if active_assignment.expected_return_date else None,
        }

    return {
        'id': asset.id,
        'name': asset.name,
        'tag': asset.asset_tag,
        'type': asset.asset_type,
        'serialNumber': asset.serial_number,
        'status': asset.status,
        'brand': asset.brand,
        'model': asset.model,
        'purchaseDate': str(asset.purchase_date) if asset.purchase_date else None,
        'purchasePrice': float(asset.purchase_price) if asset.purchase_price else None,
        'warrantyExpiry': str(asset.warranty_expiry) if asset.warranty_expiry else None,
        'notes': asset.notes,
        'location': {
            'id': asset.location.id,
            'name': asset.location.name,
            'building': asset.location.building,
            'room': asset.location.room_number,
        } if asset.location else None,
        'supplier': {
            'id': asset.supplier.id,
            'name': asset.supplier.name,
        } if asset.supplier else None,
        'holder': holder_data,
        'createdAt': asset.created_at.strftime('%Y-%m-%d %H:%M'),
    }


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def assets_list_create_view(request):
    if request.method == 'GET':
        query = request.GET.get('search', '').strip()
        asset_type = request.GET.get('type', '').strip()
        status = request.GET.get('status', '').strip()
        location_id = request.GET.get('location', '').strip()

        queryset = Asset.objects.all().select_related('location', 'supplier').prefetch_related('assignments__staff_member')

        if query:
            queryset = queryset.filter(
                Q(name__icontains=query) |
                Q(asset_tag__icontains=query) |
                Q(serial_number__icontains=query) |
                Q(brand__icontains=query) |
                Q(model__icontains=query)
            )
        if asset_type:
            queryset = queryset.filter(asset_type=asset_type)
        if status:
            queryset = queryset.filter(status=status)
        if location_id and location_id.isdigit():
            queryset = queryset.filter(location_id=int(location_id))

        assets = [serialize_asset(a) for a in queryset.order_by('-created_at')]
        return JsonResponse({'assets': assets, 'total': len(assets)})

    elif request.method == 'POST':
        if not is_admin(request.user):
            return JsonResponse({'error': 'Administrator privileges required to register assets.'}, status=403)

        data = request.data
        name = (data.get('name') or '').strip()
        tag = (data.get('tag') or '').strip().upper()
        asset_type = data.get('type') or 'Laptop'
        serial_number = (data.get('serialNumber') or '').strip()
        status = data.get('status') or 'Available'
        brand = (data.get('brand') or '').strip()
        model = (data.get('model') or '').strip()
        purchase_date = data.get('purchaseDate') or None
        purchase_price = data.get('purchasePrice') or None
        warranty_expiry = data.get('warrantyExpiry') or None
        notes = (data.get('notes') or '').strip()
        location_id = data.get('locationId')
        supplier_id = data.get('supplierId')

        if not name or not tag:
            return JsonResponse({'error': 'Asset Name and Asset Tag are required.'}, status=400)

        if Asset.objects.filter(asset_tag__iexact=tag).exists():
            return JsonResponse({'error': f"Asset Tag '{tag}' is already registered in the system."}, status=400)

        location = Location.objects.filter(id=location_id).first() if location_id else None
        supplier = Supplier.objects.filter(id=supplier_id).first() if supplier_id else None

        asset = Asset.objects.create(
            name=name,
            asset_tag=tag,
            asset_type=asset_type,
            serial_number=serial_number,
            status=status,
            brand=brand,
            model=model,
            purchase_date=purchase_date if purchase_date else None,
            purchase_price=purchase_price if purchase_price else None,
            warranty_expiry=warranty_expiry if warranty_expiry else None,
            notes=notes,
            location=location,
            supplier=supplier,
        )

        AuditLog.objects.create(
            actor=request.user,
            action_type='CREATE_ASSET',
            module='Assets',
            description=f"Created asset '{asset.name}' [{asset.asset_tag}] (Type: {asset.asset_type})"
        )

        return JsonResponse({
            'message': f"Asset '{asset.name}' [{asset.asset_tag}] registered successfully.",
            'asset': serialize_asset(asset)
        }, status=201)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def asset_detail_view(request, asset_id):
    try:
        asset = Asset.objects.select_related('location', 'supplier').prefetch_related('assignments__staff_member').get(id=asset_id)
    except Asset.DoesNotExist:
        return JsonResponse({'error': 'Asset not found.'}, status=404)

    if request.method == 'GET':
        return JsonResponse({'asset': serialize_asset(asset)})

    if not is_admin(request.user):
        return JsonResponse({'error': 'Administrator privileges required.'}, status=403)

    if request.method in ['PUT', 'PATCH']:
        data = request.data
        if 'name' in data and data['name'].strip():
            asset.name = data['name'].strip()
        if 'tag' in data and data['tag'].strip():
            new_tag = data['tag'].strip().upper()
            if new_tag != asset.asset_tag and Asset.objects.filter(asset_tag__iexact=new_tag).exists():
                return JsonResponse({'error': f"Asset Tag '{new_tag}' already exists."}, status=400)
            asset.asset_tag = new_tag
        if 'type' in data:
            asset.asset_type = data['type']
        if 'serialNumber' in data:
            asset.serial_number = data['serialNumber'].strip()
        if 'status' in data:
            # If changing from Assigned to Available directly, check assignments
            if asset.status == 'Assigned' and data['status'] == 'Available':
                # Close active assignment
                asset.assignments.filter(status='Active').update(status='Returned', actual_return_date=timezone.now().date())
            asset.status = data['status']
        if 'brand' in data:
            asset.brand = data['brand'].strip()
        if 'model' in data:
            asset.model = data['model'].strip()
        if 'purchaseDate' in data:
            asset.purchase_date = data['purchaseDate'] or None
        if 'purchasePrice' in data:
            asset.purchase_price = data['purchasePrice'] or None
        if 'warrantyExpiry' in data:
            asset.warranty_expiry = data['warrantyExpiry'] or None
        if 'notes' in data:
            asset.notes = data['notes']
        if 'locationId' in data:
            asset.location = Location.objects.filter(id=data['locationId']).first() if data['locationId'] else None
        if 'supplierId' in data:
            asset.supplier = Supplier.objects.filter(id=data['supplierId']).first() if data['supplierId'] else None

        asset.save()

        AuditLog.objects.create(
            actor=request.user,
            action_type='UPDATE_ASSET',
            module='Assets',
            description=f"Updated asset record for '{asset.name}' [{asset.asset_tag}]"
        )

        return JsonResponse({'message': 'Asset updated successfully.', 'asset': serialize_asset(asset)})

    elif request.method == 'DELETE':
        if asset.status == 'Assigned':
            return JsonResponse({
                'error': f"Cannot delete '{asset.asset_tag}' because it is currently assigned. Please return it first."
            }, status=400)

        tag = asset.asset_tag
        name = asset.name
        asset.delete()

        AuditLog.objects.create(
            actor=request.user,
            action_type='DELETE_ASSET',
            module='Assets',
            description=f"Deleted asset '{name}' [{tag}]"
        )

        return JsonResponse({'message': f"Asset [{tag}] deleted successfully."})


# ============================================================================
# MODULE 6: STAFF DIRECTORY
# ============================================================================

def serialize_staff(staff):
    active_assignments = staff.assignments.filter(status='Active').select_related('asset')
    assigned_assets = [{
        'id': a.asset.id,
        'tag': a.asset.asset_tag,
        'name': a.asset.name,
        'type': a.asset.asset_type,
        'issueDate': str(a.issue_date),
        'expectedReturnDate': str(a.expected_return_date) if a.expected_return_date else None,
        'assignmentId': a.id,
    } for a in active_assignments]

    return {
        'id': staff.id,
        'name': staff.name,
        'email': staff.email,
        'department': staff.department,
        'phone': staff.phone,
        'jobTitle': staff.job_title,
        'status': staff.status,
        'notes': staff.notes,
        'assignedCount': len(assigned_assets),
        'assignedAssets': assigned_assets,
    }


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def staff_list_create_view(request):
    if request.method == 'GET':
        query = request.GET.get('search', '').strip()
        department = request.GET.get('department', '').strip()
        status = request.GET.get('status', '').strip()

        queryset = StaffMember.objects.all().prefetch_related('assignments__asset')

        if query:
            queryset = queryset.filter(
                Q(name__icontains=query) |
                Q(email__icontains=query) |
                Q(department__icontains=query) |
                Q(job_title__icontains=query)
            )
        if department:
            queryset = queryset.filter(department=department)
        if status:
            queryset = queryset.filter(status=status)

        staff_list = [serialize_staff(s) for s in queryset.order_by('name')]
        return JsonResponse({'staff': staff_list, 'total': len(staff_list)})

    elif request.method == 'POST':
        if not is_admin(request.user):
            return JsonResponse({'error': 'Administrator privileges required to add staff.'}, status=403)

        data = request.data
        name = (data.get('name') or '').strip()
        email = (data.get('email') or '').strip().lower()
        department = (data.get('department') or '').strip()
        phone = (data.get('phone') or '').strip()
        job_title = (data.get('jobTitle') or '').strip()
        notes = (data.get('notes') or '').strip()

        if not name or not email or not department:
            return JsonResponse({'error': 'Name, email, and department are required.'}, status=400)

        if StaffMember.objects.filter(email__iexact=email).exists():
            return JsonResponse({'error': f"A staff member with email '{email}' already exists."}, status=400)

        staff = StaffMember.objects.create(
            name=name,
            email=email,
            department=department,
            phone=phone,
            job_title=job_title,
            notes=notes,
            status='Active'
        )

        AuditLog.objects.create(
            actor=request.user,
            action_type='CREATE_STAFF',
            module='Staff',
            description=f"Created staff profile for '{staff.name}' ({staff.department})"
        )

        return JsonResponse({
            'message': f"Staff member '{staff.name}' added successfully.",
            'staff': serialize_staff(staff)
        }, status=201)


@api_view(['GET', 'PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def staff_detail_view(request, staff_id):
    try:
        staff = StaffMember.objects.prefetch_related('assignments__asset').get(id=staff_id)
    except StaffMember.DoesNotExist:
        return JsonResponse({'error': 'Staff member not found.'}, status=404)

    if request.method == 'GET':
        return JsonResponse({'staff': serialize_staff(staff)})

    if not is_admin(request.user):
        return JsonResponse({'error': 'Administrator privileges required.'}, status=403)

    data = request.data
    if 'name' in data and data['name'].strip():
        staff.name = data['name'].strip()
    if 'email' in data and data['email'].strip():
        new_email = data['email'].strip().lower()
        if new_email != staff.email and StaffMember.objects.filter(email__iexact=new_email).exists():
            return JsonResponse({'error': f"Email '{new_email}' is already in use."}, status=400)
        staff.email = new_email
    if 'department' in data and data['department'].strip():
        staff.department = data['department'].strip()
    if 'phone' in data:
        staff.phone = data['phone'].strip()
    if 'jobTitle' in data:
        staff.job_title = data['jobTitle'].strip()
    if 'status' in data:
        staff.status = data['status']
    if 'notes' in data:
        staff.notes = data['notes']

    staff.save()

    AuditLog.objects.create(
        actor=request.user,
        action_type='UPDATE_STAFF',
        module='Staff',
        description=f"Updated staff profile for '{staff.name}'"
    )

    return JsonResponse({'message': 'Staff details updated successfully.', 'staff': serialize_staff(staff)})


# ============================================================================
# MODULE 7 & 8: ASSIGNMENTS, RETURNS & STAFF ASSET MATRIX
# ============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def assignments_list_view(request):
    status_filter = request.GET.get('status', '').strip()
    queryset = AssetAssignment.objects.all().select_related('asset', 'staff_member', 'assigned_by')

    if status_filter:
        queryset = queryset.filter(status=status_filter)

    records = []
    today = timezone.now().date()
    for a in queryset.order_by('-created_at'):
        is_overdue = (a.status == 'Active' and a.expected_return_date and a.expected_return_date < today)
        records.append({
            'id': a.id,
            'asset': {
                'id': a.asset.id,
                'tag': a.asset.asset_tag,
                'name': a.asset.name,
                'type': a.asset.asset_type,
            },
            'staff': {
                'id': a.staff_member.id,
                'name': a.staff_member.name,
                'email': a.staff_member.email,
                'department': a.staff_member.department,
            },
            'issueDate': str(a.issue_date),
            'expectedReturnDate': str(a.expected_return_date) if a.expected_return_date else None,
            'actualReturnDate': str(a.actual_return_date) if a.actual_return_date else None,
            'status': a.status,
            'isOverdue': bool(is_overdue),
            'notes': a.notes,
            'assignedBy': a.assigned_by.username if a.assigned_by else 'Admin',
            'createdAt': a.created_at.strftime('%Y-%m-%d %H:%M'),
        })

    return JsonResponse({'assignments': records, 'total': len(records)})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def issue_asset_view(request):
    """
    Module 7: Checkout / Issue Asset workflow with Single-Holder Rule Enforcement
    """
    if not is_admin(request.user):
        return JsonResponse({'error': 'Administrator privileges required to assign assets.'}, status=403)

    data = request.data
    asset_id = data.get('assetId')
    staff_id = data.get('staffId')
    issue_date = data.get('issueDate') or timezone.now().date()
    expected_return_date = data.get('expectedReturnDate') or None
    notes = (data.get('notes') or '').strip()

    if not asset_id or not staff_id:
        return JsonResponse({'error': 'Both Asset and Staff Member must be selected.'}, status=400)

    try:
        asset = Asset.objects.get(id=asset_id)
    except Asset.DoesNotExist:
        return JsonResponse({'error': 'Asset not found.'}, status=404)

    try:
        staff = StaffMember.objects.get(id=staff_id)
    except StaffMember.DoesNotExist:
        return JsonResponse({'error': 'Staff member not found.'}, status=404)

    # 1. SINGLE-HOLDER RULE CHECK: Must be 'Available'
    if asset.status != 'Available':
        return JsonResponse({
            'error': f"Asset '{asset.asset_tag}' cannot be issued because its current status is '{asset.status}'."
        }, status=400)

    # 2. Check if an active assignment already exists
    active_assignment = AssetAssignment.objects.filter(asset=asset, status='Active').first()
    if active_assignment:
        return JsonResponse({
            'error': f"Asset '{asset.asset_tag}' is already assigned to {active_assignment.staff_member.name}."
        }, status=400)

    # 3. Create active assignment
    assignment = AssetAssignment.objects.create(
        asset=asset,
        staff_member=staff,
        issue_date=issue_date,
        expected_return_date=expected_return_date,
        status='Active',
        notes=notes,
        assigned_by=request.user
    )

    # 4. Update asset status to 'Assigned'
    asset.status = 'Assigned'
    asset.save()

    # 5. Audit log
    AuditLog.objects.create(
        actor=request.user,
        action_type='ASSIGN_ASSET',
        module='Assignments',
        description=f"Assigned asset [{asset.asset_tag}] to {staff.name} ({staff.department})"
    )

    return JsonResponse({
        'message': f"Asset [{asset.asset_tag}] successfully assigned to {staff.name}.",
        'assignmentId': assignment.id,
        'asset': serialize_asset(asset)
    }, status=201)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def return_asset_view(request, assignment_id):
    """
    Module 7: Check-In / Return Asset workflow
    """
    if not is_admin(request.user):
        return JsonResponse({'error': 'Administrator privileges required to return assets.'}, status=403)

    try:
        assignment = AssetAssignment.objects.select_related('asset', 'staff_member').get(id=assignment_id)
    except AssetAssignment.DoesNotExist:
        return JsonResponse({'error': 'Assignment record not found.'}, status=404)

    if assignment.status == 'Returned':
        return JsonResponse({'error': 'This asset has already been marked as returned.'}, status=400)

    data = request.data
    actual_return_date = data.get('returnDate') or timezone.now().date()
    return_notes = data.get('notes') or ''

    # 1. Update assignment
    assignment.status = 'Returned'
    assignment.actual_return_date = actual_return_date
    if return_notes:
        assignment.notes = f"{assignment.notes}\n[Return Note]: {return_notes}".strip()
    assignment.save()

    # 2. Revert asset status to 'Available'
    asset = assignment.asset
    asset.status = 'Available'
    asset.save()

    # 3. Audit log
    AuditLog.objects.create(
        actor=request.user,
        action_type='RETURN_ASSET',
        module='Assignments',
        description=f"Returned asset [{asset.asset_tag}] from {assignment.staff_member.name}"
    )

    return JsonResponse({
        'message': f"Asset [{asset.asset_tag}] returned successfully and marked as Available.",
        'asset': serialize_asset(asset)
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def staff_asset_matrix_view(request):
    """
    Module 8: Staff Asset Matrix — groups assigned assets by faculty member
    """
    department_filter = request.GET.get('department', '').strip()
    queryset = StaffMember.objects.filter(status='Active').prefetch_related('assignments__asset')

    if department_filter:
        queryset = queryset.filter(department=department_filter)

    matrix = []
    today = timezone.now().date()
    for s in queryset.order_by('department', 'name'):
        active_assignments = s.assignments.filter(status='Active').select_related('asset')
        devices = []
        for a in active_assignments:
            is_overdue = bool(a.expected_return_date and a.expected_return_date < today)
            devices.append({
                'assignmentId': a.id,
                'assetId': a.asset.id,
                'name': a.asset.name,
                'tag': a.asset.asset_tag,
                'type': a.asset.asset_type,
                'issueDate': str(a.issue_date),
                'expectedReturnDate': str(a.expected_return_date) if a.expected_return_date else None,
                'isOverdue': is_overdue,
            })

        matrix.append({
            'staffId': s.id,
            'name': s.name,
            'email': s.email,
            'department': s.department,
            'phone': s.phone,
            'jobTitle': s.job_title,
            'heldCount': len(devices),
            'devices': devices,
        })

    return JsonResponse({'matrix': matrix, 'totalStaff': len(matrix)})


# ============================================================================
# AUXILIARY ENDPOINTS: LOCATIONS & SUPPLIERS
# ============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def locations_list_view(request):
    locations = Location.objects.filter(is_active=True).order_by('building', 'name')
    data = [{
        'id': loc.id,
        'name': loc.name,
        'type': loc.location_type,
        'building': loc.building,
        'room': loc.room_number,
    } for loc in locations]
    return JsonResponse({'locations': data})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def suppliers_list_view(request):
    suppliers = Supplier.objects.all().order_by('name')
    data = [{
        'id': sup.id,
        'name': sup.name,
        'category': sup.category,
        'contactPerson': sup.contact_person,
        'email': sup.email,
        'phone': sup.phone,
    } for sup in suppliers]
    return JsonResponse({'suppliers': data})
