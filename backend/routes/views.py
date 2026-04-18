# ---------------------------------------------------------------------------
# views.py — placeholder
# Thêm API endpoints vào đây khi bắt đầu code tính năng
# ---------------------------------------------------------------------------
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import BusStop, BusRoute
from .serializers import BusStopSerializer, BusRouteSerializer

@api_view(['GET'])
def stop_list(request):
    """
    View 1: Lấy danh sách trạm dừng để bổ trợ tính năng Autocomplete.
    Sử dụng query parameter ?search=...
    """
    search_query = request.query_params.get('search', '')
    
    # Filter theo tên trạm (không phân biệt hoa thường)
    # Giới hạn 20 kết quả để tránh làm nặng Frontend khi người dùng gõ
    stops = BusStop.objects.filter(name__icontains=search_query)[:20]
    
    serializer = BusStopSerializer(stops, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def route_list(request):
    """
    View 2: Lấy danh sách toàn bộ các tuyến xe buýt hiện có.
    Dùng để liệt kê tổng quan hoặc debug.
    """
    routes = BusRoute.objects.all()
    
    # Ở View này, BusRouteSerializer sẽ chỉ trả về các field nhẹ (id, ref, name...)
    # không bao gồm field 'path' (MultiLineString) để tối ưu tốc độ.
    serializer = BusRouteSerializer(routes, many=True)
    return Response(serializer.data)