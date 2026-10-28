import re
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from .models import UserProfile, AuditLog, SchoolSettings

def get_user_data(user):
    profile, _ = UserProfile.objects.get_or_create(user=user)
    return {
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'name': f"{user.first_name} {user.last_name}".strip() or user.username,
        'role': profile.role,
        'department': profile.department,
        'phone': profile.phone,
        'isAdmin': profile.role == 'ADMIN',
        'isStaff': profile.role == 'STAFF',
    }

@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    """
    Module 2: Registration
    - Validates email format, presence, uniqueness.
    - Validates password length and matching confirmation.
    - Hashes password securely via Django's PBKDF2.
    - Assigns default restricted 'STAFF' role (initial bootstrap user gets 'ADMIN').
    - Never trusts client-submitted role.
    """
    data = request.data
    email = (data.get('email') or '').strip().lower()
    name = (data.get('name') or '').strip()
    password = data.get('password') or ''
    confirm_password = data.get('confirmPassword') or ''
    department = (data.get('department') or '').strip()

    # 1. Validation
    if not email:
        return JsonResponse({'error': 'Email address is required.'}, status=400)

    email_regex = r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'
    if not re.match(email_regex, email):
        return JsonResponse({'error': 'Please provide a valid email format (e.g. user@harvest.edu).'}, status=400)

    if not password:
        return JsonResponse({'error': 'Password is required.'}, status=400)

    if len(password) < 8:
        return JsonResponse({'error': 'Password must be at least 8 characters long.'}, status=400)

    if password != confirm_password:
        return JsonResponse({'error': 'Passwords do not match. Please re-enter.'}, status=400)

    # 2. Check for duplicate account
    if User.objects.filter(email__iexact=email).exists() or User.objects.filter(username__iexact=email).exists():
        return JsonResponse({'error': 'An account with this email address already exists.'}, status=400)

    # 3. Determine role securely (Initial bootstrap = ADMIN, all subsequent = STAFF)
    is_first_user = (User.objects.count() == 0)
    assigned_role = 'ADMIN' if is_first_user else 'STAFF'

    # 4. Create user and profile
    first_name = name.split(' ')[0] if name else ''
    last_name = ' '.join(name.split(' ')[1:]) if len(name.split(' ')) > 1 else ''

    user = User.objects.create_user(
        username=email,
        email=email,
        password=password,
        first_name=first_name,
        last_name=last_name,
        is_staff=is_first_user,
        is_superuser=is_first_user
    )

    profile = UserProfile.objects.create(
        user=user,
        role=assigned_role,
        department=department
    )

    # 5. Log audit trail
    AuditLog.objects.create(
        actor=user,
        action_type='REGISTER',
        module='Auth',
        description=f"New user registered: {email} with role {assigned_role}"
    )

    return JsonResponse({
        'message': 'Account registered successfully. Please log in with your credentials.',
        'user': get_user_data(user),
    }, status=201)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """
    Module 3: Login
    - Authenticates registered users by email and password.
    - Rejects invalid credentials with a clear message.
    - Starts secure session and returns role-based user data.
    """
    data = request.data
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''

    if not email or not password:
        return JsonResponse({'error': 'Please provide both email and password.'}, status=400)

    # Lookup user by email or username
    user_obj = User.objects.filter(email__iexact=email).first() or User.objects.filter(username__iexact=email).first()
    if not user_obj:
        return JsonResponse({'error': 'Invalid email or password. Please verify your credentials.'}, status=401)

    user = authenticate(request, username=user_obj.username, password=password)
    if not user:
        return JsonResponse({'error': 'Invalid email or password. Please verify your credentials.'}, status=401)

    if not user.is_active:
        return JsonResponse({'error': 'This account has been deactivated. Please contact the IT administrator.'}, status=403)

    login(request, user)

    # Audit log
    AuditLog.objects.create(
        actor=user,
        action_type='LOGIN',
        module='Auth',
        description=f"User {user.email} logged in successfully."
    )

    return JsonResponse({
        'message': 'Login successful.',
        'user': get_user_data(user),
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """
    Module 3: Logout
    - Clears authenticated session and state.
    """
    user = request.user
    AuditLog.objects.create(
        actor=user,
        action_type='LOGOUT',
        module='Auth',
        description=f"User {user.email} logged out."
    )
    logout(request)
    return JsonResponse({'message': 'Logged out successfully.'})


@api_view(['GET'])
@permission_classes([AllowAny])
def me_view(request):
    """
    Returns current authenticated user session details or unauthenticated status.
    """
    if not request.user.is_authenticated:
        return JsonResponse({'authenticated': False}, status=200)

    return JsonResponse({
        'authenticated': True,
        'user': get_user_data(request.user),
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password_view(request):
    """
    Module 22.2: Password change functionality
    - Verifies old password.
    - Validates new password.
    - Saves hashed password securely.
    """
    user = request.user
    data = request.data
    current_password = data.get('currentPassword') or ''
    new_password = data.get('newPassword') or ''
    confirm_new_password = data.get('confirmNewPassword') or ''

    if not current_password or not new_password:
        return JsonResponse({'error': 'Current and new passwords are required.'}, status=400)

    if not user.check_password(current_password):
        return JsonResponse({'error': 'Current password does not match.'}, status=400)

    if len(new_password) < 8:
        return JsonResponse({'error': 'New password must be at least 8 characters long.'}, status=400)

    if new_password != confirm_new_password:
        return JsonResponse({'error': 'New password and confirmation do not match.'}, status=400)

    user.set_password(new_password)
    user.save()

    AuditLog.objects.create(
        actor=user,
        action_type='PASSWORD_CHANGE',
        module='Auth',
        description=f"Password changed for {user.email}"
    )

    # Keep user logged in with new password
    login(request, user)

    return JsonResponse({'message': 'Password changed successfully.'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_accounts_view(request):
    """
    Module 22.3: Account & Role Management (ADMIN only)
    """
    profile = getattr(request.user, 'profile', None)
    if not profile or profile.role != 'ADMIN':
        return JsonResponse({'error': 'Access denied. Administrator privileges required.'}, status=403)

    users = User.objects.all().select_related('profile').order_by('id')
    user_list = []
    for u in users:
        prof = getattr(u, 'profile', None)
        user_list.append({
            'id': u.id,
            'email': u.email,
            'name': f"{u.first_name} {u.last_name}".strip() or u.username,
            'role': prof.role if prof else 'STAFF',
            'department': prof.department if prof else '',
            'isActive': u.is_active,
            'dateJoined': u.date_joined.strftime('%Y-%m-%d %H:%M'),
        })

    return JsonResponse({'users': user_list})


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_user_role_view(request, user_id):
    """
    Module 22.3: Update user role (ADMIN only)
    Prevents unauthorized privilege escalation.
    """
    curr_profile = getattr(request.user, 'profile', None)
    if not curr_profile or curr_profile.role != 'ADMIN':
        return JsonResponse({'error': 'Access denied. Administrator privileges required.'}, status=403)

    try:
        target_user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return JsonResponse({'error': 'User not found.'}, status=404)

    new_role = request.data.get('role')
    if new_role not in ['ADMIN', 'STAFF']:
        return JsonResponse({'error': 'Invalid role specified.'}, status=400)

    # Prevent demoting oneself
    if target_user.id == request.user.id and new_role != 'ADMIN':
        return JsonResponse({'error': 'You cannot revoke your own administrator privileges.'}, status=400)

    target_profile, _ = UserProfile.objects.get_or_create(user=target_user)
    target_profile.role = new_role
    target_profile.save()

    AuditLog.objects.create(
        actor=request.user,
        action_type='ROLE_UPDATE',
        module='Auth',
        description=f"Updated role of {target_user.email} to {new_role}"
    )

    return JsonResponse({'message': f"Role for {target_user.email} updated to {new_role}."})
