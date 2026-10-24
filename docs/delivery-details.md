# Saved delivery details

Authenticated customers can save their recipient name, phone number, street address, optional directions, city, state/region, country and optional postal code from My Profile or the checkout dialog. Settings is no longer a profile menu item.

`GET /api/account` returns the signed-in customer's `deliveryAddress`; `PUT /api/account/delivery` validates and saves it. Equivalent `/admin/account` endpoints use the independent admin session. Delivery details are excluded from general user serialization.

Checkout asks the customer to review delivery details before placing an order. **Save delivery details** explicitly stores the address for future orders. **Place order** uses the reviewed details; it does not require overwriting a saved address for a one-off delivery. The order endpoint can also use the account's saved address if no address is supplied. Missing required delivery fields are rejected. Each order stores a separate address and phone snapshot, so subsequent profile changes do not alter existing orders. Existing order idempotency is preserved.

Migration: `1793700000000_add_delivery_address` adds the nullable JSON column `users.delivery_address`; no existing accounts are modified.
