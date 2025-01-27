// Check if geolocation is available
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
        const userLat = position.coords.latitude;
        const userLon = position.coords.longitude;
        
        // Initialize the map centered on the user's location
        const map = L.map('map').setView([userLat, userLon], 13);

        // Add OpenStreetMap tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        const locationIcon = L.divIcon({
            html: `<div style="font-size: 32px;">📍</div>`,
            className: 'user-location-marker',
            iconSize: [24, 24],
            iconAnchor: [12, 24]
        });
        
        L.marker([userLat, userLon], { icon: locationIcon }).addTo(map);

        // Function to create Google Maps navigation URL
        function createGoogleMapsUrl(destLat, destLon) {
            return `https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLon}&destination=${destLat},${destLon}&travelmode=driving`;
        }

        // Fetch nearby hospitals using Overpass API
        const overpassUrl = `https://overpass-api.de/api/interpreter?data=[out:json];node["amenity"="hospital"](around:5000,${userLat},${userLon});out;`;

        fetch(overpassUrl)
            .then(response => response.json())
            .then(data => {
                data.elements.forEach(hospital => {
                    const lat = hospital.lat;
                    const lon = hospital.lon;
                    const hospitalName = hospital.tags.name || "Hospital";
                    
                    // Create marker with custom popup content including a navigation button
                    const marker = L.marker([lat, lon]).addTo(map);
                    const popupContent = `
                        <div>
                            <h3>${hospitalName}</h3>
                            <button onclick="window.open('${createGoogleMapsUrl(lat, lon)}', '_blank')" 
                                    style="padding: 8px; background-color: #4CAF50; color: white; border: none; 
                                           border-radius: 4px; cursor: pointer; margin-top: 5px;">
                                Get Directions
                            </button>
                        </div>
                    `;
                    marker.bindPopup(popupContent);
                });
            })
            .catch(error => {
                console.error("Error fetching hospital data:", error);
            });
    }, function(error) {
        alert("Geolocation is not supported or permission denied.");
    });
} else {
    alert("Geolocation is not supported by this browser.");
}