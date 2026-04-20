import json
import logging

from django.contrib.gis.geos import Point
from django.db import transaction
from django.db import connection
from django.db.models import Max
from rest_framework import status
from rest_framework import filters, viewsets
from rest_framework.decorators import action, api_view
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.response import Response

from .models import BusRoute, BusStop, RouteStop
from .serializers import (
    BusRouteDetailSerializer,
    BusRouteInfoSerializer,
    BusRouteWriteSerializer,
    BusStopSerializer,
    BusStopWriteSerializer,
    RouteOptionSerializer,
    RouteStopAssignmentSerializer,
    RouteStopWithSequenceSerializer,
)

logger = logging.getLogger(__name__)


def _build_stop_payload(stop):
    return {
        'id': stop.id,
        'name': stop.name,
        'lat': stop.location.y,
        'lng': stop.location.x,
    }


def _find_nearby_stop_ids(point, buffer_m):
    with connection.cursor() as cur:
        cur.execute(
            """
            SELECT id
            FROM routes_busstop
            WHERE ST_DWithin(
                location::geography,
                ST_SetSRID(ST_MakePoint(%s, %s), 4326)::geography,
                %s
            )
            """,
            [point.x, point.y, buffer_m],
        )
        return [row[0] for row in cur.fetchall()]


def _serialize_route_stops(route_id):
    route_stops = (
        RouteStop.objects.filter(route_id=route_id)
        .select_related('stop')
        .order_by('sequence', 'id')
    )
    return RouteStopWithSequenceSerializer(route_stops, many=True).data


def _compact_route_stop_sequences(route_id):
    route_stops = list(
        RouteStop.objects.filter(route_id=route_id)
        .order_by('sequence', 'id')
    )
    changed_route_stops = []

    for index, route_stop in enumerate(route_stops, start=1):
        if route_stop.sequence == index:
            continue

        route_stop.sequence = index
        changed_route_stops.append(route_stop)

    if changed_route_stops:
        RouteStop.objects.bulk_update(changed_route_stops, ['sequence'])


class BusStopViewSet(viewsets.ModelViewSet):
    queryset = BusStop.objects.all().order_by('name')
    serializer_class = BusStopWriteSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'osm_id']


class BusRouteViewSet(viewsets.ModelViewSet):
    queryset = BusRoute.objects.all().prefetch_related('route_stops__stop').order_by('ref')
    serializer_class = BusRouteWriteSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['ref', 'name']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return BusRouteDetailSerializer

        return BusRouteWriteSerializer

    @action(detail=True, methods=['post'], url_path='add-stop')
    def add_stop(self, request, pk=None):
        route = self.get_object()
        serializer = RouteStopAssignmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        stop = serializer.validated_data['stop']

        if RouteStop.objects.filter(route=route, stop=stop).exists():
            raise ValidationError({'stop_id': ['This stop is already assigned to the route.']})

        next_sequence = (
            RouteStop.objects.filter(route=route).aggregate(max_sequence=Max('sequence'))['max_sequence']
            or 0
        ) + 1

        RouteStop.objects.create(route=route, stop=stop, sequence=next_sequence)

        return Response({'stops': _serialize_route_stops(route.id)}, status=status.HTTP_201_CREATED)

    @action(
        detail=True,
        methods=['delete'],
        url_path=r'remove-stop/(?P<stop_id>[^/.]+)',
    )
    def remove_stop(self, request, pk=None, stop_id=None):
        route = self.get_object()

        with transaction.atomic():
            deleted_count, _ = RouteStop.objects.filter(route=route, stop_id=stop_id).delete()

            if deleted_count == 0:
                raise NotFound('This stop is not assigned to the route.')

            _compact_route_stop_sequences(route.id)

        return Response({'stops': _serialize_route_stops(route.id)})


