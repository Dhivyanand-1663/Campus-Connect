from django.urls import path, include
from django.http import JsonResponse

def root_status(request):
    return JsonResponse({
        "status": "online",
        "message": "Campus-Connect Django REST API is running successfully!",
        "database": "PostgreSQL (Campus-Connect)",
        "frontend_url": "http://localhost:3000",
        "api_endpoints": [
            "/api/login",
            "/api/register",
            "/api/me",
            "/api/events",
            "/api/complaints",
            "/api/admin/users"
        ]
    })

urlpatterns = [
    path('', root_status),
    path('api/', include('api.urls')),
]
