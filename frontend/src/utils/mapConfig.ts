// =============================================================================
// mapConfig.ts — Cấu hình OpenLayers Map
// Thay đổi CENTER/ZOOM ở đây nếu muốn điều chỉnh view mặc định
// =============================================================================

/** Center mặc định: Hà Nội (trung tâm khu vực Tây Hồ) */
export const MAP_CENTER: [number, number] = [105.8412, 21.0245]

/** Zoom mặc định (12 = xem rõ cấp quận) */
export const MAP_ZOOM = 12

/** Projection mặc định của OpenLayers (Web Mercator) */
export const MAP_PROJECTION = 'EPSG:3857'

// =============================================================================
// GeoServer config — đọc từ biến môi trường VITE_
// =============================================================================
const GEOSERVER_BASE =
  (import.meta.env.VITE_GEOSERVER_URL as string | undefined) ||
  'http://localhost:8600/geoserver'
const WORKSPACE =
  (import.meta.env.VITE_GEOSERVER_WORKSPACE as string | undefined) ||
  'busrouting'

/** URL WMS endpoint của GeoServer */
export const GEOSERVER_WMS_URL = `${GEOSERVER_BASE}/${WORKSPACE}/wms`

/** Workspace-specific WMS endpoints use unqualified layer names. */
export const LAYER_BUS_ROUTES = 'routes_busroute'

/** Tên layer trạm dừng */
export const LAYER_BUS_STOPS = 'routes_busstop'

export const BUS_ROUTE_COLOR = '#2563eb'
export const BUS_ROUTE_WIDTH = 5
export const BUS_STOP_COLOR = '#dc2626'
export const BUS_STOP_ICON = 'circle'
export const BUS_STOP_ICON_SIZE = 10
export const ROUTE_COLORS = ['#1d4ed8', '#b45309', '#15803d', '#6d28d9', '#be123c']

export const BUS_ROUTES_SLD_BODY = `
<StyledLayerDescriptor version="1.0.0"
  xmlns="http://www.opengis.net/sld"
  xmlns:ogc="http://www.opengis.net/ogc"
  xmlns:xlink="http://www.w3.org/1999/xlink"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <NamedLayer>
    <Name>${LAYER_BUS_ROUTES}</Name>
    <UserStyle>
      <FeatureTypeStyle>
        <Rule>
          <LineSymbolizer>
            <Stroke>
              <CssParameter name="stroke">${BUS_ROUTE_COLOR}</CssParameter>
              <CssParameter name="stroke-width">${BUS_ROUTE_WIDTH}</CssParameter>
              <CssParameter name="stroke-linejoin">round</CssParameter>
              <CssParameter name="stroke-linecap">round</CssParameter>
            </Stroke>
          </LineSymbolizer>
        </Rule>
      </FeatureTypeStyle>
    </UserStyle>
  </NamedLayer>
</StyledLayerDescriptor>`.trim()

export const BUS_STOPS_SLD_BODY = `
<StyledLayerDescriptor version="1.0.0"
  xmlns="http://www.opengis.net/sld"
  xmlns:ogc="http://www.opengis.net/ogc"
  xmlns:xlink="http://www.w3.org/1999/xlink"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <NamedLayer>
    <Name>${LAYER_BUS_STOPS}</Name>
    <UserStyle>
      <FeatureTypeStyle>
        <Rule>
          <PointSymbolizer>
            <Graphic>
              <Mark>
                <WellKnownName>${BUS_STOP_ICON}</WellKnownName>
                <Fill>
                  <CssParameter name="fill">${BUS_STOP_COLOR}</CssParameter>
                </Fill>
                <Stroke>
                  <CssParameter name="stroke">#ffffff</CssParameter>
                  <CssParameter name="stroke-width">2</CssParameter>
                </Stroke>
              </Mark>
              <Size>${BUS_STOP_ICON_SIZE}</Size>
            </Graphic>
          </PointSymbolizer>
        </Rule>
      </FeatureTypeStyle>
    </UserStyle>
  </NamedLayer>
</StyledLayerDescriptor>`.trim()
