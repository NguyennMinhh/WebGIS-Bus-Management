export type LngLat = [number, number]

export interface RouteGeometry {
  type: 'MultiLineString' | 'LineString'
  coordinates: LngLat[] | LngLat[][]
}

export interface BusRoute {
  id: number
  osm_id: string
  ref: string
  name: string
  from_stop: string
  to_stop: string
  operator: string
  opening_hours: string
  charge: string
  interval: string
}

export interface BusStop {
  id: number
  osm_id: string
  name: string
  lat: number
  lng: number
}

export interface PlaceSuggestion {
  place_id: string
  description: string
  main_text: string
  secondary_text: string
}

export interface PlaceDetail {
  lng: number
  lat: number
  name: string
}

export interface BusStopInput {
  osm_id: string
  name: string
  lat: number
  lng: number
}

export interface BusStopBasic {
  id: number
  name: string
  lat: number
  lng: number
}

export interface RouteStop extends BusStopBasic {
  sequence: number
}

export interface BusRouteInput {
  osm_id: string
  ref: string
  name: string
  from_stop: string
  to_stop: string
  operator: string
  opening_hours: string
  charge: string
  interval: string
}

export interface BusRouteDetail extends BusRoute {
  stops: RouteStop[]
}

export interface RouteOption {
  route: {
    id: number
    ref: string
    name: string | null
    charge: string | null
    interval: string | null
  }
  from_stop: BusStopBasic
  to_stop: BusStopBasic
  stop_count: number
  distance_m: number
  stops: RouteStop[]
  sub_route: {
    type: 'LineString'
    coordinates: LngLat[]
  }
}
