# Excito Implementation Roadmap (Step-by-Step)

This document translates product goals into execution tasks for backend, frontend, and operations.

## 1. Checkout Reliability Hardening

1. Define idempotency contract for order creation.
2. Add `idempotency_key` field to order model and enforce uniqueness (user + key).
3. Update checkout API to require idempotency key and return existing order on duplicate requests.
4. Wrap order creation and stock reservation in a single DB transaction.
5. Add strict stock re-check at payment confirmation using row-level locks.
6. Fail payment capture gracefully if stock changed; return clear user-facing error.
7. Persist payment gateway event IDs to prevent duplicate event handling.
8. Implement webhook signature verification using provider secret and timestamp tolerance.
9. Reject unverified or replayed webhook requests with audit log entries.
10. Add automated tests for retry checkout, duplicate webhook, and race-condition stock cases.

## 2. User Trust and Retention

1. Add order status history model (placed, confirmed, packed, shipped, delivered, cancelled, refunded).
2. Expose order timeline API and render timeline component on order detail page.
3. Add email notifications for key status transitions.
4. Add SMS notifications for key status transitions (optional user opt-in flag).
5. Build returns/refund request model with reason, item-level details, and attachment support.
6. Create return request form in frontend account/order pages.
7. Add admin workflow to approve, reject, or request more info for returns.
8. Add wishlist model + API endpoints (add/remove/list).
9. Add wishlist UI actions in product grid and product detail pages.
10. Track retention metrics: repeat purchase rate, return request resolution time, wishlist-to-order conversion.

## 3. Conversion Optimization

1. Add related products service (same category, tags, or co-purchase signal).
2. Show related products block on product detail pages.
3. Add recently viewed tracking (local storage + optional authenticated sync).
4. Build recently viewed carousel on home and category pages.
5. Add product reviews model with rating, title, comment, verification flag, moderation status.
6. Add review submission and display components with average rating summary.
7. Add size guide data model and CMS/admin form for per-category guidance.
8. Render size guide modal on product pages.
9. Add abandoned cart reminder job (email first, SMS optional) with trigger after inactivity window.
10. Add analytics events for recommendation clicks, review interactions, and cart recovery rate.

## 4. Admin Intelligence

1. Define dashboard KPIs: AOV, top products by revenue, repeat customers, order conversion, refund rate.
2. Build backend aggregate queries and cache expensive dashboard metrics.
3. Create dashboard UI cards/charts in admin panel.
4. Add low-stock threshold setting at product level.
5. Create low-stock alert service (daily digest + immediate alert for critical stock).
6. Add product CSV export endpoint with filters.
7. Add order CSV export endpoint with filters and date range.
8. Add product CSV import endpoint with validation and dry-run mode.
9. Add order import safeguards (status transition rules and conflict handling).
10. Add admin audit entries for bulk import/export actions.

## 5. Security and Abuse Protection

1. Add rate limiting middleware for login, OTP request/verify, and coupon apply endpoints.
2. Add per-IP and per-account thresholds with cooldown periods.
3. Strengthen request validation (input length, allowed chars, enum checks, price/quantity constraints).
4. Ensure coupon validation enforces expiry, usage cap, user cap, and minimum order amount.
5. Add structured audit logging for admin actions (who, what, when, before/after).
6. Restrict CORS to trusted frontend origins only.
7. Tighten CSRF cookie settings and secure session configuration.
8. Add security headers (HSTS, X-Frame-Options, Content-Security-Policy baseline).
9. Add alerting for suspicious authentication and coupon abuse patterns.
10. Add security-focused tests for brute force, replay, and invalid payload handling.

## 6. Performance and SEO

1. Migrate product/media rendering to optimized image pipeline (responsive sizes, modern formats).
2. Add lazy loading for product grids and defer offscreen assets.
3. Introduce API caching for product list endpoints (query-keyed cache + TTL + invalidation hooks).
4. Add pagination to all listing endpoints and admin tables.
5. Update frontend list pages to consume paginated APIs.
6. Add metadata generation for category and product pages (title, description, canonical URL).
7. Add structured schema markup for product, offer, rating, and breadcrumb.
8. Generate sitemap and robots configuration for crawl guidance.
9. Add performance monitoring (TTFB, API latency, cache hit ratio, Web Vitals).
10. Add regression tests for pagination and cache invalidation correctness.

## 7. Testing and CI/CD

1. Create test matrix for critical flows: order lifecycle, coupon rules, stock updates, auth/OTP.
2. Add backend unit tests for models, serializers, and business services.
3. Add backend integration tests for checkout, webhook, returns, and wishlist APIs.
4. Add frontend tests for cart, checkout, timeline, and wishlist interactions.
5. Add end-to-end smoke tests for sign-up -> browse -> checkout -> order tracking.
6. Add lint, type-check, and test commands to CI on every push and pull request.
7. Add migration check and Django system check in CI.
8. Add coverage reporting and minimum threshold gate.
9. Configure deploy pipeline stages (build, test, staging deploy, production approval).
10. Add rollback checklist and post-deploy verification script.

## Recommended Delivery Sequence

1. Sprint 1: Checkout reliability + security rate limiting + core tests.
2. Sprint 2: Order timeline + notifications + returns flow.
3. Sprint 3: Wishlist + reviews + related/recently viewed.
4. Sprint 4: Admin dashboard + low-stock alerts + CSV tools.
5. Sprint 5: Performance/SEO hardening + CI/CD maturity.

## Definition of Done (Cross-Cutting)

1. Feature includes migration, API contract, frontend UX, and admin support where applicable.
2. Feature is protected by automated tests and documented in README/changelog.
3. Monitoring/alerts are added for critical failure paths.
4. Security and validation checks are reviewed before release.
5. Feature is deployed behind a feature flag when rollout risk is high.