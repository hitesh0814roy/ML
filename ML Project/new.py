from flask import Flask, request, jsonify, render_template
import requests
import math
import os
from datetime import datetime, timedelta
import json

app = Flask(__name__)

# Configuration - Replace with your actual API keys
WEATHER_API_KEY = "your_openweather_api_key"  # Get from https://openweathermap.org/api
AVIATIONSTACK_API_KEY = "your_aviationstack_api_key"  # Get from https://aviationstack.com/

class FlightWeatherAnalyzer:
    def __init__(self):
        self.weather_base_url = "http://api.openweathermap.org/data/2.5"
        self.aviation_base_url = "http://api.aviationstack.com/v1"
    
    def get_coordinates(self, city_name):
        """Get coordinates for a city name"""
        try:
            url = f"http://api.openweathermap.org/geo/1.0/direct"
            params = {
                'q': city_name,
                'limit': 1,
                'appid': WEATHER_API_KEY
            }
            response = requests.get(url, params=params)
            data = response.json()
            
            if data and len(data) > 0:
                return {
                    'lat': data[0]['lat'],
                    'lon': data[0]['lon'],
                    'name': data[0]['name'],
                    'country': data[0]['country']
                }
            return None
        except Exception as e:
            print(f"Error getting coordinates: {e}")
            return None
    
    def get_weather_data(self, lat, lon):
        """Get current weather data for coordinates"""
        try:
            url = f"{self.weather_base_url}/weather"
            params = {
                'lat': lat,
                'lon': lon,
                'appid': WEATHER_API_KEY,
                'units': 'metric'
            }
            response = requests.get(url, params=params)
            data = response.json()
            
            if response.status_code == 200:
                return {
                    'temperature': data['main']['temp'],
                    'humidity': data['main']['humidity'],
                    'pressure': data['main']['pressure'],
                    'wind_speed': data['wind']['speed'],
                    'wind_direction': data['wind'].get('deg', 0),
                    'weather_condition': data['weather'][0]['main'],
                    'description': data['weather'][0]['description'],
                    'visibility': data.get('visibility', 10000),
                    'clouds': data['clouds']['all']
                }
            return None
        except Exception as e:
            print(f"Error getting weather data: {e}")
            return None
    
    def get_flight_conditions(self, weather_data):
        """Analyze if weather conditions are suitable for flying"""
        if not weather_data:
            return "Unknown", "No weather data available"
        
        conditions = []
        warnings = []
        
        # Temperature check
        if weather_data['temperature'] < -40 or weather_data['temperature'] > 50:
            warnings.append(f"Extreme temperature: {weather_data['temperature']}°C")
        
        # Wind speed check
        if weather_data['wind_speed'] > 50:  # m/s
            conditions.append("High wind conditions")
            warnings.append(f"High wind speed: {weather_data['wind_speed']} m/s")
        elif weather_data['wind_speed'] > 25:
            conditions.append("Moderate wind conditions")
        
        # Visibility check
        if weather_data['visibility'] < 5000:  # meters
            conditions.append("Low visibility")
            warnings.append(f"Low visibility: {weather_data['visibility']} meters")
        
        # Cloud cover check
        if weather_data['clouds'] > 80:
            conditions.append("Heavy cloud cover")
        elif weather_data['clouds'] > 50:
            conditions.append("Moderate cloud cover")
        
        # Weather condition check
        bad_conditions = ['Thunderstorm', 'Heavy Rain', 'Snow', 'Fog', 'Dust', 'Sand']
        if weather_data['weather_condition'] in bad_conditions:
            conditions.append(f"{weather_data['weather_condition']} conditions")
            warnings.append(f"Severe weather: {weather_data['description']}")
        
        # Overall assessment
        if warnings:
            status = "Not Suitable"
            details = " | ".join(warnings)
        elif conditions:
            status = "Marginal"
            details = " | ".join(conditions)
        else:
            status = "Suitable"
            details = "Good weather conditions for flying"
        
        return status, details
    
    def calculate_intermediate_points(self, start_coords, end_coords, num_points=5):
        """Calculate intermediate points along the flight path"""
        points = []
        
        start_lat, start_lon = start_coords['lat'], start_coords['lon']
        end_lat, end_lon = end_coords['lat'], end_coords['lon']
        
        # Add starting point
        points.append((start_lat, start_lon))
        
        # Calculate intermediate points
        for i in range(1, num_points + 1):
            fraction = i / (num_points + 1)
            lat = start_lat + (end_lat - start_lat) * fraction
            lon = start_lon + (end_lon - start_lon) * fraction
            points.append((lat, lon))
        
        # Add ending point
        points.append((end_lat, end_lon))
        
        return points
    
    def analyze_flight_path(self, departure_city, arrival_city):
        """Analyze weather along flight path between two cities"""
        try:
            # Get coordinates for both cities
            departure_coords = self.get_coordinates(departure_city)
            arrival_coords = self.get_coordinates(arrival_city)
            
            if not departure_coords or not arrival_coords:
                return {"error": "Could not find coordinates for one or both cities"}
            
            # Calculate intermediate points
            points = self.calculate_intermediate_points(departure_coords, arrival_coords)
            
            # Get weather for all points
            path_weather = []
            overall_suitable = True
            warnings = []
            
            for i, (lat, lon) in enumerate(points):
                weather = self.get_weather_data(lat, lon)
                status, details = self.get_flight_conditions(weather)
                
                point_info = {
                    'point_number': i + 1,
                    'coordinates': {'lat': lat, 'lon': lon},
                    'weather': weather,
                    'flight_status': status,
                    'details': details
                }
                
                path_weather.append(point_info)
                
                if status == "Not Suitable":
                    overall_suitable = False
                    warnings.append(f"Point {i+1}: {details}")
            
            # Calculate distance
            distance = self.calculate_distance(
                departure_coords['lat'], departure_coords['lon'],
                arrival_coords['lat'], arrival_coords['lon']
            )
            
            return {
                'departure_city': departure_coords,
                'arrival_city': arrival_coords,
                'distance_km': distance,
                'overall_status': "Suitable" if overall_suitable else "Not Suitable",
                'warnings': warnings,
                'path_analysis': path_weather,
                'analysis_time': datetime.now().isoformat()
            }
            
        except Exception as e:
            return {"error": f"Analysis failed: {str(e)}"}
    
    def calculate_distance(self, lat1, lon1, lat2, lon2):
        """Calculate distance between two points in kilometers using Haversine formula"""
        R = 6371  # Earth's radius in kilometers
        
        lat1_rad = math.radians(lat1)
        lat2_rad = math.radians(lat2)
        delta_lat = math.radians(lat2 - lat1)
        delta_lon = math.radians(lon2 - lon1)
        
        a = (math.sin(delta_lat/2) * math.sin(delta_lat/2) +
             math.cos(lat1_rad) * math.cos(lat2_rad) *
             math.sin(delta_lon/2) * math.sin(delta_lon/2))
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        
        return R * c
    
    def get_live_flight_data(self, flight_number=None):
        """Get live flight data from AviationStack API"""
        try:
            url = f"{self.aviation_base_url}/flights"
            params = {
                'access_key': AVIATIONSTACK_API_KEY,
                'limit': 10
            }
            
            if flight_number:
                params['flight_iata'] = flight_number
            
            response = requests.get(url, params=params)
            data = response.json()
            
            if response.status_code == 200 and data.get('data'):
                return data['data']
            else:
                return {"error": "Could not fetch flight data"}
                
        except Exception as e:
            return {"error": f"Flight data fetch failed: {str(e)}"}

