import 'dotenv/config';
import mongoose from 'mongoose';

import connectDB from '../src/config/db.js';

import Category from '../src/models/Category.js';
import Vendor from '../src/models/Vendor.js';
import VendorLocation from '../src/models/VendorLocation.js';
import Resident from '../src/models/Resident.js';

import ActivityLog from '../src/models/ActivityLog.js';
import Alert from '../src/models/Alert.js';
import ProcessedEvent from '../src/models/ProcessedEvent.js';
import Rating from '../src/models/Rating.js';
import ResidentCategoryPreference from '../src/models/ResidentCategoryPreference.js';
import VendorSession from '../src/models/VendorSession.js';

import {
  hashPhoneNumber,
  toApproximateGeoPoint,
} from '../src/utils/geoPrivacy.js';

/* =========================================================
   CONFIG
========================================================= */

const DEMO_CENTER = {
  latitude: 13.0418,
  longitude: 80.2341,
};

const API_BASE_URL =
  process.env.API_BASE_URL ||
  `http://localhost:${process.env.PORT || 5000}`;

const SIMULATE_INTERVAL_MS =
  parseInt(process.env.SIMULATE_INTERVAL_MS, 10) || 5000;

/* =========================================================
   CATEGORIES
========================================================= */

const CATEGORY_NAMES = [
  'Vegetables',
  'Fruits',
  'Snacks',
];

/* =========================================================
   VENDORS
========================================================= */

const VENDOR_SEED = [
  {
    name: 'Murugan Vegetable Cart',
    category: 'Vegetables',
    vehicle: 'Pushcart',
    avgRating: 4.6,
    ratingCount: 42,
  },
  {
    name: 'Lakshmi Fruit Stall',
    category: 'Fruits',
    vehicle: 'Bicycle',
    avgRating: 4.2,
    ratingCount: 27,
  },
  {
    name: 'Kumar Evening Snacks',
    category: 'Snacks',
    vehicle: 'Pushcart',
    avgRating: 3.9,
    ratingCount: 15,
  },
  {
    name: 'Selvam Mixed Fruits & Veggies',
    category: 'Vegetables',
    vehicle: 'Auto-cart',
    avgRating: 3.5,
    ratingCount: 9,
  },
];

/* =========================================================
   RESIDENTS
========================================================= */

