# 🌱 Mowability

A full-stack web app that tells you the best day to mow your lawn — using real-time and historical weather data to calculate a daily "mowability" score for your address.

## What it does

Enter your address, and Mowability pulls a 5-day forecast plus 2 days of recent weather history for your location, then scores each day from 0–100 based on how good the conditions are for mowing. Each day's card shows:

- A **mowability score** (0–100), color-coded from red (poor) to green (excellent)
- A **weather icon** representing that day's conditions
- A **full breakdown** of exactly how the score was calculated — rain penalty, wind penalty, and temperature bonus — so you can see the reasoning, not just the number

## How the score works

The scoring algorithm starts at 100 and adjusts based on:

- **Rain chance today** — higher chance of rain lowers the score
- **Recent rainfall** — rain from the past 2 days is factored in with decay-based weighting (yesterday's rain matters more than the day before), since wet ground makes for bad mowing conditions even on a dry day
- **Wind speed** — high wind (above a set threshold) lowers the score
- **Temperature** — warmer days are rewarded, since higher temps mean drier grass

## Tech stack

**Frontend:** React (Vite), JavaScript, CSS
**Backend:** FastAPI (Python), httpx for async HTTP requests
**APIs:** [WeatherAPI](https://www.weatherapi.com/) for weather data, [Nominatim](https://nominatim.org/) (OpenStreetMap) for address geocoding

## Features

- 🔍 Real-time, debounced address autocomplete search
- 📍 Geocoding via Nominatim to convert addresses into coordinates
- 🌦️ 5-day forecast with 2 days of historical rainfall factored into scoring
- 🎨 Color-coded score cards (red → orange → yellow → yellow-green → green)
- 🧮 Transparent score breakdown shown for every day, not just a black-box number

## Project structure

```
Mowability/
├── Frontend/
│   └── mowability_project/     # React (Vite) app
│       ├── src/
│       │   ├── App.jsx
│       │   ├── App.css
│       │   └── index.css
│       └── package.json
└── Backend/
    └── main.py                 # FastAPI app
```

## Running locally

### Backend

```bash
cd Backend
python -m venv .venv
source .venv/bin/activate   # on Windows: .venv\Scripts\activate
pip install fastapi uvicorn httpx python-dotenv
```

Create a `.env` file in `Backend/`:
```
WEATHERAPI_KEY=your_weatherapi_key_here
```

Run the server:
```bash
uvicorn main:app --reload
```
The API will be available at `http://localhost:8000`.

### Frontend

```bash
cd Frontend/mowability_project
npm install
```

Create a `.env` file in `Frontend/mowability_project/`:
```
VITE_API_BASE_URL=http://localhost:8000
```

Run the dev server:
```bash
npm run dev
```
The app will be available at `http://localhost:5173`.

## Future improvements

- Deploy live (frontend on Vercel/Netlify, backend on Render/Railway)
- Add unit tests for the scoring algorithm
- Support multiple saved addresses
- Add a 7-day view option

---
