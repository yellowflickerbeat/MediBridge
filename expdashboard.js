// Function to display saved records
function displaySavedRecords() {
    // Assuming you're storing records in localStorage
    const records = JSON.parse(localStorage.getItem('medicalRecords')) || [];
    
    // Get the container where records will be displayed
    const historyContainer = document.getElementById('medicalHistory');
    
    // Clear existing content
    historyContainer.innerHTML = '';
    
    // Create a table to display records
    const table = document.createElement('table');
    table.innerHTML = `
        <thead>
            <tr>
                <th>Type</th>
                <th>Date</th>
                <th>Description</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody id="recordsBody">
        </tbody>
    `;
    
    historyContainer.appendChild(table);
    
    const recordsBody = document.getElementById('recordsBody');
    
    // Populate table with records
    records.forEach((record, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${record.type}</td>
            <td>${record.date}</td>
            <td>${record.description}</td>
            <td>
                <button onclick="editRecord(${index})">Edit</button>
                <button onclick="deleteRecord(${index})">Delete</button>
            </td>
        `;
        recordsBody.appendChild(row);
    });
}

// Function to save a new record
function saveRecord(event) {
    event.preventDefault();
    
    const record = {
        type: document.getElementById('recordType').value,
        date: document.getElementById('recordDate').value,
        description: document.getElementById('recordDescription').value
    };
    
    let records = JSON.parse(localStorage.getItem('medicalRecords')) || [];
    records.push(record);
    localStorage.setItem('medicalRecords', JSON.stringify(records));
    
    displaySavedRecords();
    resetForm('recordForm');
}

// Function to edit a record
function editRecord(index) {
    const records = JSON.parse(localStorage.getItem('medicalRecords')) || [];
    const record = records[index];
    
    document.getElementById('recordType').value = record.type;
    document.getElementById('recordDate').value = record.date;
    document.getElementById('recordDescription').value = record.description;
    document.getElementById('recordId').value = index;
    
    document.getElementById('submitBtn').textContent = 'Update Record';
}

// Function to delete a record
function deleteRecord(index) {
    let records = JSON.parse(localStorage.getItem('medicalRecords')) || [];
    records.splice(index, 1);
    localStorage.setItem('medicalRecords', JSON.stringify(records));
    
    displaySavedRecords();
}

// Function to reset the form
function resetForm(formId) {
    document.getElementById(formId).reset();
    document.getElementById('recordId').value = '';
    document.getElementById('submitBtn').textContent = 'Save Record';
}

// Event listener for form submission
document.getElementById('recordForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const recordId = document.getElementById('recordId').value;
    
    if (recordId === '') {
        saveRecord(event);
    } else {
        updateRecord(event, parseInt(recordId));
    }
});

// Function to update an existing record
function updateRecord(event, index) {
    event.preventDefault();
    
    let records = JSON.parse(localStorage.getItem('medicalRecords')) || [];
    
    records[index] = {
        type: document.getElementById('recordType').value,
        date: document.getElementById('recordDate').value,
        description: document.getElementById('recordDescription').value
    };
    
    localStorage.setItem('medicalRecords', JSON.stringify(records));
    
    displaySavedRecords();
    resetForm('recordForm');
}

// Call displaySavedRecords when the page loads
document.addEventListener('DOMContentLoaded', displaySavedRecords);
