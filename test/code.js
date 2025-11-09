// Flight Data and Configuration
const FLIGHT_DATA = {
    airlines: [
        {
            id: 'ua',
            name: 'United Airlines',
            code: 'UA',
            fleet: {
                total: 850,
                active: 780,
                grounded: 70
            },
            delayStats: {
                percentage: 23,
                averageDelay: 45,
                mainReason: 'Weather & Air Traffic'
            }
        },
        {
            id: 'aa',
            name: 'American Airlines',
            code: 'AA',
            fleet: {
                total: 920,
                active: 860,
                grounded: 60
            },
            delayStats: {
                percentage: 19,
                averageDelay: 38,
                mainReason: 'Technical Issues'
            }
        },
        {
            id: 'dl',
            name: 'Delta Air Lines',
            code: 'DL',
            fleet: {
                total: 750,
                active: 710,
                grounded: 40
            },
            delayStats: {
                percentage: 15,
                averageDelay: 32,
                mainReason: 'Crew Scheduling'
            }
        },
        {
            id: 'wn',
            name: 'Southwest Airlines',
            code: 'WN',
            fleet: {
                total: 680,
                active: 650,
                grounded: 30
            },
            delayStats: {
                percentage: 28,
                averageDelay: 52,
                mainReason: 'Weather Conditions'
            }
        }
    ],
    flights: [
        {
            id: 'UA2154',
            airline: 'United Airlines',
            departure: { code: 'JFK', city: 'New York' },
            arrival: { code: 'LAX', city: 'Los Angeles' },
            scheduled: '14:30',
            estimated: '15:45',
            status: 'delayed',
            delay: 75,
            aircraft: 'Boeing 787-9',
            weatherImpact: {
                level: 'high',
                factors: ['High winds', 'Low visibility'],
                percentage: 70
            }
        },
        {
            id: 'AA1234',
            airline: 'American Airlines',
            departure: { code: 'ORD', city: 'Chicago' },
            arrival: { code: 'DFW', city: 'Dallas' },
            scheduled: '15:15',
            estimated: '15:45',
            status: 'delayed',
            delay: 30,
            aircraft: 'Airbus A321',
            weatherImpact: {
                level: 'medium',
                factors: ['Thunderstorms'],
                percentage: 45
            }
        },
        {
            id: 'DL5678',
            airline: 'Delta Air Lines',
            departure: { code: 'ATL', city: 'Atlanta' },
            arrival: { code: 'MIA', city: 'Miami' },
            scheduled: '16:00',
            estimated: '16:00',
            status: 'ontime',
            delay: 0,
            aircraft: 'Boeing 737-900',
            weatherImpact: {
                level: 'low',
                factors: ['Clear skies'],
                percentage: 5
            }
        },
        {
            id: 'WN9012',
            airline: 'Southwest Airlines',
            departure: { code: 'DEN', city: 'Denver' },
            arrival: { code: 'PHX', city: 'Phoenix' },
            scheduled: '17:30',
            estimated: '18:20',
            status: 'delayed',
            delay: 50,
            aircraft: 'Boeing 737-800',
            weatherImpact: {
                level: 'high',
                factors: ['Snow', 'High winds'],
                percentage: 80
            }
        },
        {
            id: 'UA3456',
            airline: 'United Airlines',
            departure: { code: 'SFO', city: 'San Francisco' },
            arrival: { code: 'ORD', city: 'Chicago' },
            scheduled: '18:45',
            estimated: '19:30',
            status: 'delayed',
            delay: 45,
            aircraft: 'Boeing 777',
            weatherImpact: {
                level: 'medium',
                factors: ['Fog', 'Light rain'],
                percentage: 55
            }
        }
    ],
    airports: [
        { code: 'JFK', city: 'New York', temperature: 8, condition: 'Cloudy', wind: 25, impact: 'high' },
        { code: 'LAX', city: 'Los Angeles', temperature: 22, condition: 'Sunny', wind: 12, impact: 'low' },
        { code: 'ORD', city: 'Chicago', temperature: 2, condition: 'Snow', wind: 30, impact: 'high' },
        { code: 'DFW', city: 'Dallas', temperature: 18, condition: 'Thunderstorms', wind: 35, impact: 'medium' },
        { code: 'ATL', city: 'Atlanta', temperature: 15, condition: 'Clear', wind: 8, impact: 'low' },
        { code: 'MIA', city: 'Miami', temperature: 28, condition: 'Partly Cloudy', wind: 15, impact: 'low' },
        { code: 'DEN', city: 'Denver', temperature: -3, condition: 'Heavy Snow', wind: 40, impact: 'critical' },
        { code: 'PHX', city: 'Phoenix', temperature: 25, condition: 'Sunny', wind: 10, impact: 'low' },
        { code: 'SFO', city: 'San Francisco', temperature: 12, condition: 'Fog', wind: 20, impact: 'medium' }
    ]
};

