import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, FlatList, Text, StyleSheet } from 'react-native';
import { useResidentLocation } from '../../context/LocationContext.js';
import { getNearbyVendors } from '../../api/vendors.js';
import { VendorCard } from '../../components/VendorCard.js';
import { LoadingOverlay } from '../../components/LoadingOverlay.js';
import { colors } from '../../theme/colors.js';

const OSM_TILE_URL =
  'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

const REFRESH_INTERVAL_MS = 20000;
const DEFAULT_RADIUS_METERS = 1500;
const DEFAULT_ZOOM = 15;

function normalizeVendor(vendor) {
  const lat = vendor?.approximateLocation?.latitude;
  const lng = vendor?.approximateLocation?.longitude;

  if (
    typeof lat !== 'number' ||
    typeof lng !== 'number' ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lng)
  ) {
    return null;
  }

  return {
    Vendor_ID: vendor.Vendor_ID,
    VendorName: vendor.VendorName || 'Vendor',
    Vehicle: vendor.Vehicle || 'Pushcart',
    status: vendor.status || 'ACTIVE',
    distanceKm:
      typeof vendor.distanceKm === 'number'
        ? vendor.distanceKm
        : undefined,
    lat,
    lng,
  };
}

export function MapScreen({ navigation }) {
  const { coords, requestAndFetch } = useResidentLocation();

  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const iframeRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  const fetchVendors = useCallback(async (position) => {
    if (!position) return;

    try {
      const response = await getNearbyVendors({
        lat: position.latitude,
        lng: position.longitude,
        radius: DEFAULT_RADIUS_METERS,
      });

      setVendors(response?.data || []);
      setError(null);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          'Could not load nearby vendors'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  /*
   * Get location and perform the initial vendor request.
   */
  useEffect(() => {
    let mounted = true;

    async function initialize() {
      try {
        const position = coords || (await requestAndFetch());

        if (mounted) {
          await fetchVendors(position);
        }
      } catch (err) {
        if (mounted) {
          setError('Unable to determine your location.');
          setLoading(false);
        }
      }
    }

    initialize();

    return () => {
      mounted = false;
    };

    // Initial location request intentionally runs once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /*
   * Refresh nearby vendors every 20 seconds.
   */
  useEffect(() => {
    if (!coords) return undefined;

    const interval = setInterval(() => {
      fetchVendors(coords);
    }, REFRESH_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [coords, fetchVendors]);

  /*
   * Receive events from Leaflet.
   */
  useEffect(() => {
    function handleMessage(event) {
      const data = event?.data;

      if (!data) return;

      if (data.type === 'MAP_READY') {
        setMapLoaded(true);
        return;
      }

      if (data.type === 'SELECT_VENDOR') {
        const selected = vendors.find(
          (vendor) =>
            String(vendor.Vendor_ID) === String(data.vendorId)
        );

        if (selected) {
          navigation.navigate('VendorDetail', {
            vendor: selected,
          });
        }
      }
    }

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [vendors, navigation]);

  const mapVendors = useMemo(
    () =>
      vendors
        .map(normalizeVendor)
        .filter(Boolean),
    [vendors]
  );

  /*
   * Push fresh data into the already-mounted Leaflet map.
   */
  useEffect(() => {
    if (!mapLoaded) return;

    const contentWindow =
      iframeRef.current?.contentWindow;

    if (!contentWindow) return;

    contentWindow.postMessage(
      {
        type: 'UPDATE_DATA',
        coords,
        vendors: mapVendors,
      },
      '*'
    );
  }, [coords, mapVendors, mapLoaded]);

  const handleCardPress = useCallback(
    (vendor) => {
      const location = vendor?.approximateLocation;

      if (
        iframeRef.current?.contentWindow &&
        typeof location?.latitude === 'number' &&
        typeof location?.longitude === 'number'
      ) {
        iframeRef.current.contentWindow.postMessage(
          {
            type: 'PAN_TO',
            lat: location.latitude,
            lng: location.longitude,
            vendorId: vendor.Vendor_ID,
          },
          '*'
        );
      }

      navigation.navigate('VendorDetail', {
        vendor,
      });
    },
    [navigation]
  );

  const initialData = useMemo(
    () => ({
      coords,
      vendors: mapVendors,
    }),
    [coords, mapVendors]
  );

  const mapHtml = useMemo(() => {
    if (!coords) return '';

    const initialDataJson = JSON.stringify(initialData)
      .replace(/</g, '\\u003c')
      .replace(/>/g, '\\u003e')
      .replace(/&/g, '\\u0026');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />

  <meta
    name="viewport"
    content="width=device-width,
      initial-scale=1.0,
      maximum-scale=1.0,
      user-scalable=no"
  />

  <title>Nearby Vendors</title>

  <link
    rel="stylesheet"
    href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
    integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
    crossorigin=""
  />

  <script
    src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
    integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
    crossorigin=""
  ></script>

  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    html,
    body,
    #map {
      width: 100%;
      height: 100%;
      overflow: hidden;
    }

    body {
      background: #e2e8f0;
      font-family:
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        Roboto,
        Helvetica,
        Arial,
        sans-serif;
    }

    .leaflet-container {
      background: #e2e8f0;
    }

    /*
     * Resident marker
     */
    .resident-marker {
      width: 24px;
      height: 24px;
      position: relative;
    }

    .resident-pulse {
      position: absolute;
      width: 48px;
      height: 48px;
      left: -12px;
      top: -12px;
      border-radius: 50%;
      background: rgba(37, 99, 235, 0.20);
      animation: residentPulse 2s infinite ease-out;
    }

    .resident-dot {
      position: absolute;
      width: 22px;
      height: 22px;
      left: 1px;
      top: 1px;
      border-radius: 50%;
      background: #2563eb;
      border: 3px solid #ffffff;
      box-shadow:
        0 2px 8px rgba(15, 23, 42, 0.30);
    }

    @keyframes residentPulse {
      0% {
        transform: scale(0.45);
        opacity: 0.9;
      }

      70% {
        transform: scale(1);
        opacity: 0.25;
      }

      100% {
        transform: scale(1.35);
        opacity: 0;
      }
    }

    /*
     * Vendor marker
     */
    .vendor-marker {
      display: flex;
      align-items: center;
      gap: 6px;

      max-width: 190px;

      padding: 7px 11px;

      background: #0284c7;
      color: #ffffff;

      border: 2px solid #ffffff;
      border-radius: 999px;

      box-shadow:
        0 4px 12px rgba(15, 23, 42, 0.25);

      font-size: 12px;
      font-weight: 700;
      line-height: 1;

      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;

      cursor: pointer;

      transition:
        transform 0.15s ease,
        background 0.15s ease;
    }

    .vendor-marker:hover {
      transform: translateY(-2px) scale(1.03);
      background: #0369a1;
    }

    .vendor-icon {
      flex: 0 0 auto;
      font-size: 13px;
    }

    .vendor-name {
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /*
     * Popup
     */
    .vendor-popup {
      min-width: 190px;
    }

    .popup-title {
      color: #0f172a;
      font-size: 15px;
      font-weight: 800;
    }

    .popup-meta {
      margin-top: 4px;
      color: #64748b;
      font-size: 12px;
    }

    .popup-distance {
      margin-top: 6px;
      color: #0284c7;
      font-size: 12px;
      font-weight: 700;
    }

    .popup-action {
      width: 100%;
      margin-top: 11px;
      padding: 8px 12px;

      border: 0;
      border-radius: 8px;

      background: #0284c7;
      color: #ffffff;

      font-size: 12px;
      font-weight: 700;

      cursor: pointer;
    }

    .popup-action:hover {
      background: #0369a1;
    }

    .leaflet-popup-content-wrapper {
      border-radius: 14px;
      box-shadow:
        0 8px 30px rgba(15, 23, 42, 0.18);
    }

    .leaflet-popup-content {
      margin: 13px;
    }

    /*
     * Map controls
     */
    .leaflet-control-zoom {
      border: none !important;
      box-shadow:
        0 3px 12px rgba(15, 23, 42, 0.15) !important;
    }

    .leaflet-control-zoom a {
      color: #0f172a !important;
      border: none !important;
    }

    .leaflet-control-attribution {
      font-size: 10px;
    }
  </style>
</head>

<body>
  <div id="map"></div>

  <script>
    const initial = ${initialDataJson};

    const map = L.map('map', {
      zoomControl: true,
      attributionControl: true,
      preferCanvas: true
    }).setView(
      [
        initial.coords.latitude,
        initial.coords.longitude
      ],
      ${DEFAULT_ZOOM}
    );

    /*
     * OpenStreetMap raster tiles.
     *
     * IMPORTANT:
     * OSM uses {z}/{x}/{y}, not {z}/{y}/{x}.
     */
    L.tileLayer(
      '${OSM_TILE_URL}',
      {
        maxZoom: 19,
        minZoom: 3,
        tileSize: 256,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
      }
    ).addTo(map);

    let residentMarker = null;
    const vendorMarkers = {};

    function updateResident(position) {
      if (!position) return;

      const latitude = Number(position.latitude);
      const longitude = Number(position.longitude);

      if (!Number.isFinite(latitude) ||
          !Number.isFinite(longitude)) {
        return;
      }

      if (residentMarker) {
        residentMarker.setLatLng([
          latitude,
          longitude
        ]);
        return;
      }

      const icon = L.divIcon({
        className: '',
        html:
          '<div class="resident-marker">' +
            '<div class="resident-pulse"></div>' +
            '<div class="resident-dot"></div>' +
          '</div>',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      residentMarker = L.marker(
        [latitude, longitude],
        {
          icon,
          zIndexOffset: 1000,
          keyboard: false
        }
      )
        .addTo(map)
        .bindPopup(
          '<div class="popup-title">Your Location</div>' +
          '<div class="popup-meta">You are here</div>'
        );
    }

    function escapeHtml(value) {
      return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    function updateVendors(vendors) {
      const list = Array.isArray(vendors)
        ? vendors
        : [];

      const activeIds = new Set(
        list.map(v => String(v.Vendor_ID))
      );

      Object.keys(vendorMarkers).forEach(id => {
        if (!activeIds.has(String(id))) {
          map.removeLayer(vendorMarkers[id]);
          delete vendorMarkers[id];
        }
      });

      list.forEach(vendor => {
        const latitude = Number(vendor.lat);
        const longitude = Number(vendor.lng);

        if (!Number.isFinite(latitude) ||
            !Number.isFinite(longitude)) {
          return;
        }

        const id = String(vendor.Vendor_ID);
        const name = escapeHtml(
          vendor.VendorName || 'Vendor'
        );

        const vehicle = escapeHtml(
          vendor.Vehicle || 'Pushcart'
        );

        const status = escapeHtml(
          vendor.status || 'ACTIVE'
        );

        const distance =
          typeof vendor.distanceKm === 'number'
            ? vendor.distanceKm.toFixed(2) + ' km away'
            : '';

        if (vendorMarkers[id]) {
          vendorMarkers[id].setLatLng([
            latitude,
            longitude
          ]);

          return;
        }

        const icon = L.divIcon({
          className: '',
          html:
            '<div class="vendor-marker">' +
              '<span class="vendor-icon">🛒</span>' +
              '<span class="vendor-name">' +
                name +
              '</span>' +
            '</div>',
          iconSize: null,
          iconAnchor: [0, 18]
        });

        const marker = L.marker(
          [latitude, longitude],
          {
            icon,
            keyboard: false
          }
        ).addTo(map);

        const popupHtml =
          '<div class="vendor-popup">' +
            '<div class="popup-title">' +
              name +
            '</div>' +

            '<div class="popup-meta">' +
              vehicle +
              ' · ' +
              status +
            '</div>' +

            (
              distance
                ? '<div class="popup-distance">' +
                    distance +
                  '</div>'
                : ''
            ) +

            '<button ' +
              'class="popup-action" ' +
              'onclick="selectVendor(\\'' +
                id.replace(/'/g, "\\\\'") +
              '\\')">' +
              'View Vendor' +
            '</button>' +
          '</div>';

        marker.bindPopup(popupHtml);

        marker.on('click', function () {
          marker.openPopup();
        });

        vendorMarkers[id] = marker;
      });
    }

    function selectVendor(vendorId) {
      window.parent.postMessage(
        {
          type: 'SELECT_VENDOR',
          vendorId
        },
        '*'
      );
    }

    /*
     * Initial render.
     */
    updateResident(initial.coords);
    updateVendors(initial.vendors || []);

    /*
     * Tell React Native/web wrapper that Leaflet is ready.
     */
    window.parent.postMessage(
      {
        type: 'MAP_READY'
      },
      '*'
    );

    /*
     * Receive updates from React.
     */
    window.addEventListener(
      'message',
      function (event) {
        const data = event?.data;

        if (!data) return;

        if (data.type === 'UPDATE_DATA') {
          if (data.coords) {
            updateResident(data.coords);
          }

          if (data.vendors) {
            updateVendors(data.vendors);
          }
        }

        if (data.type === 'PAN_TO') {
          const latitude = Number(data.lat);
          const longitude = Number(data.lng);

          if (!Number.isFinite(latitude) ||
              !Number.isFinite(longitude)) {
            return;
          }

          map.flyTo(
            [latitude, longitude],
            16,
            {
              duration: 0.8
            }
          );

          if (data.vendorId) {
            const marker =
              vendorMarkers[String(data.vendorId)];

            if (marker) {
              setTimeout(() => {
                marker.openPopup();
              }, 700);
            }
          }
        }
      }
    );
  </script>
</body>
</html>`;
  }, [coords, initialData]);

  if (loading && !coords) {
    return (
      <LoadingOverlay
        label="Finding vendors near you…"
      />
    );
  }

  if (!coords) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>
          {error ||
            'Location is required to show nearby vendors.'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <iframe
        ref={iframeRef}
        srcDoc={mapHtml}
        style={styles.iframe}
        title="OpenStreetMap nearby vendors"
      />

      <View style={styles.listWrap}>
        {error ? (
          <Text style={styles.errorBanner}>
            {error}
          </Text>
        ) : null}

        <FlatList
          data={vendors}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) =>
            String(item.Vendor_ID)
          }
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.cardContainer}>
              <VendorCard
                vendor={item}
                onPress={() =>
                  handleCardPress(item)
                }
              />
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              No vendors nearby right now.
            </Text>
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#e2e8f0',
  },

  iframe: {
    width: '100%',
    height: '100%',
    border: 'none',
    display: 'block',
  },

  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: colors.bg,
  },

  errorText: {
    color: colors.textSecondary,
    textAlign: 'center',
  },

  listWrap: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
  },

  listContent: {
    gap: 12,
    paddingHorizontal: 16,
  },

  cardContainer: {
    width: 260,
  },

  errorBanner: {
    backgroundColor: '#fee2e2',
    color: colors.danger,
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 8,
    borderRadius: 8,
    fontSize: 12,
  },

  emptyText: {
    color: colors.textSecondary,
    marginLeft: 16,
  },
});
