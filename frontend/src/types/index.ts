export type LngLat = [number, number]

export interface RouteGeometry {
  type: 'MultiLineString' | 'LineString'
  coordinates: LngLat[] | LngLat[][]
}

export interface BusRoute {
  id: number
  ref: string
  name: string | null
  from_stop: string
  to_stop: string
  operator: string
  opening_hours: string
  charge: string | null
  interval: string | null
  geometry: RouteGeometry
}

export interface BusStop {
  id: number
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