@api_view(['GET'])
def stop_list(request):
    search_query = request.query_params.get('search', '')
    stops = BusStop.objects.filter(name__icontains=search_query)[:20]

    serializer = BusStopSerializer(stops, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def route_list(request):
    routes = BusRoute.objects.all()
    serializer = BusRouteInfoSerializer(routes, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def find_route(request):
    logger.info('[FindRoute] Request received. query_params=%s', dict(request.GET))

    try:
        from_lat = float(request.GET['from_lat'])
        from_lng = float(request.GET['from_lng'])
        to_lat = float(request.GET['to_lat'])
        to_lng = float(request.GET['to_lng'])
        buffer_m = int(request.GET.get('buffer', 1000))
    except (KeyError, TypeError, ValueError):
        logger.warning(
            '[FindRoute] Request rejected while parsing query params. query_params=%s',
            dict(request.GET),
        )
        return Response(
            {'error': 'Required params: from_lat, from_lng, to_lat, to_lng'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if buffer_m <= 0:
        logger.warning('[FindRoute] Request rejected because buffer must be positive.')
        return Response(
            {'error': 'Buffer must be greater than 0.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    logger.info(
        '[FindRoute] Step 1 complete: validated query params. params=%s',
        {
            'from_lat': from_lat,
            'from_lng': from_lng,
            'to_lat': to_lat,
            'to_lng': to_lng,
            'buffer_m': buffer_m,
        },
    )

    from_point = Point(from_lng, from_lat, srid=4326)
    to_point = Point(to_lng, to_lat, srid=4326)

    from_stop_ids = _find_nearby_stop_ids(from_point, buffer_m)
    to_stop_ids = _find_nearby_stop_ids(to_point, buffer_m)

    logger.info(
        '[FindRoute] Step 2 complete: buffered stop lookup finished. counts=%s',
        {
            'from_stop_count': len(from_stop_ids),
            'to_stop_count': len(to_stop_ids),
        },
    )

    if not from_stop_ids:
        logger.info('[FindRoute] No candidate stops near the origin point.')
        return Response(
            {'error': f'No bus stops within {buffer_m}m of the start point.'},
            status=status.HTTP_404_NOT_FOUND,
        )

    if not to_stop_ids:
        logger.info('[FindRoute] No candidate stops near the destination point.')
        return Response(
            {'error': f'No bus stops within {buffer_m}m of the destination.'},
            status=status.HTTP_404_NOT_FOUND,
        )

    with connection.cursor() as cur:
        cur.execute(
            """
            WITH ranked_candidates AS (
                SELECT DISTINCT ON (r.id)
                    r.id AS route_id,
                    rs1.stop_id AS from_stop_id,
                    rs2.stop_id AS to_stop_id,
                    rs1.sequence AS from_seq,
                    rs2.sequence AS to_seq,
                    (rs2.sequence - rs1.sequence) AS stop_span
                FROM routes_busroute r
                JOIN routes_routestop rs1
                    ON rs1.route_id = r.id
                   AND rs1.stop_id = ANY(%s)
                   AND rs1.sequence > 0
                JOIN routes_routestop rs2
                    ON rs2.route_id = r.id
                   AND rs2.stop_id = ANY(%s)
                   AND rs2.sequence > 0
                WHERE rs1.sequence < rs2.sequence
                ORDER BY
                    r.id,
                    (rs2.sequence - rs1.sequence) ASC,
                    rs1.sequence ASC,
                    rs2.sequence ASC
            )
            SELECT
                route_id,
                from_stop_id,
                to_stop_id,
                from_seq,
                to_seq,
                stop_span
            FROM ranked_candidates
            ORDER BY stop_span ASC, route_id ASC
            LIMIT 5
            """,
            [from_stop_ids, to_stop_ids],
        )
        candidates = cur.fetchall()

    logger.info(
        '[FindRoute] Step 3 complete: route candidate lookup finished. counts=%s',
        {'candidate_count': len(candidates)},
    )

    if not candidates:
        logger.info('[FindRoute] No direct route candidates found.')
        return Response(
            {'error': 'No direct route found between these points. Try a larger buffer.'},
            status=status.HTTP_404_NOT_FOUND,
        )

    results = []
    skipped_geometry_count = 0

    for route_id, from_stop_id, to_stop_id, from_seq, to_seq, stop_span in candidates:
        logger.info(
            '[FindRoute] Step 4 start: building route option. candidate=%s',
            {
                'route_id': route_id,
                'from_stop_id': from_stop_id,
                'to_stop_id': to_stop_id,
                'from_seq': from_seq,
                'to_seq': to_seq,
                'stop_span': stop_span,
            },
        )

        route = BusRoute.objects.get(pk=route_id)
        from_stop = BusStop.objects.get(pk=from_stop_id)
        to_stop = BusStop.objects.get(pk=to_stop_id)

        with connection.cursor() as cur:
            cur.execute(
                """
                SELECT
                    ST_AsGeoJSON(
                        ST_LineSubstring(
                            ST_LineMerge(r.path),
                            ST_LineLocatePoint(ST_LineMerge(r.path), fs.location),
                            ST_LineLocatePoint(ST_LineMerge(r.path), ts.location)
                        )
                    ) AS sub_route_geojson,
                    ROUND(
                        ST_Length(
                            ST_LineSubstring(
                                ST_LineMerge(r.path),
                                ST_LineLocatePoint(ST_LineMerge(r.path), fs.location),
                                ST_LineLocatePoint(ST_LineMerge(r.path), ts.location)
                            )::geography
                        )::numeric,
                        0
                    ) AS distance_m
                FROM routes_busroute r
                CROSS JOIN routes_busstop fs
                CROSS JOIN routes_busstop ts
                WHERE r.id = %s
                  AND fs.id = %s
                  AND ts.id = %s
                  AND ST_GeometryType(ST_LineMerge(r.path)) = 'ST_LineString'
                """,
                [route_id, from_stop_id, to_stop_id],
            )
            geometry_row = cur.fetchone()

        if geometry_row is None or geometry_row[0] is None:
            skipped_geometry_count += 1
            logger.warning(
                '[FindRoute] Step 4 skipped: route geometry could not be merged into a LineString. route_id=%s',
                route_id,
            )
            continue

        route_stops = (
            RouteStop.objects.filter(
                route_id=route_id,
                sequence__gte=from_seq,
                sequence__lte=to_seq,
            )
            .select_related('stop')
            .order_by('sequence')
        )

        stops_data = [
            {
                'id': route_stop.stop.id,
                'name': route_stop.stop.name,
                'lat': route_stop.stop.location.y,
                'lng': route_stop.stop.location.x,
                'sequence': route_stop.sequence,
            }
            for route_stop in route_stops
        ]

        sub_route_geojson, distance_m = geometry_row

        route_result = {
            'route': {
                'id': route.id,
                'ref': route.ref,
                'name': route.name or None,
                'charge': route.charge or None,
                'interval': route.interval or None,
            },
            'from_stop': _build_stop_payload(from_stop),
            'to_stop': _build_stop_payload(to_stop),
            'stop_count': max(len(stops_data) - 2, 0),
            'distance_m': int(distance_m),
            'stops': stops_data,
            'sub_route': json.loads(sub_route_geojson),
        }

        results.append(route_result)
        logger.info(
            '[FindRoute] Step 4 complete: route option assembled. result=%s',
            {
                'route_id': route.id,
                'stop_count': route_result['stop_count'],
                'distance_m': route_result['distance_m'],
            },
        )

    if not results:
        logger.warning(
            '[FindRoute] All candidates were skipped during geometry extraction. skipped=%s',
            skipped_geometry_count,
        )
        return Response(
            {'error': 'No direct route found between these points. Try a larger buffer.'},
            status=status.HTTP_404_NOT_FOUND,
        )

    serializer = RouteOptionSerializer(results, many=True)

    logger.info(
        '[FindRoute] Step 5 complete: returning route search response. summary=%s',
        {
            'result_count': len(results),
            'skipped_geometry_count': skipped_geometry_count,
        },
    )
    return Response(serializer.data)