# Initialize analyzer
analyzer = FlightWeatherAnalyzer()

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/analyze_route', methods=['POST'])
def analyze_route():
    """API endpoint to analyze flight route weather"""
    data = request.get_json()
    
    departure = data.get('departure')
    arrival = data.get('arrival')
    
    if not departure or not arrival:
        return jsonify({"error": "Departure and arrival cities are required"}), 400
    
    result = analyzer.analyze_flight_path(departure, arrival)
    return jsonify(result)

@app.route('/flight_status', methods=['GET'])
def flight_status():
    """API endpoint to get live flight status"""
    flight_number = request.args.get('flight_number')
    
    result = analyzer.get_live_flight_data(flight_number)
    return jsonify(result)

@app.route('/weather_point', methods=['GET'])
def weather_point():
    """API endpoint to get weather for a specific point"""
    lat = request.args.get('lat', type=float)
    lon = request.args.get('lon', type=float)
    
    if not lat or not lon:
        return jsonify({"error": "Latitude and longitude are required"}), 400
    
    weather = analyzer.get_weather_data(lat, lon)
    status, details = analyzer.get_flight_conditions(weather)
    
    return jsonify({
        'coordinates': {'lat': lat, 'lon': lon},
        'weather': weather,
        'flight_status': status,
        'details': details
    })

