from django.http import JsonResponse
from django.utils import timezone
from datetime import timedelta
from django.db.models import Q, Count
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Asset, MaintenanceRecord, Location, Supplier, AssetAssignment, AuditLog, UserProfile

def is_admin(user):
    profile = getattr(user, 'profile', None)
    return profile and profile.role == 'ADMIN'

# ============================================================================
# MODULE 9: MAINTENANCE & REPAIRS
# ============================================================================

def serialize_repair(record):
    return {
        'id': record.id,
        'asset': {
            'id': record.asset.id,
            'tag': record.asset.asset_tag,
            'name': record.asset.name,
            'type': record.asset.asset_type,
            'status': record.asset.status,
        },
        'faultDescription': record.fault_description,
        'status': record.status,
        'startDate': str(record.start_date),
        'completionDate': str(record.completion_date) if record.completion_date else None,
        'repairCost': float(record.repair_cost) if record.repair_cost else 0.0,
        'serviceProvider': {
            'id': record.service_provider.id,
            'name': record.service_provider.name,
        } if record.service_provider else None,
        'notes': record.notes,
        'createdAt': record.created_at.strftime('%Y-%m-%d %H:%M'),
    }


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def repairs_list_create_view(request):
    if request.method == 'GET':
        status_filter = request.GET.get('status', '').strip()
        search = request.GET.get('search', '').strip()

        queryset = MaintenanceRecord.objects.all().select_related('asset', 'service_provider')

        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if search:
            queryset = queryset.filter(
                Q(asset__name__icontains=search) |
                Q(asset__asset_tag__icontains=search) |
                Q(fault_description__icontains=search)
            )

        repairs = [serialize_repair(r) for r in queryset.order_by('-created_at')]
        return JsonResponse({'repairs': repairs, 'total': len(repairs)})

    elif request.method == 'POST':
        if not is_admin(request.user):
            return JsonResponse({'error': 'Administrator privileges required to log repair tickets.'}, status=403)

        data = request.data
        asset_id = data.get('assetId')
        fault_description = (data.get('faultDescription') or '').strip()
        service_provider_id = data.get('serviceProviderId')
        repair_cost = data.get('repairCost') or 0.0
        start_date = data.get('startDate') or timezone.now().date()
        notes = (data.get('notes') or '').strip()

        if not asset_id or not fault_description:
            return JsonResponse({'error': 'Asset and fault description are required.'}, status=400)

        try:
            asset = Asset.objects.get(id=asset_id)
        except Asset.DoesNotExist:
            return JsonResponse({'error': 'Asset not found.'}, status=404)

        provider = Supplier.objects.filter(id=service_provider_id).first() if service_provider_id else None

        # 1. Create MaintenanceRecord
        repair = MaintenanceRecord.objects.create(
            asset=asset,
            fault_description=fault_description,
            service_provider=provider,
            repair_cost=repair_cost,
            start_date=start_date,
            status='Requested',
            notes=notes,
        )

        # 2. Update asset status to 'Under Repair'
        asset.status = 'Under Repair'
        asset.save()

        # 3. Audit log
        AuditLog.objects.create(
            actor=request.user,
            action_type='LOG_REPAIR',
            module='Repairs',
            description=f"Logged maintenance ticket #{repair.id} for asset [{asset.asset_tag}]: {fault_description[:60]}"
        )

        return JsonResponse({
            'message': f"Repair ticket logged for [{asset.asset_tag}]. Asset status updated to Under Repair.",
            'repair': serialize_repair(repair)
        }, status=201)


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def repair_detail_view(request, repair_id):
    try:
        repair = MaintenanceRecord.objects.select_related('asset', 'service_provider').get(id=repair_id)
    except MaintenanceRecord.DoesNotExist:
        return JsonResponse({'error': 'Repair record not found.'}, status=404)

    if request.method == 'GET':
        return JsonResponse({'repair': serialize_repair(repair)})

    if not is_admin(request.user):
        return JsonResponse({'error': 'Administrator privileges required.'}, status=403)

    data = request.data
    new_status = data.get('status')
    if new_status and new_status in ['Requested', 'In Progress', 'Completed', 'Cancelled']:
        repair.status = new_status

        # If completed or cancelled, restore asset to Available
        if new_status in ['Completed', 'Cancelled']:
            repair.completion_date = data.get('completionDate') or timezone.now().date()
            repair.asset.status = 'Available'
            repair.asset.save()
        elif new_status == 'In Progress':
            repair.asset.status = 'Under Repair'
            repair.asset.save()

    if 'repairCost' in data:
        repair.repair_cost = data['repairCost'] or 0.0
    if 'notes' in data:
        repair.notes = data['notes']
    if 'serviceProviderId' in data:
        repair.service_provider = Supplier.objects.filter(id=data['serviceProviderId']).first()

    repair.save()

    AuditLog.objects.create(
        actor=request.user,
        action_type='UPDATE_REPAIR',
        module='Repairs',
        description=f"Updated repair ticket #{repair.id} for [{repair.asset.asset_tag}] to status '{repair.status}'"
    )

    return JsonResponse({
        'message': f"Repair ticket #{repair.id} updated successfully.",
        'repair': serialize_repair(repair)
    })


