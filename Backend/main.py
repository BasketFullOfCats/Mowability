from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import httpx

app = FastAPI()

#this allows our web app to talk to python

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

#free website to find geo location
Website_URL = "https://nominatim.openstreetmap.org/search"

#when we recieve a GET request to the string below, we will run the function below
@app.get("/api/address-autocomplete")

#do other tasks while we wait for nominatim to fetch data
async def address_autocomplete(q: str = Query(..., min_length=3)):
    # accepts string q, queries nominatim and returns data
    headers = {
        "User-Agent": "BestTimeToMowApp/1.0 (Personal project, Bladensiu@gmail.com)"
    }
    
    #this will be our dictionary params we will be sending to nominatim to fill out
    params = {
        "q":q,
        "format":"json",
        "addressdetails":1,
        "limit":10,
        "countrycodes":"us"
    }
    
    #allow our backend to create a request as a client to other websites
    async with httpx.AsyncClient() as client:
        response = await client.get(Website_URL, params = params, headers = headers)
        # 200 = success, 404 = not found, 500 = server error
        if response.status_code != 200:
            raise HTTPException(status_code = 500, detail = "Failed to fetch address from Nominatim")
        #convert json data to python data
        data = response.json()

    suggestions = []
    for item in data:
        suggestions.append({
            "formattedAddress" : item.get("display_name"),
            "lat": float(item.get("lat")),
            "lon": float(item.get("lon")),
            "city": item.get("address", {}).get("city") or item.get("address", {}).get("town") or item.get("address", {}).get("village"),
            "state": item.get("address", {}).get("state"),
            "zip": item.get("address",{}).get("postcode")
        })
    return {"suggestions": suggestions}

@app.get("/api/mowability")
async def mowability(lat: float = Query(...), lon: float = Query(...)):
    weather_url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": lat,
        "longitude": lon,
        "daily": "precipitation_probability_max,precipitation_sum,temperature_2m_max,windspeed_10m_max,weathercode",
        "timezone": "auto",
        "forecast_days": 5,
        "past_days": 2  # gives us 2 days of history before today
    }


    async with httpx.AsyncClient() as client:
        response = await client.get(weather_url, params=params)
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail="Failed to fetch weather data")
        data = response.json()

    daily = data.get("daily", {})
    dates = daily.get("time", [])
    rain_chance = daily.get("precipitation_probability_max", [])
    rain_amount = daily.get("precipitation_sum", [])   # actual mm of rain, better for "how wet is the ground"
    max_temps = daily.get("temperature_2m_max", [])
    wind_speeds = daily.get("windspeed_10m_max", [])
    weather_codes = daily.get("weathercode", []) 


    # below I used google gemini to generate the following calculations:

    # With past_days=2, index 0 and 1 are yesterday/day-before, index 2 is today, 2-8 is the 7-day forecast
    forecast = []
    for i in range(2, len(dates)):  # start at index 2 = today
        rain_today_chance = rain_chance[i] if i < len(rain_chance) else 0
        temp = max_temps[i] if i < len(max_temps) else 0
        wind = wind_speeds[i] if i < len(wind_speeds) else 0

        # recent rain: day before (i-1) weighted more than two days before (i-2)
        rain_1_day_ago = rain_amount[i-1] if i-1 >= 0 else 0
        rain_2_days_ago = rain_amount[i-2] if i-2 >= 0 else 0
        recent_rain_penalty = (rain_1_day_ago * 3) + (rain_2_days_ago * 1.5)
        # weights (3 and 1.5) are a starting guess: yesterday's rain matters ~2x more than the day before

        score = 100
        score -= rain_today_chance * 0.6          # chance it rains today, still a real risk
        score -= recent_rain_penalty * 2           # ground still wet from recent weather
        score -= max(0, wind - 15) * 2             # windy days are still bad
        score += max(0, temp - 60) * 0.3           # warmer = drier grass, reward it (capped implicitly by clamp below)

        score = max(0, min(100, round(score)))

        code = weather_codes[i] if i < len(weather_codes) else None
        icon = get_weather_icon(code)

        forecast.append({
            "date": dates[i],
            "mowScore": score,
            "icon": icon,
            "scoreBreakdown": {
                "rainChanceToday": rain_today_chance,
                "rainPenalty": round(rain_today_chance * 0.6, 1),
                "recentRainMm": round(rain_1_day_ago + rain_2_days_ago, 1),
                "recentRainPenalty": round(recent_rain_penalty * 2, 1),
                "windSpeed": wind,
                "windPenalty": round(max(0, wind - 15) * 2, 1),
                "maxTemp": temp,
                "tempBonus": round(max(0, temp - 60) * 0.3, 1)

            }
        })
    return {"forecast": forecast}

def get_weather_icon(code: int) -> str:
    # Open-Meteo WMO weather codes -> emoji
    if code == 0:
        return "☀️"   # clear sky
    elif code in [1, 2, 3]:
        return "⛅"   # partly cloudy / overcast
    elif code in [45, 48]:
        return "🌫️"  # fog
    elif code in [51, 53, 55, 56, 57]:
        return "🌦️"  # drizzle
    elif code in [61, 63, 65, 66, 67]:
        return "🌧️"  # rain
    elif code in [71, 73, 75, 77]:
        return "❄️"   # snow
    elif code in [80, 81, 82]:
        return "🌧️"  # rain showers
    elif code in [85, 86]:
        return "🌨️"  # snow showers
    elif code in [95, 96, 99]:
        return "⛈️"   # thunderstorm
    else:
        return "🌡️"   # fallback

