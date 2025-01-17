// Check if geolocation is available
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function (position) {
        const userLat = position.coords.latitude;
        const userLon = position.coords.longitude;

        // Initialize the map centered on the user's location
        const map = L.map('map').setView([userLat, userLon], 13);

        // Add OpenStreetMap tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        // Add marker for user's location
        const redIcon = L.divIcon({
            html: `<div style="background-color: red; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>`,
            className: 'user-location-marker',
            iconSize: [16, 16]
        });

        L.marker([userLat, userLon], { icon: redIcon }).addTo(map)
            .bindPopup("You are here").openPopup();

        // Function to calculate distance between two coordinates (in km)
        function calculateDistance(lat1, lon1, lat2, lon2) {
            const R = 6371; // Radius of the Earth in km
            const dLat = (lat2 - lat1) * Math.PI / 180;
            const dLon = (lon2 - lon1) * Math.PI / 180;
            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return R * c; // Distance in km
        }

        // Fetch nearby hospitals using Overpass API
        const overpassUrl = `https://overpass-api.de/api/interpreter?data=[out:json];node["amenity"="hospital"](around:5000,${userLat},${userLon});out;`;

        fetch(overpassUrl)
            .then(response => response.json())
            .then(data => {
                // Calculate distances and store hospitals in an array
                const hospitals = data.elements.map(hospital => {
                    const distance = calculateDistance(userLat, userLon, hospital.lat, hospital.lon);
                    return { ...hospital, distance };
                });

                // Sort hospitals by distance
                hospitals.sort((a, b) => a.distance - b.distance);

                // Display the nearest 5 hospitals
                const nearestHospitals = hospitals.slice(0, 5);
                const hospitalList = document.getElementById("hospital-list");

                nearestHospitals.forEach((hospital, index) => {
                    const lat = hospital.lat;
                    const lon = hospital.lon;
                    const hospitalName = hospital.tags.name || `Hospital ${index + 1}`;
                    const distance = hospital.distance.toFixed(2);

                    // Add hospital to the sidebar
                    const hospitalItem = document.createElement("div");
                    hospitalItem.className = "hospital-item";
                    hospitalItem.innerHTML = `
                        <h3>${hospitalName}</h3>
                        <p>Distance: ${distance} km</p>
                        <button>Get Directions</button>
                    `;

                    hospitalList.appendChild(hospitalItem);

                    // Add marker for the hospital
                    const marker = L.marker([lat, lon]).addTo(map);
                    marker.bindPopup(`<h3>${hospitalName}</h3><p>Distance: ${distance} km</p>`);

                    // Highlight marker when sidebar item is clicked
                    hospitalItem.addEventListener("click", () => {
                        map.setView([lat, lon], 15);
                        marker.openPopup();
                    });

                    // Add click event for directions button
                    hospitalItem.querySelector("button").addEventListener("click", () => {
                        window.open(`https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLon}&destination=${lat},${lon}&travelmode=driving`, '_blank');
                    });
                });

                // Fit the map to show all nearest hospitals and user location
                const bounds = nearestHospitals.map(hospital => [hospital.lat, hospital.lon]);
                bounds.push([userLat, userLon]); // Include user location
                map.fitBounds(bounds, { padding: [50, 50] });
            })
            .catch(error => {
                console.error("Error fetching hospital data:", error);
            });
    }, function (error) {
        alert("Geolocation is not supported or permission denied.");
    });
} else {
    alert("Geolocation is not supported by this browser.");
}
