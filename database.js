// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyC_K8OpaHkoSzha3pLI03Tu6sZ190p_z2o",
    authDomain: "medibridge-loginpage.firebaseapp.com",
    databaseURL: "https://medibridge-loginpage-default-rtdb.firebaseio.com",
    projectId: "medibridge-loginpage",
    storageBucket: "medibridge-loginpage.appspot.com",
    messagingSenderId: "840197772490",
    appId: "1:840197772490:web:67b15f41d1dcddff6ad033",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const dashboard_db = firebase.database().ref('Medibridge');

// Global Variables
let currentEditId = null;

// Handle Medical Record Form Submission
async function handleRecordSubmit(event) {
    event.preventDefault();
    
    const formData = {
        recordType: document.getElementById('recordType').value,
        recordDate: document.getElementById('recordDate').value,
        recordDescription: document.getElementById('recordDescription').value,
        timestamp: Date.now(),
        resourceType: document.getElementById('recordType').value,
        status: 'active',
        code: {
            text: document.getElementById('recordDescription').value
        }
    };

    const documentFile = document.getElementById('documentFile').files[0];
    if (documentFile) {
        try {
            // Here you would implement your document upload logic
            // For now, just store the filename
            formData.documentName = documentFile.name;
        } catch (error) {
            alert('Error uploading document');
            return;
        }
    }

    // Add date field based on resource type
    if (formData.recordType === 'Condition') {
        formData.onsetDateTime = formData.recordDate;
    } else if (formData.recordType === 'Procedure') {
        formData.performedDateTime = formData.recordDate;
    } else {
        formData.effectiveDateTime = formData.recordDate;
    }

    try {
        let recordRef;
        if (currentEditId) {
            recordRef = dashboard_db.child('medicalRecords').child(currentEditId);
            await recordRef.update(formData);
            alert('Record updated successfully');
        } else {
            recordRef = dashboard_db.child('medicalRecords').push();
            await recordRef.set(formData);
            alert('Record added successfully');
        }
        
        resetForm('recordForm');
        currentEditId = null;
    } catch (error) {
        console.error('Error saving record:', error);
        alert('Error saving medical record');
    }
}

// Handle Medication Form Submission
async function handleMedicationSubmit(event) {
    event.preventDefault();
    
    const formData = {
        medicationName: document.getElementById('medicationName').value,
        dosage: document.getElementById('dosage').value,
        frequency: document.getElementById('frequency').value,
        startDate: document.getElementById('startDate').value,
        endDate: document.getElementById('endDate').value || null,
        isActive: document.getElementById('isActive').checked,
        reason: document.getElementById('reason').value,
        prescriber: document.getElementById('prescriber').value,
        timestamp: Date.now()
    };

    try {
        const newMedicationRef = dashboard_db.child('medications').push();
        await newMedicationRef.set(formData);
        alert('Medication saved successfully!');
        resetForm('medicationForm');
    } catch (error) {
        console.error('Error saving medication:', error);
        alert('Error saving medication. Please try again.');
    }
}

// Fetch and Display Medical Records
function fetchMedicalRecords() {
    const recordsList = document.getElementById('recordsList');
    recordsList.innerHTML = '';
    
    dashboard_db.child('medicalRecords').on('value', (snapshot) => {
        if (snapshot.exists()) {
            const records = snapshot.val();
            Object.entries(records).forEach(([key, record]) => {
                const div = document.createElement('div');
                div.className = 'record-item';
                div.setAttribute('data-record-id', key);
                
                const recordDate = record.onsetDateTime || 
                                 record.performedDateTime || 
                                 record.effectiveDateTime || 
                                 record.recordDate;

                div.innerHTML = `
                    <div class="record-header">
                        <span class="record-title">${record.recordType}</span>
                        <span class="record-date">${recordDate}</span>
                    </div>
                    <div class="record-content">
                        ${record.recordDescription}
                        ${record.documentName ? `<p><strong>Attached Document:</strong> ${record.documentName}</p>` : ''}
                    </div>
                    <div class="record-footer">
                        <div class="action-buttons">
                            <button onclick="editRecord('${key}')" class="edit-btn">Edit</button>
                            <button onclick="deleteRecord('${key}')" class="delete-btn">Delete</button>
                        </div>
                    </div>
                `;
                recordsList.appendChild(div);
            });
        } else {
            recordsList.innerHTML = '<p>No medical records found.</p>';
        }
    });
}

