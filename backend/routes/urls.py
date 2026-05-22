from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import auth_views
from . import views

manage_router = DefaultRouter()
manage_router.register('stops', views.BusStopViewSet, basename='manage-stop')
manage_router.register('routes', views.BusRouteViewSet, basename='manage-route')

urlpatterns = [
    path('auth/me/', auth_views.current_user, name='auth-me'),
    path('auth/register/', auth_views.register, name='auth-register'),
    path('auth/login/', auth_views.login_view, name='auth-login'),
    path('auth/logout/', auth_views.logout_view, name='auth-logout'),
    path('find-route/', views.find_route, name='find-route'),
    path('places/autocomplete/', views.place_autocomplete, name='place-autocomplete'),
    path('places/detail/', views.place_detail, name='place-detail'),
    path('stops/', views.stop_list, name='stop-list'),
    path('routes/', views.route_list, name='route-list'),
    path('manage/', include(manage_router.urls)),
]
