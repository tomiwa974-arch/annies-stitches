# Admin and account workflows

The admin tabs load current database records on navigation. Collections and works support image uploads, edits, and deletion. Store products support prices, stock, sizing, colour options, custom measurements, and primary images. Renaming a store category updates its products. Validation feedback keeps the editor open and preserves entered values.

Orders show customer contact details, delivery addresses, items, and custom measurements. Status and delivery progress stay aligned; payment confirmation is a separate manual control. Revenue counts paid, non-cancelled orders. Checkout uses database prices, reserves stock, and accepts an idempotency key to prevent duplicate submissions. Cancelling an order returns stock once; reopening checks availability before reserving it again. Deleting a product retains historical order item details.

Users supports search, role changes, activation, and deletion. An administrator cannot deactivate or demote their own account, or remove the final active administrator. Fittings lists submitted requests and contact information, provides status controls, and links to private reference images for signed-in active administrators. Activity records catalogue changes, order updates, fitting updates, and shopper interactions.

The shared profile menu loads account details and order/fitting updates. Settings saves name and email and can change the password. Email and password changes require the current password. Password changes invalidate remembered-login tokens. Sign out ends the session.

All admin pages and actions, including magazines, require an active authenticated administrator. Guests are redirected to sign in; authenticated regular users receive 403. Public magazine queries exclude drafts. Personal account APIs require an active login; private fitting images additionally require the admin role.

Users are grouped into Admin users and Regular users. Changing a role moves an account between groups on reload. Blocking immediately denies protected requests and revokes remembered-login tokens. Presence is updated every minute while a tab is visible; the Users list refreshes every 30 seconds. Online means an active account seen in the last two minutes; logout marks it offline while retaining its last-seen time.

Initial admin setup is reserved locally with `node scripts/reserve-admin.cjs your-email@example.com`. The matching registration receives the admin role once; the reservation is consumed in the same locked transaction as account creation. Other sign-ups always receive the regular role, regardless of submitted role fields. Once setup is claimed or an admin exists, the local reservation command refuses further setup. Subsequent promotions use the protected Users page.

Run migrations before starting a fresh database: `node ace migration:run`. The new migrations add checkout submission keys and remembered-login tokens. Payment processing and outbound notification email are not connected; payment confirmation is manual and notifications appear inside the profile menu.

Validation: backend and Inertia TypeScript checks, functional tests for CRUD/uploads, checkout/stock, tracking, users, fittings and account/password changes, plus browser checks for tab navigation, validation retention, profile saving, notifications and magazine access.
