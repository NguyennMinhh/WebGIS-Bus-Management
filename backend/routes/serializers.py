# ---------------------------------------------------------------------------
# serializers.py — DRF serializers cho Route Finder API
# ---------------------------------------------------------------------------

from rest_framework import serializers
from .models import BusRoute, BusStop, RouteStop


class BusStopSerializer(serializers.ModelSerializer):
    """
    Serializer cơ bản cho trạm dừng.
    Dùng trong cả danh sách trạm trung gian lẫn from_stop/to_stop của kết quả tìm tuyến.
    """
    lat = serializers.SerializerMethodField()
    lng = serializers.SerializerMethodField()

    class Meta:
        model = BusStop
        fields = ['id', 'name', 'lat', 'lng']

    def get_lat(self, obj):
        # location là PointField: x = longitude, y = latitude
        return obj.location.y if obj.location else None

    def get_lng(self, obj):
        return obj.location.x if obj.location else None


class BusRouteInfoSerializer(serializers.ModelSerializer):
    """
    Thông tin mô tả tuyến (không có geometry path).
    Các field OSM có thể rỗng (blank=True trong model) → trả về null nếu rỗng.
    """
    name = serializers.SerializerMethodField()
    charge = serializers.SerializerMethodField()
    interval = serializers.SerializerMethodField()

    class Meta:
        model = BusRoute
        fields = ['id', 'ref', 'name', 'charge', 'interval']

    def _none_if_blank(self, value):
        """Trả về None thay vì "" để frontend dễ kiểm tra null."""
        return value if value else None

    def get_name(self, obj):
        return self._none_if_blank(obj.name)

    def get_charge(self, obj):
        return self._none_if_blank(obj.charge)

    def get_interval(self, obj):
        return self._none_if_blank(obj.interval)


class RouteStopWithSequenceSerializer(serializers.ModelSerializer):
    """
    Trạm trung gian kèm số thứ tự trong tuyến.
    Dùng trong danh sách stops[] của RouteOption.
    """
    id = serializers.IntegerField(source='stop.id')
    name = serializers.CharField(source='stop.name')
    lat = serializers.SerializerMethodField()
    lng = serializers.SerializerMethodField()

    class Meta:
        model = RouteStop
        fields = ['id', 'name', 'lat', 'lng', 'sequence']

    def get_lat(self, obj):
        return obj.stop.location.y if obj.stop.location else None

    def get_lng(self, obj):
        return obj.stop.location.x if obj.stop.location else None
