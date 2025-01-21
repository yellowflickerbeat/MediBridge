const FHIR_SERVER_URL = 'http://hapi.fhir.org/baseR4';

const specialtySelect = document.getElementById('specialty');
const doctorSelect = document.getElementById('doctor');
const dateInput = document.getElementById('date');
const timeSlotsContainer = document.getElementById('timeSlots');
const scheduleButton = document.getElementById('scheduleButton');
let selectedTimeSlot = null;

// Set the minimum date to today
dateInput.min = new Date().toISOString().split('T')[0];

// Fetch doctors from the FHIR server
async function fetchDoctors() {
    try {
        const response = await fetch(FHIR_SERVER_URL + '/Practitioner?_count=10'); // Limit to 50 practitioners for testing
        const data = await response.json();

        if (!data.entry) {
            throw new Error('No doctors found');
        }

        const doctors = data.entry.map(entry => {
            const resource = entry.resource;
            const name = resource.name && resource.name[0] 
                ? (resource.name[0].given ? resource.name[0].given.join(' ') : '') + ' ' + (resource.name[0].family || '')
                : 'Unknown Name';
            return {
                id: resource.id,
                name: name.trim() || 'Unknown Name',
                specialty: resource.qualification?.[0]?.code?.text || 'General Practice',
            };
        });

        setupSpecialties(doctors);
    } catch (error) {
        alert('Failed to load doctors');
        console.error('Error:', error);
    }
}


// Populate specialties dropdown
function setupSpecialties(doctors) {
    const specialties = [...new Set(doctors.map(d => d.specialty))];

    specialtySelect.innerHTML =
        '<option value="">Select a specialty...</option>' +
        specialties
            .map(
                s =>
                    '<option value="' +
                    s +
                    '">' +
                    s +
                    '</option>'
            )
            .join('');

    specialtySelect.onchange = () => {
        const specialty = specialtySelect.value;
        const filteredDoctors = doctors.filter(d => d.specialty === specialty);

        doctorSelect.innerHTML =
            '<option value="">Select a doctor...</option>' +
            filteredDoctors
                .map(
                    d =>
                        '<option value="' +
                        d.id +
                        '">' +
                        d.name +
                        '</option>'
                )
                .join('');
    };
}

// Generate time slots for the selected date
dateInput.onchange = () => {
    const slots = [];
    for (let h = 9; h < 17; h++) {
        slots.push(h + ':00');
        slots.push(h + ':30');
    }
    timeSlotsContainer.innerHTML = slots
        .map(
            time =>
                '<div class="time-slot" onclick="selectTime(this)" data-time="' +
                time +
                '">' +
                time +
                '</div>'
        )
        .join('');
};

// Handle time slot selection
function selectTime(element) {
    document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
    element.classList.add('selected');
    selectedTimeSlot = element.dataset.time;
}

// Schedule appointment
scheduleButton.onclick = async () => {
    if (!validateForm()) return;

    try {
        const appointment = {
            resourceType: 'Appointment',
            status: 'proposed',
            start: dateInput.value + 'T' + selectedTimeSlot + ':00',
            end: dateInput.value + 'T' + selectedTimeSlot + ':30', // 30 minutes slot
            participant: [
                {
                    actor: {
                        reference: 'Practitioner/' + doctorSelect.value,
                    },
                    status: 'accepted',
                },
            ],
        };

        const response = await fetch(FHIR_SERVER_URL + '/Appointment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/fhir+json',
                'Accept': 'application/fhir+json',
            },
            body: JSON.stringify(appointment),
        });

        if (response.ok) {
            alert('Appointment scheduled successfully!');
            resetForm();
        } else {
            throw new Error('Failed to schedule appointment');
        }
    } catch (error) {
        alert('Failed to schedule appointment');
        console.error('Error:', error);
    }
};

// Validate form input
function validateForm() {
    if (!specialtySelect.value) {
        alert('Please select a specialty');
        return false;
    }
    if (!doctorSelect.value) {
        alert('Please select a doctor');
        return false;
    }
    if (!dateInput.value) {
        alert('Please select a date');
        return false;
    }
    if (!selectedTimeSlot) {
        alert('Please select a time slot');
        return false;
    }
    return true;
}

// Reset form after scheduling
function resetForm() {
    specialtySelect.value = '';
    doctorSelect.value = '';
    dateInput.value = '';
    selectedTimeSlot = null;
    timeSlotsContainer.innerHTML = '';
}

// Fetch doctors on page load
fetchDoctors();
