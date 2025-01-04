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

        // Add marker for user's location
        L.marker([userLat, userLon]).addTo(map)
            .bindPopup("You are here").openPopup();

        // Fetch nearby hospitals using Overpass API
        const overpassUrl = `https://overpass-api.de/api/interpreter?data=[out:json];node["amenity"="hospital"](around:5000,${userLat},${userLon});out;`;

        fetch(overpassUrl)
            .then(response => response.json())
            .then(data => {
                data.elements.forEach(hospital => {
                    const lat = hospital.lat;
                    const lon = hospital.lon;
                    L.marker([lat, lon]).addTo(map)
                        .bindPopup(hospital.tags.name || "Hospital");
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
