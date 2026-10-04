# Event management backend

Run `npm install`, then `npm start`. Use `npm run dev` for automatic restarts during development and `npm test` for regression tests.

Configure `.env` with `MONGODB_URI` and `JWT_SECRET`. Payments additionally need `STRIPE_SECRET_KEY` and `CLIENT_URL`. The default port is 3000; override it with `PORT`.

Protected routes require `Authorization: Bearer <token>`. Deleting a booking requires its owner's user token. Administrator signup requires an existing administrator token; provision the first administrator through a trusted database administration process. Public administrator registration is intentionally disabled.

Checkout requires the owner's user token and a JSON body containing `serviceId`. The amount is read from the stored booking, in BDT, rather than the checkout request.

## Pricing limitation

Booking creation still receives its price from the client. Before accepting real payments, connect it to an authoritative server-side service catalog and validate the booking price against that catalog. No catalog or official price list is present in this project.

## Verification

The regression tests use mocked database methods and a local HTTP server. They do not connect to MongoDB or create Stripe payments. Live database and payment integration must be checked separately with test credentials.

Git is installed on the machine, but this project directory has not been initialized as a Git repository. The `.gitignore` excludes environment secrets, dependencies, logs, and uploaded files.

## Vercel deployment

Select the Express framework preset and deploy this project from its root directory. `app.js` exports the Express handler directly; API requests establish and reuse a MongoDB connection. The root route is a liveness response and does not verify database connectivity.

Set `MONGODB_URI` and `JWT_SECRET` in Vercel Project Settings > Environment Variables. Set `STRIPE_SECRET_KEY` and `CLIENT_URL` for checkout; `CLIENT_URL` must be the deployed frontend origin. Select the appropriate environments and redeploy after changing variables. Local `.env` files are excluded from Git and are not automatically transferred to Vercel.

Ensure MongoDB Atlas network access permits connections from the deployment. Check Vercel runtime logs if API requests return 503.

Profile-photo uploads currently use local disk. This upload storage is not suitable for Vercel's read-only, ephemeral function filesystem; use persistent object storage before enabling photo uploads there. Signup without a photo does not require disk writes.
