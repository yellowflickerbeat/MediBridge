const API_CONFIG = {
    BASE_URL: 'your_api_base_url',
    HEADERS: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer your_api_key'
    }
};

export async function searchDoctors(specialty, location, insurance) {
    const response = await fetch(`${API_CONFIG.BASE_URL}/doctors/search`, {
        method: 'POST',
        headers: API_CONFIG.HEADERS,
        body: JSON.stringify({ specialty, location, insurance })
    });
    return response.json();
}

export async function bookAppointment(doctorId, timeSlot) {
    const response = await fetch(`${API_CONFIG.BASE_URL}/appointments`, {
        method: 'POST',
        headers: API_CONFIG.HEADERS,
        body: JSON.stringify({ doctorId, timeSlot })
    });
    return response.json();
}