// Fetch and Display Medications
function fetchMedications() {
    const activeMedicationsList = document.getElementById('activeMedicationsList');
    const medicationHistoryList = document.getElementById('medicationHistoryList');
    
    activeMedicationsList.innerHTML = '';
    medicationHistoryList.innerHTML = '';
    
    dashboard_db.child('medications').on('value', (snapshot) => {
        if (snapshot.exists()) {
            const medications = snapshot.val();
            Object.entries(medications).forEach(([key, medication]) => {
                const div = document.createElement('div');
                div.className = 'medication-card';
                div.setAttribute('data-medication-id', key);
                
                div.innerHTML = `
                    <h3>${medication.medicationName}</h3>
                    <p><strong>Dosage:</strong> ${medication.dosage}</p>
                    <p><strong>Frequency:</strong> ${medication.frequency}</p>
                    <p><strong>Start Date:</strong> ${medication.startDate}</p>
                    <p><strong>End Date:</strong> ${medication.endDate || 'Ongoing'}</p>
                    <p><strong>Reason:</strong> ${medication.reason || 'N/A'}</p>
                    <p><strong>Prescriber:</strong> ${medication.prescriber || 'N/A'}</p>
                    <div class="action-buttons">
                        <button onclick="editMedication('${key}')" class="edit-btn">Edit</button>
                        <button onclick="deleteMedication('${key}')" class="delete-btn">Delete</button>
                    </div>
                `;
                
                if (medication.isActive) {
                    activeMedicationsList.appendChild(div);
                } else {
                    medicationHistoryList.appendChild(div);
                }
            });
        } else {
            activeMedicationsList.innerHTML = '<p>No active medications found.</p>';
            medicationHistoryList.innerHTML = '<p>No medication history found.</p>';
        }
    });
}

// Utility Functions
function resetForm(formId) {
    document.getElementById(formId).reset();
    if (formId === 'recordForm') {
        document.getElementById('documentPreview').innerHTML = '';
    }
    currentEditId = null;
}

function editRecord(recordId) {
    currentEditId = recordId;
    const record = dashboard_db.child('medicalRecords').child(recordId).once('value')
        .then((snapshot) => {
            const data = snapshot.val();
            document.getElementById('recordType').value = data.recordType;
            document.getElementById('recordDate').value = data.recordDate;
            document.getElementById('recordDescription').value = data.recordDescription;
            document.getElementById('submitBtn').textContent = 'Update Record';
        });
}

function deleteRecord(recordId) {
    if (confirm('Are you sure you want to delete this record?')) {
        dashboard_db.child('medicalRecords').child(recordId).remove()
            .then(() => alert('Record deleted successfully'))
            .catch((error) => alert('Error deleting record'));
    }
}

function editMedication(medicationId) {
    dashboard_db.child('medications').child(medicationId).once('value')
        .then((snapshot) => {
            const data = snapshot.val();
            document.getElementById('medicationName').value = data.medicationName;
            document.getElementById('dosage').value = data.dosage;
            document.getElementById('frequency').value = data.frequency;
            document.getElementById('startDate').value = data.startDate;
            document.getElementById('endDate').value = data.endDate || '';
            document.getElementById('isActive').checked = data.isActive;
            document.getElementById('reason').value = data.reason || '';
            document.getElementById('prescriber').value = data.prescriber || '';
            document.getElementById('medicationSubmitBtn').textContent = 'Update Medication';
        });
}

function deleteMedication(medicationId) {
    if (confirm('Are you sure you want to delete this medication?')) {
        dashboard_db.child('medications').child(medicationId).remove()
            .then(() => alert('Medication deleted successfully'))
            .catch((error) => alert('Error deleting medication'));
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Form submission listeners
    document.getElementById('recordForm').addEventListener('submit', handleRecordSubmit);
    document.getElementById('medicationForm').addEventListener('submit', handleMedicationSubmit);
    
    // Document file handling
    document.getElementById('documentFile').addEventListener('change', (event) => {
        const file = event.target.files[0];
        const preview = document.getElementById('documentPreview');
        preview.innerHTML = '';

        if (file) {
            if (file.type.startsWith('image/')) {
                const img = document.createElement('img');
                img.className = 'document-preview';
                img.src = URL.createObjectURL(file);
                preview.appendChild(img);
            } else {
                preview.innerHTML = `<p>Selected file: ${file.name}</p>`;
            }
        }
    });

    // Active checkbox handler
    document.getElementById('isActive').addEventListener('change', function(e) {
        const endDateField = document.getElementById('endDate');
        endDateField.disabled = e.target.checked;
        if (e.target.checked) {
            endDateField.value = '';
        }
    });

    // Initialize data
    fetchMedicalRecords();
    fetchMedications();
    initializeRealTimeListeners();
});

// Initialize real-time listeners
function initializeRealTimeListeners() {
    ['medicalRecords', 'medications'].forEach(node => {
        ['child_added', 'child_changed', 'child_removed'].forEach(event => {
            dashboard_db.child(node).on(event, () => {
                if (node === 'medicalRecords') fetchMedicalRecords();
                else fetchMedications();
            });
        });
    });
}