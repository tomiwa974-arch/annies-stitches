# Independent admin and customer sign-in

Admin sign-in is `/admin/login`; customer sign-in remains `/login`. Both accept an existing admin's credentials, but each side must be signed into separately. Regular users cannot sign into admin. Public registration never starts an admin session, including when a reserved first-admin registration grants the account its admin role.

Admin routes use a dedicated session cookie (`annies-admin-session`, scoped to `/admin`) and the `admin` authentication guard. Public routes retain the existing session cookie and `web` guard. Remembered-login cookies are guard-specific. Session and authentication configuration is selected per request using its matched route, without mutating shared configuration. Admin CSRF cookies are scoped to `/admin` so customer requests in another tab cannot overwrite the admin's CSRF token.

Admin profile requests use `/admin/account` and `/admin/account/presence`; customer profiles use `/api/account`. Admin profile updates and logout therefore use only the admin session. Guest shopping lists merge only into customer sessions. Personal notifications on the public side are limited to that account's requests and orders even if the account has the admin role.

`/admin/logout` clears and regenerates only the admin session and opens `/admin/logged-out`. Its sign-in link opens `/admin/login`. Public `/logout` leaves the admin session untouched. Admin history remains encrypted and is cleared on the admin signed-out screen. Missing admin sessions and unauthorized page navigation redirect to admin sign-in instead of rendering raw JSON. JSON API requests retain appropriate authentication errors.

After this change an existing browser may need to sign into admin once through the new URL. It can keep a different customer account open alongside it. Account roles and credentials still belong to the same database records; session isolation does not create duplicate accounts.

Functional tests use one cookie jar with path-aware cookie handling to verify both identities, separate CSRF validation, remembered sessions and independent logout. Browser checks use two actual tabs to verify customer registration and account switching, admin profile saving, and logout in both directions.
