# Retail Shopping App

## Overview

This project implements a mobile shopping experience with:

* product browsing
* cart management
* session-based reservations
* checkout flow

Built with:

* React Native (Expo)
* NestJS (BFF)

## Features

* Add/remove/update cart items
* Stock-aware cart validation
* Cart session expiration handling (2 minutes)
* Discount-aware totals

## How to run

### Backend (BFF)

```bash
cd bff
npm install
npm run start:dev
```

### Mobile app

```bash
cd mobile
npm install
npx expo start
```

## Notes

* Cart state is in-memory (as per requirements)
* App gracefully handles expired carts by creating a new session
* API responses are normalized in `api.ts`

## Improvements

* Persist carts in DB
* Add authentication
* Add checkout payment integration



