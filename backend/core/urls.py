from django.urls import path
from . import views
from . import views_auth
from . import views_assets
from . import views_operations
from . import views_advanced

urlpatterns = [
    # System
    path('health/', views.health_check, name='health_check'),
    path('system/info/', views.system_info, name='system_info'),

    # Authentication & Access Control (Modules 2, 3, 4)
    path('auth/register/', views_auth.register_view, name='auth_register'),
    path('auth/login/', views_auth.login_view, name='auth_login'),
    path('auth/logout/', views_auth.logout_view, name='auth_logout'),
    path('auth/me/', views_auth.me_view, name='auth_me'),
    path('auth/change-password/', views_auth.change_password_view, name='auth_change_password'),
    path('auth/users/', views_auth.list_accounts_view, name='auth_users'),
    path('auth/users/<int:user_id>/role/', views_auth.update_user_role_view, name='auth_user_role'),

    # Part 3: Assets Management (Module 5)
    path('assets/', views_assets.assets_list_create_view, name='assets_list_create'),
    path('assets/<int:asset_id>/', views_assets.asset_detail_view, name='asset_detail'),

    # Part 3: Staff Directory (Module 6)
    path('staff/', views_assets.staff_list_create_view, name='staff_list_create'),
    path('staff/<int:staff_id>/', views_assets.staff_detail_view, name='staff_detail'),

    # Part 3: Assignments & Returns (Module 7 & 8)
    path('assignments/', views_assets.assignments_list_view, name='assignments_list'),
    path('assignments/issue/', views_assets.issue_asset_view, name='assignments_issue'),
    path('assignments/<int:assignment_id>/return/', views_assets.return_asset_view, name='assignments_return'),
    path('assignments/staff-matrix/', views_assets.staff_asset_matrix_view, name='assignments_staff_matrix'),

    # Part 4: Maintenance & Repairs (Module 9)
    path('repairs/', views_operations.repairs_list_create_view, name='repairs_list_create'),
    path('repairs/<int:repair_id>/', views_operations.repair_detail_view, name='repair_detail'),

    # Part 4: Locations & Facilities (Module 10)
    path('locations/', views_operations.locations_list_create_view, name='locations_list_create'),
    path('locations/<int:location_id>/', views_operations.location_detail_view, name='location_detail'),

    # Part 4: Alerts & Notifications Hub (Module 11)
    path('alerts/', views_operations.alerts_hub_view, name='alerts_hub'),

    # Part 4: Activity Log & Audit Trail (Module 12)
    path('audit/', views_operations.audit_trail_view, name='audit_trail'),

    # Part 5: Software Licenses (Module 13)
    path('licenses/', views_advanced.licenses_list_create_view, name='licenses_list_create'),
    path('licenses/<int:license_id>/', views_advanced.license_detail_view, name='license_detail'),

    # Part 5: Hardware Components (Module 14)
    path('components/', views_advanced.components_list_create_view, name='components_list_create'),
    path('components/<int:component_id>/', views_advanced.component_detail_view, name='component_detail'),

    # Part 5: Suppliers & Service Providers (Module 15)
    path('suppliers/', views_advanced.suppliers_list_create_view, name='suppliers_list_create'),
    path('suppliers/<int:supplier_id>/', views_advanced.supplier_detail_view, name='supplier_detail'),

    # Part 5: Consumables & Stock Tracking (Module 16)
    path('consumables/', views_advanced.consumables_list_create_view, name='consumables_list_create'),
    path('consumables/<int:item_id>/adjust/', views_advanced.consumable_adjust_stock_view, name='consumables_adjust'),

    # Part 5: Reports & Analytics Engine (Module 17)
    path('reports/summary/', views_advanced.reports_summary_view, name='reports_summary'),
    path('reports/export/assets/', views_advanced.export_assets_csv, name='export_assets_csv'),
    path('reports/export/assignments/', views_advanced.export_assignments_csv, name='export_assignments_csv'),

    # Part 5: System & Branding Settings (Module 18)
    path('settings/', views_advanced.school_settings_view, name='school_settings'),
]