const RESIDENT_SEED = [
  {
    phone: '+919876543210',
    firebaseUID: 'demo-firebase-uid-001',
    displayName: 'Arun Kumar',
    address: '12 Anna Nagar, Chennai',
    latitude: 13.0431,
    longitude: 80.2348,
    notificationRadius: 500,
  },
  {
    phone: '+919876543211',
    firebaseUID: 'demo-firebase-uid-002',
    displayName: 'Priya Srinivasan',
    address: '24 Shenoy Nagar, Chennai',
    latitude: 13.0452,
    longitude: 80.2317,
    notificationRadius: 500,
  },
  {
    phone: '+919876543212',
    firebaseUID: 'demo-firebase-uid-003',
    displayName: 'Karthik Raj',
    address: '8 Pulla Avenue, Chennai',
    latitude: 13.0398,
    longitude: 80.2365,
    notificationRadius: 500,
  },
  {
    phone: '+919876543213',
    firebaseUID: 'demo-firebase-uid-004',
    displayName: 'Divya Lakshmi',
    address: '31 Nungambakkam High Road, Chennai',
    latitude: 13.0551,
    longitude: 80.2429,
    notificationRadius: 500,
  },
  {
    phone: '+919876543214',
    firebaseUID: 'demo-firebase-uid-005',
    displayName: 'Suresh Babu',
    address: '17 Kilpauk Garden Road, Chennai',
    latitude: 13.0824,
    longitude: 80.2421,
    notificationRadius: 500,
  },
  {
    phone: '+919876543215',
    firebaseUID: 'demo-firebase-uid-006',
    displayName: 'Meena Devi',
    address: '45 Chetpet, Chennai',
    latitude: 13.0706,
    longitude: 80.2428,
    notificationRadius: 500,
  },
  {
    phone: '+919876543216',
    firebaseUID: 'demo-firebase-uid-007',
    displayName: 'Vignesh Kumar',
    address: '19 Aminjikarai, Chennai',
    latitude: 13.0694,
    longitude: 80.2247,
    notificationRadius: 500,
  },
  {
    phone: '+919876543217',
    firebaseUID: 'demo-firebase-uid-008',
    displayName: 'Anjali Ramesh',
    address: '6 Perambur Barracks Road, Chennai',
    latitude: 13.0968,
    longitude: 80.2541,
    notificationRadius: 500,
  },
  {
    phone: '+919876543218',
    firebaseUID: 'demo-firebase-uid-009',
    displayName: 'Mohan Das',
    address: '28 Egmore, Chennai',
    latitude: 13.0732,
    longitude: 80.2609,
    notificationRadius: 500,
  },
  {
    phone: '+919876543219',
    firebaseUID: 'demo-firebase-uid-010',
    displayName: 'Keerthana S',
    address: '14 T Nagar, Chennai',
    latitude: 13.0416,
    longitude: 80.2337,
    notificationRadius: 500,
  },
  {
    phone: '+919876543220',
    firebaseUID: 'demo-firebase-uid-011',
    displayName: 'Ravi Shankar',
    address: '22 West Mambalam, Chennai',
    latitude: 13.0381,
    longitude: 80.2253,
    notificationRadius: 500,
  },
  {
    phone: '+919876543221',
    firebaseUID: 'demo-firebase-uid-012',
    displayName: 'Nandhini Murugan',
    address: '9 Saidapet, Chennai',
    latitude: 13.0214,
    longitude: 80.2232,
    notificationRadius: 500,
  },
  {
    phone: '+919876543222',
    firebaseUID: 'demo-firebase-uid-013',
    displayName: 'Balaji Krishnan',
    address: '33 Guindy, Chennai',
    latitude: 13.0067,
    longitude: 80.2206,
    notificationRadius: 500,
  },
  {
    phone: '+919876543223',
    firebaseUID: 'demo-firebase-uid-014',
    displayName: 'Swetha Anand',
    address: '16 Adyar, Chennai',
    latitude: 13.0063,
    longitude: 80.2574,
    notificationRadius: 500,
  },
  {
    phone: '+919876543224',
    firebaseUID: 'demo-firebase-uid-015',
    displayName: 'Manoj Prakash',
    address: '41 Mylapore, Chennai',
    latitude: 13.0339,
    longitude: 80.2676,
    notificationRadius: 500,
  },
];

/* =========================================================
   HELPERS
========================================================= */

function jitter(base, spreadDegrees = 0.01) {
  return base + (Math.random() - 0.5) * spreadDegrees;
}

function fakePhoneNumber(seedIndex) {
  return `+9198765${String(43000 + seedIndex).padStart(
    5,
    '0'
  )}`;
}

/* =========================================================
   CATEGORIES
========================================================= */

