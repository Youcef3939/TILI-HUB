from django.contrib import admin
from django.urls import path, include
from knox import views as knox_views
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),


    path('users/', include('users.urls')),


    path('api/', include('api.urls')),  # This will use the DRF browsable interface


    path('auth/logout/', knox_views.LogoutView.as_view(), name='knox_logout'),
    path('auth/logoutall/', knox_views.LogoutAllView.as_view(), name='knox_logoutall'),


    path('auth/password_reset/', include('django_rest_passwordreset.urls', namespace='password_reset')),


    path('chatbot/', include('chatbot.urls')),


    path('finances/', include('finances.urls')),


    path('meetings/', include('meetings.urls')),
    path('notifications/', include('notifications.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)