if __name__ == '__main__':
    # Create templates directory and basic HTML file
    os.makedirs('templates', exist_ok=True)
    
    with open('templates/index.html', 'w') as f:
        f.write('''
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Flight Weather Analyzer</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background-color: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .form-group { margin-bottom: 20px; }
        label { display: block; margin-bottom: 5px; font-weight: bold; }
        input[type="text"] { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
        button { background: #007cba; color: white; padding: 12px 30px; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; }
        button:hover { background: #005a87; }
        .result { margin-top: 30px; padding: 20px; border-radius: 5px; }
        .suitable { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; }
        .not-suitable { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; }
        .weather-point { margin: 10px 0; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Flight Path Weather Analyzer</h1>
        <p>Enter departure and arrival cities to analyze weather conditions along the flight path.</p>
        
        <form id="analysisForm">
            <div class="form-group">
                <label for="departure">Departure City:</label>
                <input type="text" id="departure" name="departure" placeholder="e.g., New York" required>
            </div>
            
            <div class="form-group">
                <label for="arrival">Arrival City:</label>
                <input type="text" id="arrival" name="arrival" placeholder="e.g., London" required>
            </div>
            
            <button type="submit">Analyze Flight Path</button>
        </form>
        
        <div id="result"></div>
    </div>

    <script>
        document.getElementById('analysisForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const departure = document.getElementById('departure').value;
            const arrival = document.getElementById('arrival').value;
            
            const resultDiv = document.getElementById('result');
            resultDiv.innerHTML = '<p>Analyzing flight path...</p>';
            
            try {
                const response = await fetch('/analyze_route', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        departure: departure,
                        arrival: arrival
                    })
                });
                
                const data = await response.json();
                
                if (data.error) {
                    resultDiv.innerHTML = `<div class="not-suitable"><h3>Error</h3><p>${data.error}</p></div>`;
                    return;
                }
                
                let html = `
                    <div class="${data.overall_status === 'Suitable' ? 'suitable' : 'not-suitable'}">
                        <h2>Flight Path Analysis Result</h2>
                        <p><strong>Route:</strong> ${data.departure_city.name} → ${data.arrival_city.name}</p>
                        <p><strong>Distance:</strong> ${data.distance_km.toFixed(2)} km</p>
                        <p><strong>Overall Status:</strong> ${data.overall_status}</p>
                        <p><strong>Analysis Time:</strong> ${new Date(data.analysis_time).toLocaleString()}</p>
                    </div>
                    
                    <h3>Detailed Path Analysis</h3>
                `;
                
                data.path_analysis.forEach(point => {
                    const weather = point.weather || {};
                    html += `
                        <div class="weather-point">
                            <h4>Point ${point.point_number} (Lat: ${point.coordinates.lat.toFixed(4)}, Lon: ${point.coordinates.lon.toFixed(4)})</h4>
                            <p><strong>Status:</strong> ${point.flight_status}</p>
                            <p><strong>Weather:</strong> ${weather.weather_condition || 'N/A'} - ${weather.description || 'N/A'}</p>
                            <p><strong>Temperature:</strong> ${weather.temperature || 'N/A'}°C</p>
                            <p><strong>Wind:</strong> ${weather.wind_speed || 'N/A'} m/s</p>
                            <p><strong>Visibility:</strong> ${weather.visibility || 'N/A'} meters</p>
                            <p><strong>Details:</strong> ${point.details}</p>
                        </div>
                    `;
                });
                
                if (data.warnings && data.warnings.length > 0) {
                    html += `<div class="not-suitable"><h4>Warnings:</h4><ul>`;
                    data.warnings.forEach(warning => {
                        html += `<li>${warning}</li>`;
                    });
                    html += `</ul></div>`;
                }
                
                resultDiv.innerHTML = html;
                
            } catch (error) {
                resultDiv.innerHTML = `<div class="not-suitable"><h3>Error</h3><p>${error.message}</p></div>`;
            }
        });
    </script>
</body>
</html>
        ''')
    
    print("Starting Flight Weather Analyzer Server...")
    print("Please make sure to set your API keys in the code:")
    print("1. WEATHER_API_KEY - Get from https://openweathermap.org/api")
    print("2. AVIATIONSTACK_API_KEY - Get from https://aviationstack.com/")
    print("\nAccess the application at: http://localhost:5000")
    
    app.run(debug=True, host='0.0.0.0', port=5000)