import csv
from django.http import JsonResponse, HttpResponse
from django.utils import timezone
from django.db.models import Sum, Count, Q
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import (
    SoftwareLicense,
    HardwareComponent,
    ConsumableItem,
    StockMovement,
    Supplier,
    Asset,
    AssetAssignment,
    MaintenanceRecord,
    SchoolSettings,
    AuditLog,
    UserProfile
)

def is_admin(user):
    profile = getattr(user, 'profile', None)
    return profile and profile.role == 'ADMIN'

# ============================================================================
# MODULE 13: SOFTWARE LICENSES
# ============================================================================

def serialize_license(lic):
    return {
        'id': lic.id,
        'name': lic.software_name,
        'publisher': lic.publisher,
        'keyMasked': lic.license_key_masked or '••••-••••-••••-8941',
        'purchasedSeats': lic.purchased_seats,
        'allocatedSeats': lic.allocated_seats,
        'availableSeats': max(0, lic.purchased_seats - lic.allocated_seats),
        'purchaseDate': str(lic.purchase_date) if lic.purchase_date else None,
        'expirationDate': str(lic.expiration_date) if lic.expiration_date else None,
        'renewalCost': float(lic.renewal_cost) if lic.renewal_cost else 0.0,
        'status': lic.status,
        'createdAt': lic.created_at.strftime('%Y-%m-%d %H:%M'),
    }


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def licenses_list_create_view(request):
    if request.method == 'GET':
        search = request.GET.get('search', '').strip()
        queryset = SoftwareLicense.objects.all()
        if search:
            queryset = queryset.filter(
                Q(software_name__icontains=search) |
                Q(publisher__icontains=search)
            )
        licenses = [serialize_license(l) for l in queryset.order_by('software_name')]
        return JsonResponse({'licenses': licenses, 'total': len(licenses)})

    elif request.method == 'POST':
        if not is_admin(request.user):
            return JsonResponse({'error': 'Administrator privileges required.'}, status=403)

        data = request.data
        name = (data.get('name') or '').strip()
        publisher = (data.get('publisher') or '').strip()
        raw_key = (data.get('licenseKey') or '').strip()
        purchased_seats = int(data.get('purchasedSeats') or 1)
        purchase_date = data.get('purchaseDate') or None
        expiration_date = data.get('expirationDate') or None
        renewal_cost = data.get('renewalCost') or 0.0

        if not name or not publisher:
            return JsonResponse({'error': 'Software name and publisher are required.'}, status=400)

        # Mask key for security: keep last 4 chars
        masked_key = f"••••-••••-••••-{raw_key[-4:]}" if len(raw_key) >= 4 else '••••-••••-••••-KEY'

        lic = SoftwareLicense.objects.create(
            software_name=name,
            publisher=publisher,
            license_key_masked=masked_key,
            purchased_seats=purchased_seats,
            allocated_seats=0,
            purchase_date=purchase_date if purchase_date else None,
            expiration_date=expiration_date if expiration_date else None,
            renewal_cost=renewal_cost,
            status='Active'
        )

        AuditLog.objects.create(
            actor=request.user,
            action_type='CREATE_LICENSE',
            module='Software',
            description=f"Added software license '{lic.software_name}' ({lic.purchased_seats} seats)"
        )

        return JsonResponse({'message': 'Software license registered.', 'license': serialize_license(lic)}, status=201)


