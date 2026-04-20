from django.contrib.gis.geos import GEOSGeometry, Point
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


def _empty_route_path():
    return GEOSGeometry('MULTILINESTRING EMPTY', srid=4326)


class BusStopWriteSerializer(serializers.ModelSerializer):
    lat = serializers.FloatField(write_only=True, min_value=-90, max_value=90)
    lng = serializers.FloatField(write_only=True, min_value=-180, max_value=180)

    class Meta:
        model = BusStop
        fields = ['id', 'osm_id', 'name', 'lat', 'lng']

    def create(self, validated_data):
        lat = validated_data.pop('lat')
        lng = validated_data.pop('lng')
        validated_data['location'] = Point(lng, lat, srid=4326)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        lat = validated_data.pop('lat', None)
        lng = validated_data.pop('lng', None)

        if lat is not None and lng is not None:
            instance.location = Point(lng, lat, srid=4326)

        return super().update(instance, validated_data)

    def to_representation(self, instance):
        return {
            'id': instance.id,
            'osm_id': instance.osm_id,
            'name': instance.name,
            'lat': instance.location.y if instance.location else None,
            'lng': instance.location.x if instance.location else None,
        }


class BusRouteWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = BusRoute
        fields = [
            'id',
            'osm_id',
            'ref',
            'name',
            'from_stop',
            'to_stop',
            'operator',
            'opening_hours',
            'charge',
            'interval',
        ]

    def create(self, validated_data):
        return BusRoute.objects.create(path=_empty_route_path(), **validated_data)


class BusRouteDetailSerializer(BusRouteWriteSerializer):
    stops = RouteStopWithSequenceSerializer(source='route_stops', many=True, read_only=True)

    class Meta(BusRouteWriteSerializer.Meta):
        fields = BusRouteWriteSerializer.Meta.fields + ['stops']


class RouteStopAssignmentSerializer(serializers.Serializer):
    stop_id = serializers.PrimaryKeyRelatedField(
        queryset=BusStop.objects.all(),
        source='stop',
    )
