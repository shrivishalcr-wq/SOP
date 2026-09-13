import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  View,
  FlatList,
  Text,
  StyleSheet,
} from 'react-native';

import MapView, {
  Marker,
  UrlTile,
} from 'react-native-maps';

import { useResidentLocation } from '../../context/LocationContext.js';
import { getNearbyVendors } from '../../api/vendors.js';
import { VendorCard } from '../../components/VendorCard.js';
import { LoadingOverlay } from '../../components/LoadingOverlay.js';
import { colors } from '../../theme/colors.js';

const OSM_TILE_URL =
  'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

const REFRESH_INTERVAL_MS = 20000;
const DEFAULT_RADIUS_METERS = 1500;

const INITIAL_LATITUDE_DELTA = 0.02;
const INITIAL_LONGITUDE_DELTA = 0.02;

function isValidCoordinate(location) {
  return (
    typeof location?.latitude === 'number' &&
    typeof location?.longitude === 'number' &&
    Number.isFinite(location.latitude) &&
    Number.isFinite(location.longitude)
  );
}

export function MapScreen({ navigation }) {
  const { coords, requestAndFetch } =
    useResidentLocation();

  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const mapRef = useRef(null);

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
   * Initial location + vendor request.
   */
  useEffect(() => {
    let mounted = true;

    async function initialize() {
      try {
        const position =
          coords || (await requestAndFetch());

        if (mounted) {
          await fetchVendors(position);
        }
      } catch (err) {
        if (mounted) {
          setError(
            'Unable to determine your location.'
          );
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
   * Refresh vendor locations every 20 seconds.
   */
  useEffect(() => {
    if (!coords) return undefined;

    const interval = setInterval(() => {
      fetchVendors(coords);
    }, REFRESH_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [coords, fetchVendors]);

  /*
   * Keep the map centered when the resident's
   * location becomes available or changes.
   */
  useEffect(() => {
    if (!coords || !mapRef.current) return;

    mapRef.current.animateToRegion(
      {
        latitude: coords.latitude,
        longitude: coords.longitude,
        latitudeDelta: INITIAL_LATITUDE_DELTA,
        longitudeDelta: INITIAL_LONGITUDE_DELTA,
      },
      600
    );
  }, [coords]);

  const handleVendorPress = useCallback(
    (vendor) => {
      const location =
        vendor?.approximateLocation;

      if (!isValidCoordinate(location)) {
        navigation.navigate('VendorDetail', {
          vendor,
        });

        return;
      }

      /*
       * Pan/zoom to the vendor before opening
       * the detail screen.
       */
      mapRef.current?.animateToRegion(
        {
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.012,
          longitudeDelta: 0.012,
        },
        500
      );

      navigation.navigate('VendorDetail', {
        vendor,
      });
    },
    [navigation]
  );

  const handleMarkerPress = useCallback(
    (vendor) => {
      const location =
        vendor?.approximateLocation;

      if (isValidCoordinate(location)) {
        mapRef.current?.animateToRegion(
          {
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.012,
            longitudeDelta: 0.012,
          },
          400
        );
      }
    },
    []
  );

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
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: coords.latitude,
          longitude: coords.longitude,
          latitudeDelta: INITIAL_LATITUDE_DELTA,
          longitudeDelta: INITIAL_LONGITUDE_DELTA,
        }}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass
        rotateEnabled
        pitchEnabled
        toolbarEnabled={false}
        loadingEnabled
        loadingBackgroundColor="#e2e8f0"
        loadingIndicatorColor="#0284c7"
      >
        {/*
         * OpenStreetMap raster layer.
         *
         * IMPORTANT:
         * OSM URL order is {z}/{x}/{y}.
         */}
        <UrlTile
          urlTemplate={OSM_TILE_URL}
          maximumZ={19}
          minimumZ={3}
          flipY={false}
          zIndex={1}
        />

        {/*
         * Resident location.
         */}
        <Marker
          coordinate={{
            latitude: coords.latitude,
            longitude: coords.longitude,
          }}
          title="Your Location"
          description="You are here"
          anchor={{
            x: 0.5,
            y: 0.5,
          }}
          zIndex={1000}
        >
          <View style={styles.residentMarker}>
            <View style={styles.residentPulse} />
            <View style={styles.residentDot} />
          </View>
        </Marker>

        {/*
         * Vendors.
         */}
        {vendors.map((vendor) => {
          const location =
            vendor?.approximateLocation;

          if (!isValidCoordinate(location)) {
            return null;
          }

          const distance =
            typeof vendor.distanceKm === 'number'
              ? `${vendor.distanceKm.toFixed(2)} km away`
              : 'Nearby';

          return (
            <Marker
              key={String(vendor.Vendor_ID)}
              coordinate={{
                latitude: location.latitude,
                longitude: location.longitude,
              }}
              title={
                vendor.VendorName || 'Vendor'
              }
              description={`${vendor.status || 'ACTIVE'} · ${distance}`}
              onPress={() =>
                handleMarkerPress(vendor)
              }
              tracksViewChanges={false}
              zIndex={500}
            >
              <View
                style={styles.vendorMarker}
              >
                <Text style={styles.vendorIcon}>
                  🛒
                </Text>

                <Text
                  style={styles.vendorName}
                  numberOfLines={1}
                >
                  {vendor.VendorName ||
                    'Vendor'}
                </Text>
              </View>
            </Marker>
          );
        })}
      </MapView>

      {/*
       * Vendor cards over the bottom of the map.
       */}
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
          contentContainerStyle={
            styles.listContent
          }
          renderItem={({ item }) => (
            <View style={styles.cardContainer}>
              <VendorCard
                vendor={item}
                onPress={() =>
                  handleVendorPress(item)
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
    backgroundColor: '#e2e8f0',
  },

  map: {
    flex: 1,
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

  /*
   * Resident marker
   */
  residentMarker: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },

  residentPulse: {
    position: 'absolute',
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(37, 99, 235, 0.20)',
  },

  residentDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#2563eb',
    borderWidth: 3,
    borderColor: '#ffffff',

    shadowColor: '#0f172a',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },

  /*
   * Vendor badge
   */
  vendorMarker: {
    maxWidth: 190,

    flexDirection: 'row',
    alignItems: 'center',

    paddingHorizontal: 11,
    paddingVertical: 7,

    backgroundColor: '#0284c7',

    borderWidth: 2,
    borderColor: '#ffffff',
    borderRadius: 999,

    shadowColor: '#0f172a',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },

  vendorIcon: {
    fontSize: 13,
    marginRight: 5,
  },

  vendorName: {
    flexShrink: 1,
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },

  /*
   * Bottom cards
   */
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