async function seedCategories() {
  const categoryDocs = {};

  for (const name of CATEGORY_NAMES) {
    const category = await Category.findOneAndUpdate(
      { Name: name },
      {
        Name: name,
        IconKey: name.toLowerCase(),
      },
      {
        returnDocument: 'after',
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    categoryDocs[name] = category;

    console.log(
      `[seed] Category ready: ${name}`
    );
  }

  return categoryDocs;
}

/* =========================================================
   VENDORS
========================================================= */

async function seedVendors(categoryDocs) {
  const vendors = [];

  for (let i = 0; i < VENDOR_SEED.length; i += 1) {
    const spec = VENDOR_SEED[i];

    const phoneHash = hashPhoneNumber(
      fakePhoneNumber(i)
    );

    const vendor = await Vendor.findOneAndUpdate(
      {
        PhoneHash: phoneHash,
      },
      {
        VendorName: spec.name,
        PhoneHash: phoneHash,
        Vehicle: spec.vehicle,
        Status: 'ACTIVE',
        AvgRating: spec.avgRating,
        RatingCount: spec.ratingCount,
        Category_ID:
          categoryDocs[spec.category]._id,
      },
      {
        returnDocument: 'after',
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    /*
     * Generate a location around the demo center.
     */
    const latitude = jitter(
      DEMO_CENTER.latitude
    );

    const longitude = jitter(
      DEMO_CENTER.longitude
    );

    await VendorLocation.findOneAndUpdate(
      {
        Vendor_ID: vendor._id,
      },
      {
        Vendor_ID: vendor._id,
        geo: toApproximateGeoPoint(
          latitude,
          longitude
        ),
        UpdatedAt: new Date(),
        ExpiresAt: new Date(
          Date.now() + 60 * 60 * 1000
        ),
      },
      {
        returnDocument: 'after',
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    vendors.push(vendor);

    console.log(
      `[seed] Vendor ready: ${vendor.VendorName}`
    );
  }

  return vendors;
}

/* =========================================================
   RESIDENTS
========================================================= */

async function seedResidents() {
  const residents = [];

  for (const data of RESIDENT_SEED) {
    const phoneHash = hashPhoneNumber(
      data.phone
    );

    const resident =
      await Resident.findOneAndUpdate(
        {
          ResidentPhoneHash: phoneHash,
        },
        {
          ResidentPhoneHash: phoneHash,
          FirebaseUID: data.firebaseUID,
          DisplayName: data.displayName,
          Address: data.address,
          HomeLatitude: data.latitude,
          HomeLongitude: data.longitude,
          NotificationRadius:
            data.notificationRadius,
        },
        {
          returnDocument: 'after',
          upsert: true,
          setDefaultsOnInsert: true,
        }
      );

    residents.push(resident);

    console.log(
      `[seed] Resident ready: ${resident.DisplayName}`
    );
  }

  return residents;
}

/* =========================================================
   RESIDENT CATEGORY PREFERENCES
========================================================= */

async function seedResidentCategoryPreferences(
  residents,
  categoryDocs
) {
  const categories =
    Object.values(categoryDocs);

  let count = 0;

  for (let i = 0; i < residents.length; i += 1) {
    /*
     * Each resident gets two preferred categories.
     */
    const category1 =
      categories[i % categories.length];

    const category2 =
      categories[
        (i + 1) % categories.length
      ];

    const selected = [
      category1,
      category2,
    ];

    for (const category of selected) {
      await ResidentCategoryPreference.findOneAndUpdate(
        {
          Resident_ID: residents[i]._id,
          Category_ID: category._id,
        },
        {
          Resident_ID: residents[i]._id,
          Category_ID: category._id,
        },
        {
          returnDocument: 'after',
          upsert: true,
          setDefaultsOnInsert: true,
        }
      );

      count += 1;
    }
  }

  console.log(
    `[seed] Resident category preferences: ${count}`
  );
}

/* =========================================================
   RATINGS
========================================================= */

async function seedRatings(
  vendors,
  residents
) {
  const demoRatings = [
    {
      value: 5,
      review: 'Excellent service and fresh products.',
    },
    {
      value: 4,
      review: 'Good quality and friendly vendor.',
    },
    {
      value: 4,
      review: 'Nice snacks and reasonable price.',
    },
    {
      value: 3,
      review: 'Decent service.',
    },
  ];

  let count = 0;

  for (let i = 0; i < vendors.length; i += 1) {
    const vendor = vendors[i];

    /*
     * One rating per vendor/resident pair because
     * the schema has a unique compound index.
     */
    const resident =
      residents[i % residents.length];

    const rating = demoRatings[i];

    await Rating.findOneAndUpdate(
      {
        Vendor_ID: vendor._id,
        Resident_ID: resident._id,
      },
      {
        Vendor_ID: vendor._id,
        Resident_ID: resident._id,
        RatingValue: rating.value,
        Review: rating.review,
        RatingDate: new Date(
          Date.now() -
            (i + 1) * 24 * 60 * 60 * 1000
        ),
      },
      {
        returnDocument: 'after',
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    count += 1;
  }

  console.log(
    `[seed] Ratings: ${count}`
  );
}

/* =========================================================
   VENDOR SESSIONS
========================================================= */

async function seedVendorSessions(
  vendors
) {
  let count = 0;

  for (let i = 0; i < vendors.length; i += 1) {
    const vendor = vendors[i];

    /*
     * Fake WhatsApp number/hash.
     */
    const whatsappHash = hashPhoneNumber(
      `+919876543${500 + i}`
    );

    await VendorSession.findOneAndUpdate(
      {
        Vendor_ID: vendor._id,
      },
      {
        Vendor_ID: vendor._id,
        WhatsAppHash: whatsappHash,

        /*
         * Demo vendors have already given consent.
         */
        SessionStatus: 'ACTIVE',

        LastActive: new Date(),

        Consent: true,

        ConsentTimestamp: new Date(
          Date.now() - 24 * 60 * 60 * 1000
        ),

        NoticeVersion: 'v1.0',

        ConsentWithdrawnAt: null,
      },
      {
        returnDocument: 'after',
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    count += 1;
  }

  console.log(
    `[seed] Vendor sessions: ${count}`
  );
}

/* =========================================================
   ACTIVITY LOGS
========================================================= */

async function seedActivityLogs(
  vendors
) {
  const events = [
    {
      event: 'VENDOR_REGISTERED',
      description:
        'Vendor registered successfully.',
    },
    {
      event: 'CONSENT_GRANTED',
      description:
        'Vendor granted WhatsApp location tracking consent.',
    },
    {
      event: 'LOCATION_UPDATED',
      description:
        'Vendor location was updated.',
    },
    {
      event: 'VENDOR_ACTIVE',
      description:
        'Vendor became active.',
    },
    {
      event: 'LOCATION_REFRESHED',
      description:
        'Vendor location refreshed.',
    },
    {
      event: 'LOCATION_UPDATED',
      description:
        'Vendor sent another location update.',
    },
  ];

  let count = 0;

  for (
    let vendorIndex = 0;
    vendorIndex < vendors.length;
    vendorIndex += 1
  ) {
    const vendor = vendors[vendorIndex];

    /*
     * Give each vendor several historical activity logs.
     */
    for (
      let eventIndex = 0;
      eventIndex < events.length;
      eventIndex += 1
    ) {
      const event = events[eventIndex];

      await ActivityLog.create({
        Vendor_ID: vendor._id,
        Event: event.event,
        Description: event.description,
        EventTime: new Date(
          Date.now() -
            (
              vendorIndex * 6 +
              eventIndex + 1
            ) *
              15 *
              60 *
              1000
        ),
      });

      count += 1;
    }
  }

  console.log(
    `[seed] Activity logs: ${count}`
  );
}

/* =========================================================
   ALERTS
========================================================= */

async function seedAlerts(
  vendors,
  residents
) {
  let count = 0;

  /*
   * Create several realistic proximity alerts.
   */
  for (let i = 0; i < 12; i += 1) {
    const vendor =
      vendors[i % vendors.length];

    const resident =
      residents[i % residents.length];

    const distance =
      [120, 180, 240, 310, 375, 450][
        i % 6
      ];

    const eta =
      [2, 3, 4, 5, 6, 8][i % 6];

    await Alert.create({
      Vendor_ID: vendor._id,
      Resident_ID: resident._id,

      Timestamp: new Date(
        Date.now() -
          (i + 1) * 30 * 60 * 1000
      ),

      EtaMinutes: eta,

      DistanceAtAlert: distance,
    });

    count += 1;
  }

  console.log(
    `[seed] Alerts: ${count}`
  );
}

/* =========================================================
   PROCESSED EVENTS
========================================================= */

async function seedProcessedEvents(
  vendors
) {
  let count = 0;

  for (let i = 0; i < vendors.length * 3; i += 1) {
    /*
     * MessageId is unique, so use deterministic
     * demo IDs and upsert them.
     */
    const messageId =
      `demo-location-message-${String(
        i + 1
      ).padStart(3, '0')}`;

    await ProcessedEvent.findOneAndUpdate(
      {
        MessageId: messageId,
      },
      {
        MessageId: messageId,

        ReceivedAt: new Date(
          Date.now() -
            (i + 1) * 10 * 60 * 1000
        ),

        /*
         * Keep demo events alive for 24 hours.
         */
        ExpiresAt: new Date(
          Date.now() +
            24 * 60 * 60 * 1000
        ),
      },
      {
        returnDocument: 'after',
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    count += 1;
  }

  console.log(
    `[seed] Processed events: ${count}`
  );
}

/* =========================================================
   DATABASE SUMMARY
========================================================= */

async function printSummary() {
  const [
    categories,
    vendors,
    vendorLocations,
    residents,
    activities,
    alerts,
    processedEvents,
    ratings,
    preferences,
    sessions,
  ] = await Promise.all([
    Category.countDocuments(),
    Vendor.countDocuments(),
    VendorLocation.countDocuments(),
    Resident.countDocuments(),
    ActivityLog.countDocuments(),
    Alert.countDocuments(),
    ProcessedEvent.countDocuments(),
    Rating.countDocuments(),
    ResidentCategoryPreference.countDocuments(),
    VendorSession.countDocuments(),
  ]);

  console.log('\n========================================');
  console.log('             DATABASE SUMMARY');
  console.log('========================================');

  console.log(
    `Categories                 : ${categories}`
  );

  console.log(
    `Vendors                    : ${vendors}`
  );

  console.log(
    `Vendor Locations           : ${vendorLocations}`
  );

  console.log(
    `Residents                  : ${residents}`
  );

  console.log(
    `Activity Logs              : ${activities}`
  );

  console.log(
    `Alerts                     : ${alerts}`
  );

  console.log(
    `Processed Events           : ${processedEvents}`
  );

  console.log(
    `Ratings                    : ${ratings}`
  );

  console.log(
    `Resident Category Prefs   : ${preferences}`
  );

  console.log(
    `Vendor Sessions            : ${sessions}`
  );

  console.log('========================================\n');
}

/* =========================================================
   NORMAL SEED
========================================================= */

async function runSeed() {
  try {
    console.log(
      '\n========================================'
    );

    console.log(
      '        DATABASE SEED STARTING'
    );

    console.log(
      '========================================\n'
    );

    await connectDB();

    /*
     * 1. Categories
     */
    console.log(
      '[seed] Seeding categories...'
    );

    const categoryDocs =
      await seedCategories();

    /*
     * 2. Vendors
     */
    console.log(
      '\n[seed] Seeding vendors...'
    );

    const vendors =
      await seedVendors(categoryDocs);

    /*
     * 3. Residents
     */
    console.log(
      '\n[seed] Seeding residents...'
    );

    const residents =
      await seedResidents();

    /*
     * 4. Resident preferences
     */
    console.log(
      '\n[seed] Seeding category preferences...'
    );

    await seedResidentCategoryPreferences(
      residents,
      categoryDocs
    );

    /*
     * 6. Ratings
     */
    console.log(
      '\n[seed] Seeding ratings...'
    );

    await seedRatings(
      vendors,
      residents
    );

    /*
     * 7. Vendor sessions
     */
    console.log(
      '\n[seed] Seeding vendor sessions...'
    );

    await seedVendorSessions(
      vendors
    );

    /*
     * 8. Activity logs
     */
    console.log(
      '\n[seed] Seeding activity logs...'
    );

    await seedActivityLogs(
      vendors
    );

    /*
     * 9. Alerts
     */
    console.log(
      '\n[seed] Seeding alerts...'
    );

    await seedAlerts(
      vendors,
      residents
    );

    /*
     * 10. Processed events
     */
    console.log(
      '\n[seed] Seeding processed events...'
    );

    await seedProcessedEvents(
      vendors
    );

    /*
     * Summary
     */
    await printSummary();

    /*
     * Vendor IDs
     */
    console.log(
      '[seed] Vendor IDs for simulation:'
    );

    vendors.forEach((vendor) => {
      console.log(
        `  - ${vendor.VendorName}: ${vendor._id}`
      );
    });

    console.log(
      '\n========================================'
    );

    console.log(
      '        DATABASE SEED COMPLETED'
    );

    console.log(
      '========================================\n'
    );
  } catch (error) {
    console.error(
      '\n[seed] Error:',
      error
    );

    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

/* =========================================================
   BUILD WALKING PATH
========================================================= */

function buildWalkingPath(
  startLat,
  startLng,
  steps = 30
) {
  const path = [];

  let lat = startLat;
  let lng = startLng;

  /*
   * Small random direction.
   */
  const headingLat =
    (Math.random() - 0.5) * 0.0006;

  const headingLng =
    (Math.random() - 0.5) * 0.0006;

  for (let i = 0; i < steps; i += 1) {
    lat +=
      headingLat +
      (Math.random() - 0.5) * 0.0001;

    lng +=
      headingLng +
      (Math.random() - 0.5) * 0.0001;

    path.push({
      latitude: lat,
      longitude: lng,
    });
  }

  return path;
}

/* =========================================================
   POST LOCATION PING
========================================================= */

async function postLocationPing(
  vendorId,
  latitude,
  longitude
) {
  const url =
    `${API_BASE_URL}/api/vendors/${vendorId}/location`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        latitude,
        longitude,
      }),
    });

    if (!response.ok) {
      const body =
        await response.text();

      console.error(
        `[simulate] Ping rejected for ${vendorId} (${response.status}): ${body}`
      );

      return false;
    }

    console.log(
      `[simulate] Vendor ${vendorId} -> (${latitude.toFixed(
        5
      )}, ${longitude.toFixed(5)})`
    );

    return true;
  } catch (error) {
    console.error(
      `[simulate] Failed to ping vendor ${vendorId}: ${error.message}`
    );

    return false;
  }
}

/* =========================================================
   GPS SIMULATION
========================================================= */

async function runSimulation() {
  let timer = null;

  try {
    console.log(
      '\n========================================'
    );

    console.log(
      '        VENDOR GPS SIMULATION'
    );

    console.log(
      '========================================\n'
    );

    await connectDB();

    const vendors = await Vendor.find({
      Status: 'ACTIVE',
    })
      .select('VendorName')
      .lean();

    if (vendors.length === 0) {
      throw new Error(
        'No active vendors found. Run npm run seed first.'
      );
    }

    const locations =
      await VendorLocation.find({
        Vendor_ID: {
          $in: vendors.map(
            (vendor) => vendor._id
          ),
        },
      }).lean();

    const locationByVendor =
      new Map(
        locations.map((location) => [
          String(location.Vendor_ID),
          location,
        ])
      );

    const paths = vendors.map(
      (vendor) => {
        const location =
          locationByVendor.get(
            String(vendor._id)
          );

        const startLat = location
          ? location.geo.coordinates[1]
          : DEMO_CENTER.latitude;

        const startLng = location
          ? location.geo.coordinates[0]
          : DEMO_CENTER.longitude;

        return {
          vendorId: String(
            vendor._id
          ),

          vendorName:
            vendor.VendorName,

          waypoints:
            buildWalkingPath(
              startLat,
              startLng
            ),

          cursor: 0,
        };
      }
    );

    console.log(
      `[simulate] Streaming GPS for ${paths.length} vendors`
    );

    console.log(
      `[simulate] Interval: ${SIMULATE_INTERVAL_MS}ms`
    );

    console.log(
      `[simulate] API: ${API_BASE_URL}`
    );

    console.log(
      '[simulate] Press Ctrl+C to stop.\n'
    );

    /*
     * Use recursive setTimeout rather than
     * setInterval so requests cannot overlap.
     */
    const tick = async () => {
      try {
        await Promise.all(
          paths.map(
            async (path) => {
              if (
                path.cursor >=
                path.waypoints.length
              ) {
                path.cursor = 0;
              }

              const point =
                path.waypoints[
                  path.cursor
                ];

              path.cursor += 1;

              await postLocationPing(
                path.vendorId,
                point.latitude,
                point.longitude
              );
            }
          )
        );
      } finally {
        timer = setTimeout(
          tick,
          SIMULATE_INTERVAL_MS
        );
      }
    };

    await tick();
  } catch (error) {
    console.error(
      '[simulate] Error:',
      error.message
    );

    if (timer) {
      clearTimeout(timer);
    }

    await mongoose.connection.close();

    process.exit(1);
  }

  const shutdown =
    async () => {
      if (timer) {
        clearTimeout(timer);
      }

      console.log(
        '\n[simulate] Stopped.'
      );

      await mongoose.connection.close();

      process.exit(0);
    };

  process.on(
    'SIGINT',
    shutdown
  );

  process.on(
    'SIGTERM',
    shutdown
  );
}

/* =========================================================
   ENTRY POINT
========================================================= */

const mode = process.argv[2];

if (mode === 'simulate') {
  runSimulation();
} else {
  runSeed();
}