# ============================================================================
# MODULE 10: LOCATIONS & FACILITIES
# ============================================================================

def serialize_location(loc):
    stationed_assets = loc.assets.all().select_related('location')
    return {
        'id': loc.id,
        'name': loc.name,
        'type': loc.location_type,
        'building': loc.building,
        'room': loc.room_number,
        'description': loc.description,
        'isActive': loc.is_active,
        'assetCount': stationed_assets.count(),
        'assets': [{
            'id': a.id,
            'tag': a.asset_tag,
            'name': a.name,
            'type': a.asset_type,
            'status': a.status
        } for a in stationed_assets]
    }


@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def locations_list_create_view(request):
    if request.method == 'GET':
        building_filter = request.GET.get('building', '').strip()
        queryset = Location.objects.filter(is_active=True).prefetch_related('assets')

        if building_filter:
            queryset = queryset.filter(building=building_filter)

        locations = [serialize_location(loc) for loc in queryset.order_by('building', 'name')]
        return JsonResponse({'locations': locations, 'total': len(locations)})

    elif request.method == 'POST':
        if not request.user.is_authenticated or not is_admin(request.user):
            return JsonResponse({'error': 'Administrator privileges required to add locations.'}, status=403)

        data = request.data
        name = (data.get('name') or '').strip()
        location_type = data.get('type') or 'Classroom'
        building = (data.get('building') or 'Main Campus').strip()
        room_number = (data.get('room') or '').strip()
        description = (data.get('description') or '').strip()

        if not name:
            return JsonResponse({'error': 'Location name is required.'}, status=400)

        loc = Location.objects.create(
            name=name,
            location_type=location_type,
            building=building,
            room_number=room_number,
            description=description,
            is_active=True
        )

        AuditLog.objects.create(
            actor=request.user,
            action_type='CREATE_LOCATION',
            module='Locations',
            description=f"Created campus location '{loc.name}' in {loc.building}"
        )

        return JsonResponse({
            'message': f"Location '{loc.name}' registered successfully.",
            'location': serialize_location(loc)
        }, status=201)


