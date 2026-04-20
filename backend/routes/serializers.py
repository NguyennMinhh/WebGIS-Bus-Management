from rest_framework import serializers

from .models import BusRoute, BusStop, RouteStop


class BusStopSerializer(serializers.ModelSerializer):
    lat = serializers.SerializerMethodField()
    lng = serializers.SerializerMethodField()

    class Meta:
        model = BusStop
        fields = ['id', 'name', 'lat', 'lng']

    def get_lat(self, obj):
        return obj.location.y if obj.location else None

    def get_lng(self, obj):
        return obj.location.x if obj.location else None


class BusRouteInfoSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    charge = serializers.SerializerMethodField()
    interval = serializers.SerializerMethodField()

    class Meta:
        model = BusRoute
        fields = ['id', 'ref', 'name', 'charge', 'interval']

    def _none_if_blank(self, value):
        return value if value else None

    def get_name(self, obj):
        return self._none_if_blank(obj.name)

    def get_charge(self, obj):
        return self._none_if_blank(obj.charge)

    def get_interval(self, obj):
        return self._none_if_blank(obj.interval)


class RouteStopWithSequenceSerializer(serializers.ModelSerializer):
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


class BusStopBasicSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField(allow_blank=True)
    lat = serializers.FloatField()
    lng = serializers.FloatField()


class RouteInfoSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    ref = serializers.CharField()
    name = serializers.CharField(allow_null=True)
    charge = serializers.CharField(allow_null=True)
    interval = serializers.CharField(allow_null=True)


class RouteStopSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField(allow_blank=True)
    lat = serializers.FloatField()
    lng = serializers.FloatField()
    sequence = serializers.IntegerField()


class RouteOptionSerializer(serializers.Serializer):
    route = RouteInfoSerializer()
    from_stop = BusStopBasicSerializer()
    to_stop = BusStopBasicSerializer()
    stop_count = serializers.IntegerField()
    distance_m = serializers.IntegerField()
    stops = RouteStopSerializer(many=True)
    sub_route = serializers.DictField()
