from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

manage_router = DefaultRouter()
manage_router.register('stops', views.BusStopViewSet, basename='manage-stop')
manage_router.register('routes', views.BusRouteViewSet, basename='manage-route')

urlpatterns = [
    path('find-route/', views.find_route, name='find-route'),
    path('stops/', views.stop_list, name='stop-list'),
    path('routes/', views.route_list, name='route-list'),
    path('manage/', include(manage_router.urls)),
]