@api_view(['PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def location_detail_view(request, location_id):
    try:
        loc = Location.objects.prefetch_related('assets').get(id=location_id)
    except Location.DoesNotExist:
        return JsonResponse({'error': 'Location not found.'}, status=404)

    if not is_admin(request.user):
        return JsonResponse({'error': 'Administrator privileges required.'}, status=403)

    if request.method in ['PUT', 'PATCH']:
        data = request.data
        if 'name' in data and data['name'].strip():
            loc.name = data['name'].strip()
        if 'type' in data:
            loc.location_type = data['type']
        if 'building' in data:
            loc.building = data['building'].strip()
        if 'room' in data:
            loc.room_number = data['room'].strip()
        if 'description' in data:
            loc.description = data['description']

        loc.save()

        AuditLog.objects.create(
            actor=request.user,
            action_type='UPDATE_LOCATION',
            module='Locations',
            description=f"Updated campus location '{loc.name}'"
        )

        return JsonResponse({'message': 'Location updated successfully.', 'location': serialize_location(loc)})

    elif request.method == 'DELETE':
        if loc.assets.count() > 0:
            return JsonResponse({
                'error': f"Cannot delete '{loc.name}' because {loc.assets.count()} asset(s) are stationed here. Reassign them first."
            }, status=400)

        name = loc.name
        loc.delete()

        AuditLog.objects.create(
            actor=request.user,
            action_type='DELETE_LOCATION',
            module='Locations',
            description=f"Deleted location '{name}'"
        )

        return JsonResponse({'message': f"Location '{name}' deleted successfully."})


# ============================================================================
# MODULE 11: ALERTS & NOTIFICATIONS HUB
# ============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def alerts_hub_view(request):
    today = timezone.now().date()
    in_60_days = today + timedelta(days=60)

    # 1. Overdue Returns
    overdue_assignments = AssetAssignment.objects.filter(
        status='Active',
        expected_return_date__lt=today
    ).select_related('asset', 'staff_member')

    overdue_list = [{
        'assignmentId': a.id,
        'asset': {
            'id': a.asset.id,
            'tag': a.asset.asset_tag,
            'name': a.asset.name,
            'type': a.asset.asset_type,
        },
        'holder': {
            'id': a.staff_member.id,
            'name': a.staff_member.name,
            'department': a.staff_member.department,
            'email': a.staff_member.email,
        },
        'issueDate': str(a.issue_date),
        'expectedReturnDate': str(a.expected_return_date),
        'daysOverdue': (today - a.expected_return_date).days,
    } for a in overdue_assignments]

    # 2. Warranty Expirations (< 60 days or already expired)
    expiring_assets = Asset.objects.filter(
        warranty_expiry__isnull=False,
        warranty_expiry__lte=in_60_days
    ).select_related('location')

    warranty_list = [{
        'id': a.id,
        'tag': a.asset_tag,
        'name': a.name,
        'type': a.asset_type,
        'warrantyExpiry': str(a.warranty_expiry),
        'isExpired': a.warranty_expiry < today,
        'daysRemaining': (a.warranty_expiry - today).days,
        'location': a.location.name if a.location else 'Main Store',
    } for a in expiring_assets]

    # 3. Active / Pending Repairs
    active_repairs = MaintenanceRecord.objects.filter(
        status__in=['Requested', 'In Progress']
    ).select_related('asset', 'service_provider')

    repair_list = [{
        'id': r.id,
        'assetTag': r.asset.asset_tag,
        'assetName': r.asset.name,
        'fault': r.fault_description,
        'status': r.status,
        'startDate': str(r.start_date),
        'provider': r.service_provider.name if r.service_provider else 'Internal IT',
    } for r in active_repairs]

    total_alerts = len(overdue_list) + len(warranty_list) + len(repair_list)

    return JsonResponse({
        'totalAlerts': total_alerts,
        'overdueReturns': overdue_list,
        'overdueCount': len(overdue_list),
        'warrantyAlerts': warranty_list,
        'warrantyCount': len(warranty_list),
        'activeRepairs': repair_list,
        'repairCount': len(repair_list),
    })


# ============================================================================
# MODULE 12: IMMUTABLE AUDIT TRAIL
# ============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def audit_trail_view(request):
    module_filter = request.GET.get('module', '').strip()
    search = request.GET.get('search', '').strip()

    queryset = AuditLog.objects.all().select_related('actor')

    if module_filter:
        queryset = queryset.filter(module=module_filter)
    if search:
        queryset = queryset.filter(
            Q(description__icontains=search) |
            Q(action_type__icontains=search) |
            Q(actor__username__icontains=search) |
            Q(actor__first_name__icontains=search)
        )

    logs = [{
        'id': log.id,
        'actor': {
            'username': log.actor.username if log.actor else 'System',
            'name': f"{log.actor.first_name} {log.actor.last_name}".strip() if log.actor else 'System',
        },
        'actionType': log.action_type,
        'module': log.module,
        'description': log.description,
        'timestamp': log.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
    } for log in queryset.order_by('-timestamp')[:100]]

    return JsonResponse({'logs': logs, 'total': len(logs)})
