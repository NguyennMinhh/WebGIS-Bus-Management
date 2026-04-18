from django.urls import path
from . import views

urlpatterns = [
    path('stops/', views.stop_list, name='stop-list'),
    path('routes/', views.route_list, name='route-list'),
]