class FlightDashboard {
    constructor() {
        this.currentFilter = 'all';
        this.init();
    }

    init() {
        this.renderAirlines();
        this.renderFlights();
        this.renderAirportWeather();
        this.updateStats();
        this.bindEvents();
    }

    bindEvents() {
        // Refresh button
        document.getElementById('refreshBtn').addEventListener('click', () => {
            this.showLoading();
            setTimeout(() => {
                this.refreshData();
                this.hideLoading();
            }, 1500);
        });

        // Filter buttons
        document.querySelectorAll('.btn-filter').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.btn-filter').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentFilter = e.target.textContent.toLowerCase();
                this.renderFlights();
            });
        });

        // Weather control buttons
        document.querySelectorAll('.btn-weather').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.btn-weather').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.updateWeatherMap(e.target.dataset.type);
            });
        });

        // Modal close
        document.getElementById('modalClose').addEventListener('click', () => {
            this.closeModal();
        });

        // Close modal when clicking outside
        document.getElementById('flightModal').addEventListener('click', (e) => {
            if (e.target.id === 'flightModal') {
                this.closeModal();
            }
        });

        // Time range selector
        document.getElementById('timeRange').addEventListener('change', (e) => {
            this.updateAnalytics(e.target.value);
        });
    }

    renderAirlines() {
        const container = document.getElementById('airlinesGrid');
        container.innerHTML = FLIGHT_DATA.airlines.map(airline => `
            <div class="airline-card">
                <div class="airline-header">
                    <div class="airline-logo">${airline.code}</div>
                    <div class="airline-info">
                        <h3>${airline.name}</h3>
                        <p>${airline.code} • Major US Carrier</p>
                    </div>
                </div>
                <div class="fleet-stats">
                    <div class="fleet-stat">
                        <h4>${airline.fleet.total}</h4>
                        <p>Total Fleet</p>
                    </div>
                    <div class="fleet-stat">
                        <h4>${airline.fleet.active}</h4>
                        <p>Active</p>
                    </div>
                    <div class="fleet-stat">
                        <h4>${airline.fleet.grounded}</h4>
                        <p>Maintenance</p>
                    </div>
                </div>
                <div class="airline-delay">
                    <div class="delay-stats">
                        <div>
                            <div class="delay-percentage ${this.getDelayLevel(airline.delayStats.percentage)}">
                                ${airline.delayStats.percentage}%
                            </div>
                            <div class="delay-reason">${airline.delayStats.mainReason}</div>
                        </div>
                        <div>
                            <div class="avg-delay">Avg: ${airline.delayStats.averageDelay}m</div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderFlights() {
        const container = document.getElementById('flightList');
        let flights = FLIGHT_DATA.flights;

        // Apply filter
        if (this.currentFilter === 'delayed') {
            flights = flights.filter(flight => flight.status === 'delayed');
        } else if (this.currentFilter === 'on time') {
            flights = flights.filter(flight => flight.status === 'ontime');
        }

        container.innerHTML = flights.map(flight => `
            <div class="flight-item ${flight.status}" onclick="dashboard.showFlightDetails('${flight.id}')">
                <div class="flight-header">
                    <div class="flight-number">${flight.id}</div>
                    <div class="flight-status status-${flight.status}">
                        ${flight.status === 'delayed' ? 'DELAYED' : 'ON TIME'}
                    </div>
                </div>
                <div class="flight-route">
                    <div class="route-airport">
                        <div class="airport-code">${flight.departure.code}</div>
                        <div class="airport-city">${flight.departure.city}</div>
                    </div>
                    <div class="route-arrow">
                        <i class="fas fa-long-arrow-alt-right"></i>
                    </div>
                    <div class="route-airport">
                        <div class="airport-code">${flight.arrival.code}</div>
                        <div class="airport-city">${flight.arrival.city}</div>
                    </div>
                </div>
                <div class="flight-info">
                    <div class="flight-times">
                        <span>Scheduled: ${flight.scheduled}</span>
                        ${flight.status === 'delayed' ? 
                          `<span class="delayed">Estimated: ${flight.estimated}</span>` : 
                          `<span class="ontime">On Time</span>`}
                    </div>
                    ${flight.status === 'delayed' ? 
                      `<div class="flight-delay">
                         <span class="delay-badge">+${flight.delay}m</span>
                         <span class="delay-reason">Weather</span>
                       </div>` : 
                      '<div class="flight-delay"></div>'}
                </div>
            </div>
        `).join('');
    }

    renderAirportWeather() {
        const container = document.getElementById('airportWeather');
        container.innerHTML = FLIGHT_DATA.airports.map(airport => `
            <div class="airport-weather-item">
                <div class="airport-info">
                    <h4>${airport.code}</h4>
                    <p>${airport.city}</p>
                </div>
                <div class="weather-data">
                    <div class="temperature">${airport.temperature}°C</div>
                    <div class="weather-condition">${airport.condition}</div>
                    <div class="weather-impact">
                        <span class="impact-level ${airport.impact}">
                            ${airport.impact.toUpperCase()} IMPACT
                        </span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    updateStats() {
        const totalFlights = FLIGHT_DATA.flights.length;
        const delayedFlights = FLIGHT_DATA.flights.filter(f => f.status === 'delayed').length;
        const ontimeFlights = totalFlights - delayedFlights;
        
        // Calculate average weather impact
        const avgWeatherImpact = Math.round(
            FLIGHT_DATA.flights.reduce((sum, flight) => sum + flight.weatherImpact.percentage, 0) / totalFlights
        );

        document.getElementById('totalFlights').textContent = totalFlights;
        document.getElementById('delayedFlights').textContent = delayedFlights;
        document.getElementById('weatherImpact').textContent = `${avgWeatherImpact}%`;
        document.getElementById('ontimeFlights').textContent = ontimeFlights;
    }

    showFlightDetails(flightId) {
        const flight = FLIGHT_DATA.flights.find(f => f.id === flightId);
        if (!flight) return;

        // Update modal content
        document.getElementById('modalFlightNumber').textContent = `${flight.id} - ${flight.airline}`;
        document.getElementById('departureAirport').textContent = flight.departure.code;
        document.getElementById('departureCity').textContent = flight.departure.city;
        document.getElementById('arrivalAirport').textContent = flight.arrival.code;
        document.getElementById('arrivalCity').textContent = flight.arrival.city;
        document.getElementById('scheduledTime').textContent = flight.scheduled;
        document.getElementById('estimatedTime').textContent = flight.estimated;
        document.getElementById('delayTime').textContent = `+${flight.delay}m`;
        
        // Update weather impact
        const impactBar = document.getElementById('weatherImpactBar');
        impactBar.style.width = `${flight.weatherImpact.percentage}%`;

        // Show modal
        document.getElementById('flightModal').classList.add('show');
    }

    closeModal() {
        document.getElementById('flightModal').classList.remove('show');
    }

    updateWeatherMap(type) {
        const placeholder = document.querySelector('.map-placeholder');
        let content = '';
        
        switch(type) {
            case 'temperature':
                content = `
                    <i class="fas fa-thermometer-full"></i>
                    <p>Temperature Map Active</p>
                    <div class="weather-legend">
                        <div class="legend-item">
                            <span class="legend-color temp-hot"></span>
                            <span>Hot (>25°C)</span>
                        </div>
                        <div class="legend-item">
                            <span class="legend-color temp-mild"></span>
                            <span>Mild (10-25°C)</span>
                        </div>
                        <div class="legend-item">
                            <span class="legend-color temp-cool"></span>
                            <span>Cool (<10°C)</span>
                        </div>
                    </div>
                `;
                break;
            case 'precipitation':
                content = `
                    <i class="fas fa-cloud-showers-heavy"></i>
                    <p>Precipitation Map Active</p>
                    <div class="weather-legend">
                        <div class="legend-item">
                            <span class="legend-color" style="background: #3b82f6"></span>
                            <span>Heavy Rain</span>
                        </div>
                        <div class="legend-item">
                            <span class="legend-color" style="background: #60a5fa"></span>
                            <span>Light Rain</span>
                        </div>
                        <div class="legend-item">
                            <span class="legend-color" style="background: #93c5fd"></span>
                            <span>No Rain</span>
                        </div>
                    </div>
                `;
                break;
            case 'wind':
                content = `
                    <i class="fas fa-wind"></i>
                    <p>Wind Speed Map Active</p>
                    <div class="weather-legend">
                        <div class="legend-item">
                            <span class="legend-color" style="background: #ef4444"></span>
                            <span>High Wind (>40 km/h)</span>
                        </div>
                        <div class="legend-item">
                            <span class="legend-color" style="background: #f59e0b"></span>
                            <span>Moderate Wind</span>
                        </div>
                        <div class="legend-item">
                            <span class="legend-color" style="background: #10b981"></span>
                            <span>Calm Wind</span>
                        </div>
                    </div>
                `;
                break;
        }
        
        placeholder.innerHTML = content;
    }

    updateAnalytics(timeRange) {
        console.log(`Updating analytics for: ${timeRange}`);
        // In a real application, this would fetch new data based on the time range
    }

    refreshData() {
        // Simulate data refresh by adding some random variation
        FLIGHT_DATA.flights.forEach(flight => {
            if (flight.status === 'delayed') {
                flight.delay += Math.floor(Math.random() * 10) - 5;
                flight.delay = Math.max(0, flight.delay);
                
                // Update estimated time
                const [hours, minutes] = flight.scheduled.split(':').map(Number);
                const totalMinutes = hours * 60 + minutes + flight.delay;
                const newHours = Math.floor(totalMinutes / 60);
                const newMinutes = totalMinutes % 60;
                flight.estimated = `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
            }
        });

        // Update airport weather with slight variations
        FLIGHT_DATA.airports.forEach(airport => {
            airport.temperature += Math.floor(Math.random() * 3) - 1;
        });

        this.renderFlights();
        this.renderAirportWeather();
        this.updateStats();
    }

    showLoading() {
        document.getElementById('loadingSpinner').classList.add('show');
    }

    hideLoading() {
        document.getElementById('loadingSpinner').classList.remove('show');
    }

    getDelayLevel(percentage) {
        if (percentage >= 25) return 'high';
        if (percentage >= 15) return 'medium';
        return 'low';
    }
}

// Initialize the dashboard when the page loads
let dashboard;
document.addEventListener('DOMContentLoaded', () => {
    dashboard = new FlightDashboard();
    
    // Simulate real-time updates
    setInterval(() => {
        dashboard.refreshData();
    }, 30000); // Update every 30 seconds
});

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});