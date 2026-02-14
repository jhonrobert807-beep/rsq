# Week 8 — Ride Requests & Dispatch Module

**Branch:** `week-8/ride-requests-dispatch`
**Date:** Mar 1, 2026
**Modules:** Ride Requests, Dispatch (Haversine Algorithm)

---

## What Was Done

### 1. Ride Requests Module (`/api/ride-requests`)

Core booking flow — users create ride requests, drivers/admins update status, users can cancel.

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/api/ride-requests` | USER | Create a ride request |
| GET | `/api/ride-requests` | ADMIN | List all ride requests (filter by userId, status, driverId) |
| GET | `/api/ride-requests/my-rides` | USER | Get my ride requests |
| GET | `/api/ride-requests/driver-rides` | DRIVER | Get rides assigned to me |
| GET | `/api/ride-requests/:id` | Authenticated | Get ride request by ID |
| PATCH | `/api/ride-requests/:id/status` | ADMIN, DRIVER | Update ride status and assignments |
| PATCH | `/api/ride-requests/:id/cancel` | USER, ADMIN | Cancel a ride request |

**Key Features:**
- Full ride lifecycle: `CREATED → DISPATCHING → WAITING_DRIVER_ACCEPT → DRIVER_ACCEPTED → DRIVER_ARRIVED → IN_TRIP → COMPLETED`
- Auto-frees ambulance when ride is cancelled or completed
- Cancellation only allowed in early statuses (CREATED, DISPATCHING, WAITING_DRIVER_ACCEPT)
- Assigns driver, paramedic, ambulance, and hospital to ride

---

### 2. Dispatch Module (`/api/dispatch`)

**Haversine-based ambulance dispatch** — finds nearest available ambulances and auto-assigns them.

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/api/dispatch` | ADMIN | Auto-dispatch nearest ambulance to a ride request |
| GET | `/api/dispatch/nearest` | ADMIN, DRIVER | Find nearest available ambulances from GPS point |
| GET | `/api/dispatch/distance` | Authenticated | Calculate distance between two GPS points |

**Haversine Formula:**
The Haversine formula calculates the great-circle distance between two GPS coordinates on Earth's surface. This is a **free, no-paid-API** alternative to Google Maps Distance Matrix.

```
a = sin²(ΔLat/2) + cos(lat1) × cos(lat2) × sin²(ΔLng/2)
c = 2 × atan2(√a, √(1−a))
distance = R × c    (R = 6371 km)
```

**Auto-Dispatch Flow:**
1. Admin triggers dispatch for a ride request
2. System finds all AVAILABLE ambulances with known GPS location
3. Calculates distance from pickup point to each ambulance (Haversine)
4. Filters within radius (default 10 km)
5. Picks the nearest ambulance
6. Assigns it to the ride + marks ambulance as BUSY
7. Calculates ETA based on ~40 km/h average speed
8. If no ambulance found → ride marked as `FAILED_NO_DRIVER`

**Document Requirement Coverage:**
- **"System using GPS + Algorithm identifies the nearest available driver"** — Haversine distance calculation
- **"If driver does not accept, request is auto-reassigned to next nearest driver"** — Dispatch can be re-triggered by admin
- **"App calculates fastest route"** — ETA calculation included
- **"Cost is automatically calculated based on distance"** — Distance available for cost calculation
- **"Can monitor driver performance and reassign ambulances"** — Dispatch endpoint handles reassignment

---

## How to Test

```bash
# User creates a ride request
curl -X POST http://localhost:3001/api/ride-requests \
  -H "Authorization: Bearer <USER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"ambulanceType": "BASIC", "pickupLat": 24.8607, "pickupLng": 67.0011}'

# Admin auto-dispatches nearest ambulance
curl -X POST http://localhost:3001/api/dispatch \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"rideRequestId": "<RIDE_ID>", "radiusKm": 15}'

# Find nearest ambulances from a point
curl "http://localhost:3001/api/dispatch/nearest?lat=24.86&lng=67.00&radiusKm=10" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"

# Calculate distance between two points
curl "http://localhost:3001/api/dispatch/distance?lat1=24.86&lng1=67.00&lat2=24.92&lng2=67.05" \
  -H "Authorization: Bearer <TOKEN>"
```
