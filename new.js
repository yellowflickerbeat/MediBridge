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
        endDate: document.getElementById('endDate').value,
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

// ... (keep all previous code up until fetchMedications function)

// Updated fetchMedications function with date-based filtering
function fetchMedicationsAndRecords() {
    const activeMedicationsList = document.getElementById('activeMedicationsList');
    const medicationHistoryList = document.getElementById('medicationHistoryList');
    
    activeMedicationsList.innerHTML = '';
    medicationHistoryList.innerHTML = '';

    // Fetch medications
    dashboard_db.child('medications').on('value', (medicationSnapshot) => {
        if (medicationSnapshot.exists()) {
            const medications = medicationSnapshot.val();
            const currentDate = new Date().toISOString().split('T')[0];
            
            Object.entries(medications).forEach(([key, medication]) => {
                const div = document.createElement('div');
                div.className = 'medication-card';
                div.setAttribute('data-medication-id', key);

                const isActive = medication.isActive && 
                               (!medication.endDate || medication.endDate >= currentDate);
                
                div.innerHTML = `
                    <h3>${medication.medicationName}</h3>
                    <p><strong>Dosage:</strong> ${medication.dosage}</p>
                    <p><strong>Frequency:</strong> ${medication.frequency}</p>
                    <p><strong>Start Date:</strong> ${formatDate(medication.startDate)}</p>
                    <p><strong>End Date:</strong> ${medication.endDate ? formatDate(medication.endDate) : 'Ongoing'}</p>
                    <p><strong>Reason:</strong> ${medication.reason || 'N/A'}</p>
                    <p><strong>Prescriber:</strong> ${medication.prescriber || 'N/A'}</p>
                    <div class="action-buttons">
                        <button onclick="editMedication('${key}')" class="edit-btn">Edit</button>
                        <button onclick="deleteMedication('${key}')" class="delete-btn">Delete</button>
                    </div>
                `;
                
                if (isActive) {
                    activeMedicationsList.appendChild(div.cloneNode(true));
                } else {
                    medicationHistoryList.appendChild(div.cloneNode(true));
                }
            });
        }
    });

    // Fetch medical records and add to the active medications list
    dashboard_db.child('medicalRecords').on('value', (recordSnapshot) => {
        if (recordSnapshot.exists()) {
            const records = recordSnapshot.val();
            
            Object.entries(records).forEach(([key, record]) => {
                const div = document.createElement('div');
                div.className = 'record-card';
                div.setAttribute('data-record-id', key);

                const recordDate = record.recordDate || 
                                 record.onsetDateTime || 
                                 record.performedDateTime || 
                                 record.effectiveDateTime;

                div.innerHTML = `
                    <h3>${record.recordType}</h3>
                    <p><strong>Description:</strong> ${record.recordDescription || record.code?.text || 'N/A'}</p>
                    <p><strong>Date:</strong> ${formatDate(recordDate)}</p>
                    ${record.documentName ? `<p><strong>Document:</strong> ${record.documentName}</p>` : ''}
                    <div class="action-buttons">
                        <button onclick="editRecord('${key}')" class="edit-btn">Edit</button>
                        <button onclick="deleteRecord('${key}')" class="delete-btn">Delete</button>
                    </div>
                `;
                
                activeMedicationsList.appendChild(div);
            });
        }
    });
}
document.addEventListener('DOMContentLoaded', function() {
    // Initialize form submissions
    const recordForm = document.getElementById('recordForm');
    const medicationForm = document.getElementById('medicationForm');
    
    if (recordForm) {
        recordForm.addEventListener('submit', handleRecordSubmit);
    }
    
    if (medicationForm) {
        medicationForm.addEventListener('submit', handleMedicationSubmit);
    }
    
    // Fetch medications and records
    fetchMedicationsAndRecords();
    
    // Handle isActive checkbox changes
    const isActiveCheckbox = document.getElementById('isActive');
    const endDateInput = document.getElementById('endDate');
    if (isActiveCheckbox && endDateInput) {
        isActiveCheckbox.addEventListener('change', function() {
            endDateInput.disabled = this.checked;
            if (this.checked) {
                endDateInput.value = '';
            }
        });
        endDateInput.disabled = isActiveCheckbox.checked;
    }
});


// Add helper function to format dates
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Update fetchMedicalRecords function to show records in chronological order

// Add these utility functions
function resetForm(formId) {
    const form = document.getElementById(formId);
    if (form) {
        form.reset();
        // Reset file input if it exists
        const fileInput = form.querySelector('input[type="file"]');
        if (fileInput) {
            fileInput.value = '';
        }
        // Reset any disabled fields
        const endDateInput = document.getElementById('endDate');
        if (endDateInput) {
            endDateInput.disabled = document.getElementById('isActive')?.checked ?? false;
        }
    }
}

// Add edit record functionality


// Add this to your DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', function() {
    // Initialize form submissions
    const recordForm = document.getElementById('recordForm');
    const medicationForm = document.getElementById('medicationForm');
    
    if (recordForm) {
        recordForm.addEventListener('submit', handleRecordSubmit);
    }
    
    if (medicationForm) {
        medicationForm.addEventListener('submit', handleMedicationSubmit);
    }
    
    // Add automatic end date disabling when isActive is checked
    const isActiveCheckbox = document.getElementById('isActive');
    const endDateInput = document.getElementById('endDate');
    
    if (isActiveCheckbox && endDateInput) {
        isActiveCheckbox.addEventListener('change', function() {
            endDateInput.disabled = this.checked;
            if (this.checked) {
                endDateInput.value = '';
            }
        });
        
        // Initialize the end date input state
        endDateInput.disabled = isActiveCheckbox.checked;
    }
});

// Add this to your existing DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', function() {
    // ... (existing event listeners)

    // Add automatic end date disabling when isActive is checked
    const isActiveCheckbox = document.getElementById('isActive');
    const endDateInput = document.getElementById('endDate');
    
    isActiveCheckbox.addEventListener('change', function() {
        endDateInput.disabled = this.checked;
        if (this.checked) {
            endDateInput.value = '';
        }
    });

    // Initialize the end date input state
    endDateInput.disabled = isActiveCheckbox.checked;
});