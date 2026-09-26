# Dodo Payments - Embeddable Checkout

This repository contains the implementation of the Dodo Payments Embeddable Checkout assignment.

## Architecture & How the pieces talk to each other

The project is structured as a monorepo with three main components:

1. **SDK (`packages/sdk`)**: A lightweight script (`DodoCheckout`) that websites drop in. When `open()` is called, it injects an `iframe` overlay into the host page.
2. **Checkout App (`packages/checkout`)**: A standalone React application running inside the iframe. It's built with React, Vite, and Tailwind CSS for a premium look and feel.
3. **Demo Site (`packages/demo`)**: A pretend merchant site built with plain HTML/TypeScript to demonstrate the integration.

### Communication Flow
- The host page calls `DodoCheckout.open({ productId, onSuccess, ... })`.
- The SDK creates an `iframe` and passes the `productId` securely via query string (e.g. `?productId=prod_123`).
- The Checkout App renders inside the iframe, preventing the host page from having access to sensitive card details.
- When an event occurs (e.g., successful payment, error, or user closes the modal), the Checkout App uses `window.parent.postMessage` to communicate securely back to the SDK.
- The SDK listens for these messages, animates the iframe out (if closed or successful), and triggers the respective callback functions (`onSuccess`, `onClose`, `onError`) provided by the host developer.

## Live Links & Repositories

- **Demo Store:** [https://embeddable-checkout-checkout-x87w.vercel.app](https://embeddable-checkout-checkout-x87w.vercel.app)
- **Hosted Checkout App:** [https://embeddable-checkout-checkout-psi.vercel.app](https://embeddable-checkout-checkout-psi.vercel.app)
- **GitHub Repository:** [abhishekgurjarin/Embeddable-Checkout](https://github.com/abhishekgurjarin/Embeddable-Checkout)

## How to Run Locally

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start the Checkout App (Hosted App)**
   ```bash
   npm run dev -w packages/checkout
   ```
   *Runs on `http://localhost:5173`. Keep this running.*

3. **Start the Demo Site (Merchant Site)**
   ```bash
   npm run dev -w packages/demo
   ```
   *Runs on `http://localhost:5174`. Open this in your browser.*

Click "Buy now" on the Demo Site to trigger the checkout. Use the provided test cards to simulate success, decline, and retry scenarios.

## Decisions I Went Back and Forth On

1. **Communication Method: `postMessage` vs. URL fragments / WebSockets**
   - *Why `postMessage`:* I briefly considered other state-syncing methods but settled on `postMessage` as it is the web-standard for secure iframe-to-parent communication. It requires zero backend infrastructure and offers immediate synchronous event handling while enforcing strict cross-origin security.
   
2. **Framework Choice for Checkout UI: Vanilla JS vs React**
   - *Why React:* While Vanilla JS would yield a smaller footprint, the assignment emphasizes handling "weird states" (loading, retries, multiple clicks) and providing a highly polished, finished feel. React's declarative state management makes it infinitely easier to robustly handle complex loading and error states without messy DOM manipulation.

## What I'd Explore Next

- **Bundle Size Optimization:** Ensure the SDK is bundled via Rollup/tsup strictly in IIFE format (for drop-in script tags) with maximum minification and zero dependencies.
- **Robust Security:** Implement strict `event.origin` checks in the `postMessage` listener within the SDK to ensure messages are only accepted from the verified Dodo Payments hosted domain.
- **Accessibility (a11y):** Further enhance the checkout iframe by ensuring focus is trapped within the modal while open, and restored to the trigger button when closed.
- **Theming API:** Allow the `DodoCheckout.open` method to accept primary colors and font families to seamlessly blend into the host site's branding.
