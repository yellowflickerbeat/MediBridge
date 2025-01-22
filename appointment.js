// Constants
const FHIR_SERVER_URL = 'https://your-fhir-server.com/baseR4';

// Fetch doctors and their available slots
async function fetchDoctors() {
    try {
        const response = await fetch(`${FHIR_SERVER_URL}/Practitioner?_include=Practitioner:schedule`);
        const data = await response.json();
        
        if (!data.entry) throw new Error('No doctors found');
        
        const doctors = data.entry.map(entry => {
            const resource = entry.resource;
            return {
                id: resource.id,
                name: formatPractitionerName(resource),
                specialty: getPractitionerSpecialty(resource),
                availableSlots: getAvailableSlots(resource)
            };
        });
        
        return doctors;
    } catch (error) {
        console.error('Error fetching doctors:', error);
        throw error;
    }
}

// Helper functions
function formatPractitionerName(resource) {
    if (!resource.name?.[0]) return 'Unknown Name';
    
    const name = resource.name[0];
    const given = name.given?.join(' ') || '';
    const family = name.family || '';
    return `${given} ${family}`.trim() || 'Unknown Name';
}

function getPractitionerSpecialty(resource) {
    return resource.qualification?.[0]?.code?.text || 'General Practice';
}

function getAvailableSlots(resource) {
    const schedule = resource.schedule?.[0];
    if (!schedule) return [];
    
    return schedule.planningHorizon?.map(slot => ({
        start: new Date(slot.start),
        end: new Date(slot.end),
        status: slot.status
    })) || [];
}

// Book appointment
async function bookAppointment(doctorId, patientId, slot) {
    const appointment = {
        resourceType: "Appointment",
        status: "booked",
        participant: [
            {
                actor: {
                    reference: `Practitioner/${doctorId}`
                },
                status: "accepted"
            },
            {
                actor: {
                    reference: `Patient/${patientId}`
                },
                status: "accepted"
            }
        ],
        start: slot.start,
        end: slot.end
    };

    try {
        const response = await fetch(`${FHIR_SERVER_URL}/Appointment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/fhir+json'
            },
            body: JSON.stringify(appointment)
        });

        if (!response.ok) throw new Error('Failed to book appointment');
        return await response.json();
    } catch (error) {
        console.error('Error booking appointment:', error);
        throw error;
    }
}

// UI Setup
function setupUI() {
    const specialtySelect = document.getElementById('specialty-select');
    const doctorSelect = document.getElementById('doctor-select');
    const timeSlotSelect = document.getElementById('timeslot-select');
    
    fetchDoctors().then(doctors => {
        // Populate specialties
        const specialties = [...new Set(doctors.map(d => d.specialty))];
        specialties.forEach(specialty => {
            const option = document.createElement('option');
            option.value = specialty;
            option.textContent = specialty;
            specialtySelect.appendChild(option);
        });

        // Handle specialty selection
        specialtySelect.addEventListener('change', (e) => {
            const selectedDoctors = doctors.filter(d => d.specialty === e.target.value);
            updateDoctorSelect(selectedDoctors);
        });

        // Handle doctor selection
        doctorSelect.addEventListener('change', (e) => {
            const selectedDoctor = doctors.find(d => d.id === e.target.value);
            updateTimeSlots(selectedDoctor.availableSlots);
        });
    });
}

function updateDoctorSelect(doctors) {
    const doctorSelect = document.getElementById('doctor-select');
    doctorSelect.innerHTML = '<option value="">Select a doctor</option>';
    
    doctors.forEach(doctor => {
        const option = document.createElement('option');
        option.value = doctor.id;
        option.textContent = doctor.name;
        doctorSelect.appendChild(option);
    });
}

function updateTimeSlots(slots) {
    const timeSlotSelect = document.getElementById('timeslot-select');
    timeSlotSelect.innerHTML = '<option value="">Select a time slot</option>';
    
    slots.forEach(slot => {
        if (slot.status === 'free') {
            const option = document.createElement('option');
            option.value = JSON.stringify(slot);
            option.textContent = formatDateTime(slot.start);
            timeSlotSelect.appendChild(option);
        }
    });
}

function formatDateTime(date) {
    return new Date(date).toLocaleString();
}

// Initialize the application
document.addEventListener('DOMContentLoaded', setupUI);