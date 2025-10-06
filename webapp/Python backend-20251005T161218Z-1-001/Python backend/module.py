import requests
import datetime
import numpy as np
from sklearn.linear_model import LinearRegression

BASE_URL = "https://power.larc.nasa.gov/api/temporal/daily/point"
CACHE = {}
lookupt2m = {}
lookupprec = {}
lookupwind = {}
lookuphum = {}
lookuppress = {}
lookuptmax = {}

def fetch_temperature_data(lat, lon, start_date: str, end_date: str, parameters="T2M,PRECTOT,WS2M,RH2M,PS,T2M_MAX"):
    key = (lat, lon, start_date, end_date, parameters)
    if key in CACHE:
        return CACHE[key]

    params = {
        "start": start_date.replace("-", ""),
        "end": end_date.replace("-", ""),
        "latitude": lat,
        "longitude": lon,
        "parameters": parameters,
        "format": "JSON",
        "community": "RE"
    }

    resp = requests.get(BASE_URL, params=params)
    resp.raise_for_status()
    data = resp.json()
    CACHE[key] = data
    return data

def compr(yy, mm, dd):
    cur = datetime.date(2025,9,19)
    if yy < cur.year:
        return False
    elif mm < cur.month and yy == cur.year:
        return False
    elif dd < cur.day and yy == cur.year and mm == cur.month:
        return False
    else:
        return True

def precalc(lat, lon):
    year_start = 1981
    cur1 = datetime.datetime.now()
    start_date = f"{year_start}-01-01"
    end_date = f"2025-09-20"

    data = fetch_temperature_data(lat, lon, start_date, end_date,
                                  parameters="T2M,PRECTOT,WS2M,RH2M,PS,T2M_MAX")

    # Extract each parameter
    t2m_data = data["properties"]["parameter"]["T2M"]
    prectot_data = data["properties"]["parameter"]["PRECTOTCORR"]
    wind_data = data["properties"]["parameter"]["WS2M"]
    hum_data = data["properties"]["parameter"]["RH2M"]
    press_data = data["properties"]["parameter"]["PS"]
    t2m_max_data = data["properties"]["parameter"]["T2M_MAX"]

    # Store in lookup dicts by (month, day) -> {year: value}
    for datestr, value in t2m_data.items():
        if value is None:
            continue
        dt = datetime.datetime.strptime(datestr, "%Y%m%d").date()
        lookupt2m.setdefault((dt.month, dt.day), {})[dt.year] = value

    for datestr, value in prectot_data.items():
        if value is None:
            continue
        dt = datetime.datetime.strptime(datestr, "%Y%m%d").date()
        lookupprec.setdefault((dt.month, dt.day), {})[dt.year] = value

    for datestr, value in wind_data.items():
        if value is None:
            continue
        dt = datetime.datetime.strptime(datestr, "%Y%m%d").date()
        lookupwind.setdefault((dt.month, dt.day), {})[dt.year] = value

    for datestr, value in hum_data.items():
        if value is None:
            continue
        dt = datetime.datetime.strptime(datestr, "%Y%m%d").date()
        lookuphum.setdefault((dt.month, dt.day), {})[dt.year] = value

    for datestr, value in press_data.items():
        if value is None:
            continue
        dt = datetime.datetime.strptime(datestr, "%Y%m%d").date()
        lookuppress.setdefault((dt.month, dt.day), {})[dt.year] = value

    for datestr, value in t2m_max_data.items():
        if value is None:
            continue
        dt = datetime.datetime.strptime(datestr, "%Y%m%d").date()
        lookuptmax.setdefault((dt.month, dt.day), {})[dt.year] = value

    # Debug print for May 19, 2025
    if (5, 19) in lookuptmax and 2025 in lookuptmax[(5, 19)]:
        print(f"T2M_MAX for 2025-05-19: {lookuptmax[(5,19)][2025]} Â°C")

def get_oct4_temperatures(lat, lon, mm, dd):
    return (lookupt2m[(mm, dd)],
            lookupprec[(mm, dd)],
            lookupwind[(mm, dd)],
            lookuphum[(mm, dd)],
            lookuppress[(mm, dd)],
            lookuptmax[(mm, dd)])

def predict_next_year(data_dict, cur_year):
    years = np.array(list(data_dict.keys())).reshape(-1, 1)
    values = np.array(list(data_dict.values()))
        
    model = LinearRegression()
    model.fit(years, values)
    trend_pred = model.predict(np.array([[cur_year]]))[0]
    
    base_level = np.median(values)
    trend_slope = model.coef_[0]
    
    weight_trend = min(1, abs(trend_slope)/np.std(values))
    weight_base = 1 - weight_trend
    
    prediction = weight_trend * trend_pred + weight_base * base_level
    return prediction

def calc(lat, lon, mm1, dd1, mm2, dd2, yy1, yy2):
    st_dt = datetime.date(yy1, mm1, dd1)
    nd_dt = datetime.date(yy2, mm2, dd2)
    cur = st_dt
    results = []

    while cur <= nd_dt:
        oct4_temps, oct4_prec, oct4_wind, oct4_hum, oct4_press, oct4_tmax = get_oct4_temperatures(lat, lon, cur.month, cur.day)

        if compr(cur.year, cur.month, cur.day) == False:
            date_key = f"{cur.year}-{cur.month:02d}-{cur.day:02d}"
            weather_data = {
                date_key: {
                    "windspeed": oct4_wind[cur.year],
                    "temperature": oct4_tmax[cur.year],
                    "precipitation": oct4_prec[cur.year],
                    "humidity": oct4_hum[cur.year],
                    "pressure": oct4_press[cur.year]*10
                    
                }
            }
            results.append(weather_data)
        else:
            # Prediction logic
            p = sum1 = L = 0
            for yr in oct4_prec.keys():
                L += 1
                if oct4_prec[yr] > 0.1:
                    p += 1
                    sum1 += oct4_prec[yr]
            rainc = round(p / L * 100) if L > 0 else 0
            pred_prec = round(sum1 / p, 1) if p > 0 else 0
            pred_temp = round(predict_next_year(oct4_temps, cur.year), 1)
            pred_wind = round(predict_next_year(oct4_wind, cur.year), 1)
            pred_hum = round(predict_next_year(oct4_hum, cur.year), 1)
            pred_press = round(predict_next_year(oct4_press, cur.year), 1)
            pred_tmax = round(predict_next_year(oct4_tmax, cur.year), 1)

            date_key = f"{cur.year}-{cur.month:02d}-{cur.day:02d}"
            weather_data = {
                date_key: {
                    "windspeed": pred_wind,
                    "temperature": pred_tmax,
                    "precipitation": pred_prec,
                    "rain chance": rainc,
                    "humidity": pred_hum,
                    "pressure": pred_press*10,
                }
            }
            results.append(weather_data)

        cur += datetime.timedelta(days=1)
    return results

def front_function(yy1, yy2, dd1, mm1, dd2, mm2, lat, lon):
    precalc(lat, lon)
    return calc(lat, lon, mm1, dd1, mm2, dd2, yy1, yy2)

if __name__ == "__main__":
    lat = float(input("lat: "))
    lon = float(input("lon: "))
    mm1 = int(input("mm1: "))
    dd1 = int(input("dd1: "))
    mm2 = int(input("mm2: "))
    dd2 = int(input("dd2: "))
    yy1 = int(input("yy1: "))
    yy2 = int(input("yy2: "))

    front_function(yy1, yy2, dd1, mm1, dd2, mm2, lat, lon)
