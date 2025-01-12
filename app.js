import { searchDoctors as apiSearchDoctors, bookAppointment as apiBookAppointment } from './api.js';

// Handle the search functionality
export async function handleSearch() {
    const specialty = document.getElementById('specialty').value;
    const location = document.getElementById('location').value;
    const insurance = document.getElementById('insurance').value;
    const resultsContainer = document.getElementById('results');

    // Validate inputs
    if (!specialty || !location || !insurance) {
        showError('Please fill in all fields');
        return;
    }

    try {
        // Show loading state
        showLoading();

        // Call the API
        const doctors = await apiSearchDoctors(specialty, location, insurance);
        
        // Display results
        displayResults(doctors);
    } catch (error) {
        console.error('Search error:', error);
        showError('Unable to find doctors. Please try again later.');
    }
}

// Handle the booking functionality
export async function handleBooking(doctorId, timeSlot) {
    try {
        // Disable the clicked button and show loading state
        const button = event.target;
        button.disabled = true;
        button.textContent = 'Booking...';

        // Call the API
        const result = await apiBookAppointment(doctorId, timeSlot);

        // Show success message
        showSuccess(`Appointment booked successfully! Confirmation #: ${result.confirmationNumber}`);

        // Refresh the doctor list to update available slots
        handleSearch();
    } catch (error) {
        console.error('Booking error:', error);
        showError('Unable to book appointment. Please try again later.');
    } finally {
        // Reset button state if it exists
        if (button) {
            button.disabled = false;
            button.textContent = timeSlot;
        }
    }
}

// Display the search results
export function displayResults(doctors) {
    const resultsContainer = document.getElementById('results');
    
    // Clear loading state
    resultsContainer.innerHTML = '';

    if (!doctors || doctors.length === 0) {
        resultsContainer.innerHTML = '<div class="no-results">No doctors found matching your criteria</div>';
        return;
    }

    doctors.forEach(doctor => {
        const doctorCard = document.createElement('div');
        doctorCard.className = 'doctor-card';
        
        doctorCard.innerHTML = `
            <div class="doctor-image"></div>
            <div class="doctor-info">
                <div class="doctor-name">${doctor.name}</div>
                <div>${doctor.specialty}</div>
                <div>${doctor.education}</div>
                <div>${doctor.experience} of experience</div>
                <div class="time-slots" id="timeSlots-${doctor.id}">
                    ${renderTimeSlots(doctor)}
                </div>
            </div>
        `;

        resultsContainer.appendChild(doctorCard);
    });
}

// Helper function to render time slots
function renderTimeSlots(doctor) {
    if (!doctor.availableSlots || doctor.availableSlots.length === 0) {
        return '<div class="no-slots">No available appointments</div>';
    }

    return doctor.availableSlots
        .map(slot => `
            <button 
                class="time-slot" 
                onclick="handleBooking('${doctor.id}', '${slot}')"
                ${doctor.bookedSlots?.includes(slot) ? 'disabled' : ''}
            >
                ${slot}
            </button>
        `)
        .join('');
}

// UI Helper Functions
function showLoading() {
    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = '<div class="loading">Searching for doctors...</div>';
}

function showError(message) {
    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = `
        <div class="error-message">
            <strong>Error:</strong> ${message}
        </div>
    `;
}

function showSuccess(message) {
    // Create a success message element
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    
    // Add it to the page
    document.body.appendChild(successDiv);
    
    // Remove it after 3 seconds
    setTimeout(() => {
        successDiv.remove();
    }, 3000);
}

// Add event listeners for form submission
document.addEventListener('DOMContentLoaded', () => {
    // Prevent form submission on enter key
    document.querySelectorAll('input').forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleSearch();
            }
        });
    });

    // Add input validation
    document.querySelectorAll('select, input').forEach(element => {
        element.addEventListener('change', () => {
            element.classList.remove('error');
            if (!element.value) {
                element.classList.add('error');
            }
        });
    });
});

// Export utility functions that might be needed by other modules
export const utils = {
    showError,
    showSuccess,
    showLoading
};
