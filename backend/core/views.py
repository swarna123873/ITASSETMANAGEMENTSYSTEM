from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    return JsonResponse({
        'status': 'healthy',
        'service': 'School AssetHub API',
        'institution': 'Harvest International School',
        'motto': 'Education Beyond Classrooms',
        'version': '1.0.0'
    })

@api_view(['GET'])
@permission_classes([AllowAny])
def system_info(request):
    logo_url = request.build_absolute_uri('/media/harvest_logo.jpg')
    return JsonResponse({
        'appName': 'School AssetHub',
        'schoolName': 'Harvest International School',
        'tagline': 'Education Beyond Classrooms',
        'logoUrl': logo_url,
        'brandColors': {
            'primary': '#2e7d32',
            'secondary': '#0288d1',
            'accent': '#c62828',
            'background': '#f8fafc',
            'surface': '#ffffff',
            'text': '#1e293b'
        },
        'status': 'operational'
    })
