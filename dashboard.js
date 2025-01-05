// FHIR API configuration
const FHIR_SERVER = 'https://your-fhir-server.com/fhir';
const PATIENT_ID = 'example-patient-id';

// Initialize axios with base configuration
const api = axios.create({
    baseURL: FHIR_SERVER,
    headers: {
        'Content-Type': 'application/fhir+json',
        // Add your authentication headers here if required
        // 'Authorization': 'Bearer your-token'
    }
});

let currentEditId = null;

// Utility Functions
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString();
}

function getLastUpdated(resource) {
    return resource.meta?.lastUpdated ? 
        `Last updated: ${new Date(resource.meta.lastUpdated).toLocaleString()}` : '';
}

// Patient Information
async function fetchPatientInfo() {
    try {
        const response = await api.get(`/Patient/${PATIENT_ID}`);
        const patient = response.data;
        displayPatientInfo(patient);
    } catch (error) {
        console.error('Error fetching patient info:', error);
        alert('Error loading patient information');
    }
}

function displayPatientInfo(patient) {
    const patientInfo = document.getElementById('patientInfo');
    patientInfo.innerHTML = `
        <p><strong>Name:</strong> ${patient.name?.[0]?.given?.join(' ')} ${patient.name?.[0]?.family}</p>
        <p><strong>Birth Date:</strong> ${patient.birthDate}</p>
        <p><strong>Gender:</strong> ${patient.gender}</p>
    `;
}

// Document Management
async function uploadDocument(file) {
    try {
        const reader = new FileReader();
        return new Promise((resolve, reject) => {
            reader.onload = async (e) => {
                const base64Data = e.target.result.split(',')[1];
                const documentReference = {
                    resourceType: 'DocumentReference',
                    status: 'current',
                    subject: {
                        reference: `Patient/${PATIENT_ID}`
                    },
                    content: [{
                        attachment: {
                            contentType: file.type,
                            data: base64Data,
                            title: file.name
                        }
                    }]
                };

                try {
                    const response = await api.post('/DocumentReference', documentReference);
                    resolve(response.data.id);
                } catch (error) {
                    reject(error);
                }
            };
            reader.readAsDataURL(file);
        });
    } catch (error) {
        console.error('Error uploading document:', error);
        throw error;
    }
}

// Medical Records Management
async function fetchMedicalRecords() {
    try {
        const types = ['Condition', 'Observation', 'Procedure'];
        const records = [];

        for (const type of types) {
            const response = await api.get(`/${type}?patient=${PATIENT_ID}`);
            records.push(...response.data.entry || []);
        }

        displayMedicalRecords(records);
    } catch (error) {
        console.error('Error fetching medical records:', error);
        alert('Error loading medical records');
    }
}

function displayMedicalRecords(records) {
    const recordsList = document.getElementById('recordsList');
    recordsList.innerHTML = '';

    records.forEach(record => {
        const resource = record.resource;
        const div = document.createElement('div');
        div.className = 'record-item';
        
        const documentRef = resource.supportingInfo?.[0]?.reference;
        const documentDisplay = documentRef ? 
            `<p><strong>Attached Document:</strong> ${documentRef}</p>` : '';

        div.innerHTML = `
            <div class="record-header">
                <span class="record-title">${resource.resourceType}</span>
                <span class="record-date">
                    ${formatDate(resource.onset?.dateTime || 
                               resource.performedDateTime || 
                               resource.effectiveDateTime)}
                </span>
            </div>
            <div class="record-content">
                ${resource.code?.text || resource.description || ''}
                ${documentDisplay}
            </div>
            <div class="record-footer">
                <div class="last-updated">${getLastUpdated(resource)}</div>
                <div class="action-buttons">
                    <button onclick="editRecord('${resource.id}', '${resource.resourceType}')" class="edit-btn">Edit</button>
                    <button onclick="deleteRecord('${resource.id}', '${resource.resourceType}')" class="delete-btn">Delete</button>
                </div>
            </div>
        `;
        recordsList.appendChild(div);
    });
}

// Medication Management
async function fetchMedications() {
    try {
        const response = await api.get(`/MedicationStatement?patient=${PATIENT_ID}`);
        const medications = response.data.entry || [];
        
        // Separate active and inactive medications
        const active = medications.filter(med => med.resource.status === 'active');
        const inactive = medications.filter(med => med.resource.status !== 'active');
        
        displayMedications(active, 'activeMedicationsList');
        displayMedications(inactive, 'medicationHistoryList');
    } catch (error) {
        console.error('Error fetching medications:', error);
        alert('Error loading medications');
    }
}

function displayMedications(medications, elementId) {
    const container = document.getElementById(elementId);
    container.innerHTML = '';

    medications.forEach(med => {
        const resource = med.resource;
        const div = document.createElement('div');
        div.className = 'record-item';

        const status = resource.status === 'active' ? 
            '<span class="status-active">Active</span>' : 
            '<span class="status-inactive">Inactive</span>';

        div.innerHTML = `
            <div class="record-header">
                <span class="record-title">${resource.medicationCodeableConcept?.text}</span>
                <span class="record-date">${status}</span>
            </div>
            <div class="record-content">
                <p><strong>Dosage:</strong> ${resource.dosage?.[0]?.text}</p>
                <p><strong>Start Date:</strong> ${formatDate(resource.effectivePeriod?.start)}</p>
                ${resource.effectivePeriod?.end ? 
                    `<p><strong>End Date:</strong> ${formatDate(resource.effectivePeriod.end)}</p>` : ''}
                ${resource.reasonCode?.[0]?.text ? 
                    `<p><strong>Reason:</strong> ${resource.reasonCode[0].text}</p>` : ''}
                ${resource.informationSource?.display ? 
                    `<p><strong>Prescriber:</strong> ${resource.informationSource.display}</p>` : ''}
            </div>
            