@api_view(['PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def license_detail_view(request, license_id):
    try:
        lic = SoftwareLicense.objects.get(id=license_id)
    except SoftwareLicense.DoesNotExist:
        return JsonResponse({'error': 'License not found.'}, status=404)

    if not is_admin(request.user):
        return JsonResponse({'error': 'Administrator privileges required.'}, status=403)

    if request.method == 'PATCH':
        data = request.data
        if 'name' in data and data['name'].strip():
            lic.software_name = data['name'].strip()
        if 'publisher' in data:
            lic.publisher = data['publisher'].strip()
        if 'purchasedSeats' in data:
            lic.purchased_seats = int(data['purchasedSeats'])
        if 'renewalCost' in data:
            lic.renewal_cost = data['renewalCost']
        if 'expirationDate' in data:
            lic.expiration_date = data['expirationDate'] or None
        if 'action' in data:
            # Allocate or deallocate seat
            if data['action'] == 'allocate':
                if lic.allocated_seats < lic.purchased_seats:
                    lic.allocated_seats += 1
                else:
                    return JsonResponse({'error': 'No available seats left to allocate.'}, status=400)
            elif data['action'] == 'deallocate':
                if lic.allocated_seats > 0:
                    lic.allocated_seats -= 1

        lic.save()
        return JsonResponse({'message': 'License updated.', 'license': serialize_license(lic)})

    elif request.method == 'DELETE':
        name = lic.software_name
        lic.delete()
        AuditLog.objects.create(actor=request.user, action_type='DELETE_LICENSE', module='Software', description=f"Deleted license '{name}'")
        return JsonResponse({'message': f"License '{name}' deleted."})


# ============================================================================
# MODULE 14: HARDWARE COMPONENTS & MODULAR SPARES
# ============================================================================

def serialize_component(comp):
    return {
        'id': comp.id,
        'name': comp.name,
        'type': comp.component_type,
        'serialNumber': comp.serial_number,
        'condition': comp.condition,
        'repairStatus': comp.repair_status,
        'parentAsset': {
            'id': comp.parent_asset.id,
            'tag': comp.parent_asset.asset_tag,
            'name': comp.parent_asset.name,
        } if comp.parent_asset else None,
        'notes': comp.notes,
        'createdAt': comp.created_at.strftime('%Y-%m-%d %H:%M'),
    }


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def components_list_create_view(request):
    if request.method == 'GET':
        comp_type = request.GET.get('type', '').strip()
        search = request.GET.get('search', '').strip()

        queryset = HardwareComponent.objects.all().select_related('parent_asset')
        if comp_type:
            queryset = queryset.filter(component_type=comp_type)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(serial_number__icontains=search) |
                Q(parent_asset__asset_tag__icontains=search)
            )

        components = [serialize_component(c) for c in queryset.order_by('-created_at')]
        return JsonResponse({'components': components, 'total': len(components)})

    elif request.method == 'POST':
        if not is_admin(request.user):
            return JsonResponse({'error': 'Administrator privileges required.'}, status=403)

        data = request.data
        name = (data.get('name') or '').strip()
        component_type = data.get('type') or 'RAM'
        serial_number = (data.get('serialNumber') or '').strip()
        condition = data.get('condition') or 'Good'
        parent_asset_id = data.get('parentAssetId')
        notes = (data.get('notes') or '').strip()

        if not name:
            return JsonResponse({'error': 'Component name is required.'}, status=400)

        parent_asset = Asset.objects.filter(id=parent_asset_id).first() if parent_asset_id else None

        comp = HardwareComponent.objects.create(
            name=name,
            component_type=component_type,
            serial_number=serial_number,
            condition=condition,
            parent_asset=parent_asset,
            notes=notes
        )

        AuditLog.objects.create(
            actor=request.user,
            action_type='CREATE_COMPONENT',
            module='Components',
            description=f"Added component '{comp.name}' ({comp.component_type})"
        )

        return JsonResponse({'message': 'Component registered.', 'component': serialize_component(comp)}, status=201)


@api_view(['PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def component_detail_view(request, component_id):
    try:
        comp = HardwareComponent.objects.select_related('parent_asset').get(id=component_id)
    except HardwareComponent.DoesNotExist:
        return JsonResponse({'error': 'Component not found.'}, status=404)

    if not is_admin(request.user):
        return JsonResponse({'error': 'Administrator privileges required.'}, status=403)

    if request.method == 'PATCH':
        data = request.data
        if 'name' in data and data['name'].strip():
            comp.name = data['name'].strip()
        if 'type' in data:
            comp.component_type = data['type']
        if 'serialNumber' in data:
            comp.serial_number = data['serialNumber'].strip()
        if 'condition' in data:
            comp.condition = data['condition']
        if 'parentAssetId' in data:
            comp.parent_asset = Asset.objects.filter(id=data['parentAssetId']).first() if data['parentAssetId'] else None
        if 'notes' in data:
            comp.notes = data['notes']

        comp.save()
        return JsonResponse({'message': 'Component updated.', 'component': serialize_component(comp)})

    elif request.method == 'DELETE':
        name = comp.name
        comp.delete()
        return JsonResponse({'message': f"Component '{name}' deleted."})


# ============================================================================
# MODULE 15: SUPPLIERS & SERVICE VENDORS
# ============================================================================

def serialize_supplier(sup):
    return {
        'id': sup.id,
        'name': sup.name,
        'category': sup.category,
        'contactPerson': sup.contact_person,
        'email': sup.email,
        'phone': sup.phone,
        'address': sup.address,
        'assetCount': sup.assets.count(),
        'createdAt': sup.created_at.strftime('%Y-%m-%d %H:%M'),
    }


@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def suppliers_list_create_view(request):
    if request.method == 'GET':
        search = request.GET.get('search', '').strip()
        category = request.GET.get('category', '').strip()
        queryset = Supplier.objects.all().prefetch_related('assets')

        if category:
            queryset = queryset.filter(category=category)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(contact_person__icontains=search) |
                Q(email__icontains=search)
            )

        suppliers = [serialize_supplier(s) for s in queryset.order_by('name')]
        return JsonResponse({'suppliers': suppliers, 'total': len(suppliers)})

    elif request.method == 'POST':
        if not request.user.is_authenticated or not is_admin(request.user):
            return JsonResponse({'error': 'Administrator privileges required.'}, status=403)

        data = request.data
        name = (data.get('name') or '').strip()
        category = data.get('category') or 'Hardware Vendor'
        contact_person = (data.get('contactPerson') or '').strip()
        email = (data.get('email') or '').strip()
        phone = (data.get('phone') or '').strip()
        address = (data.get('address') or '').strip()

        if not name:
            return JsonResponse({'error': 'Supplier name is required.'}, status=400)

        sup = Supplier.objects.create(
            name=name,
            category=category,
            contact_person=contact_person,
            email=email,
            phone=phone,
            address=address
        )

        AuditLog.objects.create(
            actor=request.user,
            action_type='CREATE_SUPPLIER',
            module='Suppliers',
            description=f"Created supplier record for '{sup.name}'"
        )

        return JsonResponse({'message': 'Supplier created.', 'supplier': serialize_supplier(sup)}, status=201)


@api_view(['PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def supplier_detail_view(request, supplier_id):
    try:
        sup = Supplier.objects.prefetch_related('assets').get(id=supplier_id)
    except Supplier.DoesNotExist:
        return JsonResponse({'error': 'Supplier not found.'}, status=404)

    if not is_admin(request.user):
        return JsonResponse({'error': 'Administrator privileges required.'}, status=403)

    if request.method in ['PUT', 'PATCH']:
        data = request.data
        if 'name' in data and data['name'].strip():
            sup.name = data['name'].strip()
        if 'category' in data:
            sup.category = data['category']
        if 'contactPerson' in data:
            sup.contact_person = data['contactPerson'].strip()
        if 'email' in data:
            sup.email = data['email'].strip()
        if 'phone' in data:
            sup.phone = data['phone'].strip()
        if 'address' in data:
            sup.address = data['address'].strip()

        sup.save()
        return JsonResponse({'message': 'Supplier updated.', 'supplier': serialize_supplier(sup)})

    elif request.method == 'DELETE':
        name = sup.name
        sup.delete()
        return JsonResponse({'message': f"Supplier '{name}' deleted."})


# ============================================================================
# MODULE 16: CONSUMABLES & STOCK INVENTORY
# ============================================================================

def serialize_consumable(item):
    return {
        'id': item.id,
        'name': item.name,
        'category': item.category,
        'quantity': item.quantity,
        'minimumThreshold': item.minimum_threshold,
        'unit': item.unit,
        'unitCost': float(item.unit_cost) if item.unit_cost else 0.0,
        'storageLocation': item.storage_location,
        'isLowStock': item.is_low_stock,
        'createdAt': item.created_at.strftime('%Y-%m-%d %H:%M'),
    }


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def consumables_list_create_view(request):
    if request.method == 'GET':
        search = request.GET.get('search', '').strip()
        category = request.GET.get('category', '').strip()
        queryset = ConsumableItem.objects.all()

        if category:
            queryset = queryset.filter(category=category)
        if search:
            queryset = queryset.filter(Q(name__icontains=search) | Q(category__icontains=search))

        items = [serialize_consumable(c) for c in queryset.order_by('name')]
        return JsonResponse({'consumables': items, 'total': len(items)})

    elif request.method == 'POST':
        if not is_admin(request.user):
            return JsonResponse({'error': 'Administrator privileges required.'}, status=403)

        data = request.data
        name = (data.get('name') or '').strip()
        category = data.get('category') or 'Printing'
        quantity = int(data.get('quantity') or 0)
        minimum_threshold = int(data.get('minimumThreshold') or 5)
        unit = data.get('unit') or 'pcs'
        unit_cost = data.get('unitCost') or 0.0
        storage_location = (data.get('storageLocation') or 'Central IT Store').strip()

        if not name:
            return JsonResponse({'error': 'Consumable item name is required.'}, status=400)

        item = ConsumableItem.objects.create(
            name=name,
            category=category,
            quantity=quantity,
            minimum_threshold=minimum_threshold,
            unit=unit,
            unit_cost=unit_cost,
            storage_location=storage_location
        )

        AuditLog.objects.create(
            actor=request.user,
            action_type='CREATE_CONSUMABLE',
            module='Consumables',
            description=f"Added consumable '{item.name}' (Stock: {item.quantity} {item.unit})"
        )

        return JsonResponse({'message': 'Consumable item added.', 'consumable': serialize_consumable(item)}, status=201)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def consumable_adjust_stock_view(request, item_id):
    """
    Module 16: Adjust consumable stock (Addition / Restock or Usage / Dispense)
    """
    if not is_admin(request.user):
        return JsonResponse({'error': 'Administrator privileges required.'}, status=403)

    try:
        item = ConsumableItem.objects.get(id=item_id)
    except ConsumableItem.DoesNotExist:
        return JsonResponse({'error': 'Consumable item not found.'}, status=404)

    data = request.data
    movement_type = data.get('type') # 'Addition' or 'Usage'
    try:
        qty = int(data.get('quantity') or 0)
    except ValueError:
        return JsonResponse({'error': 'Invalid quantity value.'}, status=400)

    notes = (data.get('notes') or '').strip()

    if qty <= 0:
        return JsonResponse({'error': 'Quantity must be greater than zero.'}, status=400)

    if movement_type == 'Usage':
        if item.quantity < qty:
            return JsonResponse({'error': f"Insufficient stock. Available: {item.quantity} {item.unit}."}, status=400)
        item.quantity -= qty
    elif movement_type == 'Addition':
        item.quantity += qty
    else:
        return JsonResponse({'error': "Invalid movement type. Choose 'Addition' or 'Usage'."}, status=400)

    item.save()

    # Log movement
    StockMovement.objects.create(
        consumable=item,
        movement_type=movement_type,
        quantity=qty,
        recorded_by=request.user,
        notes=notes
    )

    AuditLog.objects.create(
        actor=request.user,
        action_type='STOCK_ADJUSTMENT',
        module='Consumables',
        description=f"{movement_type} of {qty} {item.unit} for '{item.name}'. New balance: {item.quantity}"
    )

    return JsonResponse({
        'message': f"Stock updated. Current balance: {item.quantity} {item.unit}.",
        'consumable': serialize_consumable(item)
    })


# ============================================================================
# MODULE 17: REPORTS & ANALYTICS ENGINE
# ============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def reports_summary_view(request):
    total_assets = Asset.objects.count()

    # Group by type
    by_type = list(Asset.objects.values('asset_type').annotate(count=Count('id')).order_by('-count'))

    # Group by status
    by_status = list(Asset.objects.values('status').annotate(count=Count('id')).order_by('-count'))

    # Group by department (via assignments)
    by_dept = list(
        AssetAssignment.objects.filter(status='Active')
        .values('staff_member__department')
        .annotate(count=Count('id'))
        .order_by('-count')
    )

    # Financial valuation
    total_val = Asset.objects.aggregate(total=Sum('purchase_price'))['total'] or 0.0
    repair_exp = MaintenanceRecord.objects.aggregate(total=Sum('repair_cost'))['total'] or 0.0
    active_licenses = SoftwareLicense.objects.count()

    return JsonResponse({
        'totalAssets': total_assets,
        'byType': by_type,
        'byStatus': by_status,
        'byDepartment': [{'department': d['staff_member__department'] or 'Unassigned', 'count': d['count']} for d in by_dept],
        'financials': {
            'totalAssetValuation': float(total_val),
            'totalRepairExpense': float(repair_exp),
            'activeLicensesCount': active_licenses,
        }
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_assets_csv(request):
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="harvest_assets_catalog.csv"'

    writer = csv.writer(response)
    writer.writerow(['ID', 'Tag', 'Name', 'Type', 'Status', 'Current Holder', 'Location', 'Serial Number', 'Purchase Price', 'Warranty Expiry'])

    for a in Asset.objects.all().select_related('location').prefetch_related('assignments__staff_member'):
        holder = a.current_holder
        loc_name = a.location.name if a.location else 'Central IT Store'
        writer.writerow([a.id, a.asset_tag, a.name, a.asset_type, a.status, holder, loc_name, a.serial_number, a.purchase_price or '', a.warranty_expiry or ''])

    return response


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_assignments_csv(request):
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="harvest_assignments_log.csv"'

    writer = csv.writer(response)
    writer.writerow(['Assignment ID', 'Asset Tag', 'Asset Name', 'Staff Name', 'Department', 'Email', 'Issue Date', 'Expected Return', 'Status'])

    for asg in AssetAssignment.objects.all().select_related('asset', 'staff_member'):
        writer.writerow([
            asg.id,
            asg.asset.asset_tag,
            asg.asset.name,
            asg.staff_member.name,
            asg.staff_member.department,
            asg.staff_member.email,
            asg.issue_date,
            asg.expected_return_date or '',
            asg.status
        ])

    return response


# ============================================================================
# MODULE 18: SYSTEM SETTINGS & BRANDING
# ============================================================================

@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def school_settings_view(request):
    settings, _ = SchoolSettings.objects.get_or_create(id=1)

    if request.method == 'GET':
        return JsonResponse({
            'schoolName': settings.school_name,
            'tagline': settings.tagline,
            'logoUrl': settings.logo_url,
            'primaryColor': settings.primary_color,
            'secondaryColor': settings.secondary_color,
            'accentColor': settings.accent_color,
            'defaultAssetType': settings.default_asset_type,
            'overdueDaysAlert': settings.overdue_days_alert,
        })

    elif request.method == 'PATCH':
        if not is_admin(request.user):
            return JsonResponse({'error': 'Administrator privileges required.'}, status=403)

        data = request.data
        if 'schoolName' in data and data['schoolName'].strip():
            settings.school_name = data['schoolName'].strip()
        if 'tagline' in data:
            settings.tagline = data['tagline'].strip()
        if 'primaryColor' in data:
            settings.primary_color = data['primaryColor']
        if 'secondaryColor' in data:
            settings.secondary_color = data['secondaryColor']
        if 'accentColor' in data:
            settings.accent_color = data['accentColor']
        if 'defaultAssetType' in data:
            settings.default_asset_type = data['defaultAssetType']

        settings.save()

        AuditLog.objects.create(
            actor=request.user,
            action_type='UPDATE_SETTINGS',
            module='Settings',
            description="Updated school institutional branding and operational settings."
        )

        return JsonResponse({'message': 'System settings updated successfully.'})
