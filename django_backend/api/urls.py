from django.urls import path
from . import views

urlpatterns = [
    path('register', views.register_view),
    path('login', views.login_view),
    path('me', views.me_view),
    path('events', views.events_view),
    path('events/<str:id>/action', views.event_action_view),
    path('complaints', views.complaints_view),
    path('complaints/<str:id>/respond', views.complaint_respond_view),
    path('admin/users', views.admin_users_view),
    path('admin/users/<str:username>', views.admin_update_user_view),
]
