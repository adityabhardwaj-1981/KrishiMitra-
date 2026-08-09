# KrishiMitra AI — API Documentation

**Base URL (dev):** `http://localhost:5000/api`

All JSON requests use `Content-Type: application/json`. File upload endpoints use `multipart/form-data`.

## Authentication

Protected routes require an `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

Login/register return a `data.token` that must be stored in the client and sent on subsequent requests.

### Response Envelope

**Success:**
```json
{
  "success": true,
  "message": "String",
  "data": { /* module data */ }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Human-readable error",
  "details": { "field": "name", "value": "…" } // optional
}
```

---

## Auth

### `POST /auth/register`
Create a farmer account.
```json
{ "name": "Amit", "email": "a@b.com", "password": "secret123", "phone": "…", "location": "…", "farm_name": "…" }
```
**201** → `{ token, user }`

### `POST /auth/login`
```json
{ "email": "farmer@krishimitra.ai", "password": "Farmer@123" }
```
**200** → `{ token, user }`

### `GET /auth/me` *(auth)*
Returns the current user profile.

---

## AI Chat

### `POST /chat` *(auth)*
```json
{ "message": "How to improve wheat yield?" }
```
**200** → `{ reply, provider }`
Stores both the message and the assistant reply in history.

### `GET /chat/history` *(auth)*
Returns all chat messages for the user.

### `DELETE /chat/history` *(auth)*
Clears the user's chat history.

---

## Disease & Pest Detection

### `POST /detection/disease` *(auth, multipart)*
- Field `image` (file, optional-but-recommended) — a leaf/plant photo.
- Field `crop` (string) — optional crop hint to improve matching.

**200** →
```json
{
  "detected_disease": "…",
  "confidence": 0.82,
  "affected_crops": ["Wheat"],
  "symptoms": "…", "possible_causes": "…",
  "preventive_measures": "…", "control_measures": "…",
  "disclaimer": "…"
}
```

### `POST /detection/pest` *(auth, multipart)*
Same interface → `detected_pest`, `confidence`, `symptoms`, `prevention`, `control_measures`, `severity`.

### `GET /detection/history` *(auth)*
Returns the user's disease/pest detection history.

---

## Crop Recommendation

### `POST /crops/recommend` *(auth)*
```json
{ "soil_type": "sandy loam", "season": "kharif", "water_availability": "medium", "location": "Punjab", "previous_crop": "wheat" }
```
**200** → `{ recommended_crops: [{ name, reasoning, matches, suitability }], notes }`

### `GET /crops` *(public)*
Crop catalogue.
### `GET /crops/:id` *(public)*
Single crop.

---

## Soil Health

### `POST /soil/analyze` *(auth)*
```json
{ "ph": 6.2, "nitrogen": 150, "phosphorus": 25, "potassium": 110, "organic_carbon": 0.6, "soil_type": "loam", "location": "…" }
```
**200** → `{ summary, ph, nutrients, recommendations, disclaimer }`

### `GET /soil/history` *(auth)*
Previous soil analyses.

---

## Weather

### `GET /weather?city=Delhi` *(auth)*
**200** → `{ source, simulated, city, tempC, feelsLikeC, humidity, pressure, windSpeed, weather, forecast[], farmingTips[], lastUpdated }`

> When no `WEATHER_API_KEY` is configured, `simulated` is `true` and data is clearly flagged.

---

## Market Prices

### `GET /market?commodity=Wheat` *(auth)*
**200** → `{ prices: [...], trends: { Wheat: { change, direction } } }`

### `GET /market/:commodity` *(auth)*
Full price history for that commodity.

---

## Government Schemes

### `GET /schemes?q=pm` *(auth)*
Searchable list of seeded schemes (name/description/ministry).
### `GET /schemes/:id` *(auth)*
Single scheme.

> Scheme content is only from seeded, well-known public programs. It is never invented.

---

## Marketplace

### `GET /marketplace?category=&q=` *(public)*
Active listings, joined with seller name.
### `GET /marketplace/:id` *(public)*
Listing detail.
### `GET /marketplace/mine` *(auth)*
Listings owned by the current user.
### `POST /marketplace` *(auth, multipart)*
Create a listing: `title` (required), `description`, `category`, `price`, `quantity`, `unit`, `location`, `image`.
### `PUT /marketplace/:id` *(auth, owner/admin)*
Update fields or `status`.
### `DELETE /marketplace/:id` *(auth, owner/admin)*
Delete listing.

---

## Equipment Rental

### `GET /equipment?category=&q=` *(public)*
Available equipment.
### `GET /equipment/mine` *(auth)*
Equipment owned by user.
### `POST /equipment` *(auth, multipart)*
List equipment: `name`, `category`, `description`, `hourly_rate`, `daily_rate`, `location`, `image`.
### `POST /equipment/rent` *(auth)*
```json
{ "equipment_id": 1, "start_date": "2025-06-01", "end_date": "2025-06-05", "total_cost": 0 }
```
**201** → rental request (status `pending`).
### `PUT /equipment/:id/status` *(auth)*
`{ "status": "approved" | "rejected" | "completed" | "cancelled" }`
- Owner/admin: approve/reject. Renter: cancel.
- Approving marks equipment as `rented`; completing/cancelling/rejecting returns it to `available`.
### `GET /equipment/rentals/mine` *(auth)*
Returns `{ as_renter: [...], as_owner: [...] }`.

---

## Community

### `GET /community?category=&q=` *(public)*
Active posts with author and comment counts.
### `GET /community/:id` *(public)*
Post with its comments.
### `POST /community` *(auth)*
```json
{ "title": "…", "content": "…", "category": "…", "tags": ["wheat"] }
```
### `POST /community/:id/like` *(auth)*
Increments likes.
### `POST /community/:id/comment` *(auth)*
`{ "content": "…" }`
### `DELETE /community/:id` *(auth, author/admin)*
Deletes post + its comments.

---

## Farm Records & Analytics

### `GET|POST /farms` *(auth)*
Manage farm profiles (`name`, `area_hectares`, `soil_type`, `location`).

### `GET|POST /farms/activities` *(auth)*
Activity fields: `farm_id`, `crop_id`, `activity_type` (`planting|harvest|irrigation|fertilizer|pesticide|other`), `description`, `activity_date`, `quantity`, `cost`, `notes`.

### `DELETE /farms/activities/:id` *(auth)*

### `GET|POST /farms/records` *(auth)*
Record fields: `farm_id`, `crop_id`, `record_type` (`income|expense`), `category`, `title`, `amount`, `quantity`, `record_date`, `notes`.

### `DELETE /farms/records/:id` *(auth)*

### `GET /analytics` *(auth)*
```json
{
  "summary": { "income": 0, "expense": 0, "profit": 0 },
  "monthly": { "months": [], "income": [], "expense": [] },
  "cropPerformance": [{ "crop", "income", "expense" }],
  "activitySummary": [{ "activity_type", "count", "cost" }],
  "expenseByCategory": [{ "category", "total" }],
  "productionTrend": [{ "month", "quantity" }]
}
```

---

## Profile & Settings

### `PUT /profile` *(auth)*
`{ "name", "phone", "location", "farm_name", "language" }`

### `PUT /profile/password` *(auth)*
`{ "current_password", "new_password" }`

### `GET /profile/settings` *(auth)*
Returns account settings.

---

## Admin *(auth + role=admin)*

### `GET /admin/stats`
Counts: users, posts, listings, equipment, detections + recent users.

### `GET /admin/users`
### `PUT /admin/users/:id/status`
`{ "approved": true | false }`
### `PUT /admin/users/:id/role`
`{ "role": "farmer" | "admin" }`

### `POST /admin/crops`
`{ "name", "season", "soil_type", "water_requirement", "duration_days", "avg_yield", "description" }`
### `PUT|DELETE /admin/crops/:id`

### `POST /admin/schemes`
`{ "name", "ministry", "description", "eligibility", "benefits", "documents_required", "how_to_apply" }`
### `DELETE /admin/schemes/:id`

### `PUT /admin/posts/:id/moderation`
`{ "status": "active" | "hidden" }`
### `PUT /admin/listings/:id/moderation`
`{ "status": "active" | "sold" | "removed" }`

---

## Health

### `GET /health`
```json
{ "success": true, "status": "healthy", "db": "ok", "timestamp": "…" }
```

---

## HTTP Status Codes Used
- `200` OK · `201` Created · `400` Validation/Bad request · `401` Unauthenticated · `403` Unauthorized role · `404` Not found · `500` Server error

