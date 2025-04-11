// Track current proximity location and shape counter
let currentProximityLocation = null;
let shapeCounter = 0;

// Initialize the application
function init() {
    setupTabs();
    setupGeolocation();
    setupTapEvents();
    renderClueItems();
    setupTouchFeedback();
}

// Set up tab functionality
function setupTabs() {
    const leftTabButton = document.getElementById('left-tab-button');
    const rightTabButton = document.getElementById('right-tab-button');
    const leftTab = document.getElementById('left-tab');
    const rightTab = document.getElementById('right-tab');
    const closeButtons = document.querySelectorAll('.close-tab');
    
    leftTabButton.addEventListener('click', () => toggleTab(leftTab, rightTab));
    rightTabButton.addEventListener('click', () => toggleTab(rightTab, leftTab));
    
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            this.closest('.tab').classList.remove('open');
        });
    });
}

function toggleTab(openTab, closeTab) {
    closeTab.classList.remove('open');
    openTab.classList.toggle('open');
}

// Render clue items in the left tab
function renderClueItems() {
    const leftTab = document.getElementById('left-tab');
    
    LOCATIONS.forEach(location => {
        const clueItem = document.createElement('div');
        clueItem.className = 'clue-item';
        clueItem.dataset.locationId = location.id;
        
        clueItem.innerHTML = `
            <div class="clue-header">
                <div class="status-indicator"></div>
                <span style="flex-grow: 1">${location.name}</span>
                <span class="expand-icon">+</span>
            </div>
            <div class="clue-content">
                <ul>
                    ${location.clues.map(clue => `<li>${clue}</li>`).join('')}
                </ul>
            </div>
        `;
        
        leftTab.appendChild(clueItem);
    });
    
    // Set up collapsible functionality
    document.querySelectorAll('.clue-header').forEach(header => {
        header.addEventListener('click', function() {
            const item = this.parentElement;
            item.classList.toggle('expanded');
            const icon = this.querySelector('.expand-icon');
            icon.textContent = item.classList.contains('expanded') ? '-' : '+';
        });
    });
}

// Set up geolocation
function setupGeolocation() {
    const locationStatus = document.getElementById('location-status');
    
    if (!navigator.geolocation) {
        showLocationError("Geolocation not supported by your browser");
        return;
    }
    
    locationStatus.style.display = 'block';
    
    const options = {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 15000 // Increased timeout to 15 seconds
    };
    
    navigator.geolocation.watchPosition(
        handlePositionSuccess,
        handlePositionError,
        options
    );
}

function handlePositionSuccess(position) {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    const accuracy = position.coords.accuracy;
    
    updateLocationStatus(lat, lng, accuracy);
    checkProximity(lat, lng);
}

function handlePositionError(error) {
    let message = "Error getting location: ";
    switch(error.code) {
        case error.PERMISSION_DENIED:
            message += "User denied the request for geolocation.";
            break;
        case error.POSITION_UNAVAILABLE:
            message += "Location information is unavailable.";
            break;
        case error.TIMEOUT:
            message += "The request to get location timed out.";
            break;
        case error.UNKNOWN_ERROR:
            message += "An unknown error occurred.";
            break;
    }
    showLocationError(message);
}

function updateLocationStatus(lat, lng, accuracy) {
    const locationStatus = document.getElementById('location-status');
    locationStatus.textContent = `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)} | Accuracy: ${Math.round(accuracy)}m`;
    locationStatus.style.display = 'block';
}

function showLocationError(message) {
    const locationStatus = document.getElementById('location-status');
    locationStatus.textContent = message;
    locationStatus.style.display = 'block';
}

// Check proximity to locations
function checkProximity(lat, lng) {
    let closestDistance = Infinity;
    let closestLocation = null;
    
    LOCATIONS.forEach(location => {
        const distance = getDistance(lat, lng, location.lat, location.lng);
        const wasInProximity = location.inProximity;
        location.inProximity = distance <= location.radius * 1.5;
        
        if (location.inProximity && distance < closestDistance) {
            closestDistance = distance;
            closestLocation = location;
        }
        
        if (distance <= location.radius && !location.completed) {
            location.completed = true;
            markClueCompleted(location.id);
        }
        
        if (location.inProximity && !wasInProximity && !location.completed) {
            showProximityAlert(location.name);
        }
    });
    
    updateProximityUI(closestLocation, closestDistance);
}

function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
}

function updateProximityUI(closestLocation, closestDistance) {
    currentProximityLocation = closestLocation;
    const proximityIndicator = document.getElementById('proximity-indicator');
    const tapInstruction = document.getElementById('tap-instruction');
    
    if (closestLocation && !closestLocation.completed) {
        proximityIndicator.textContent = `Near ${closestLocation.name} (${Math.round(closestDistance)}m away)`;
        proximityIndicator.style.display = 'block';
        tapInstruction.style.display = 'block';
    } else {
        proximityIndicator.style.display = 'none';
        tapInstruction.style.display = 'none';
    }
}

function showProximityAlert(locationName) {
    const proximityIndicator = document.getElementById('proximity-indicator');
    proximityIndicator.textContent = `Approaching ${locationName}!`;
    proximityIndicator.style.display = 'block';
    setTimeout(() => proximityIndicator.style.display = 'none', 3000);
}

function markClueCompleted(clueIndex) {
    const indicator = document.querySelector(`.clue-item[data-location-id="${clueIndex}"] .status-indicator`);
    if (indicator) {
        indicator.classList.add('completed');
        showLocationStatusMessage(`Visited ${LOCATIONS[clueIndex].name}!`);
    }
}

function showLocationStatusMessage(message) {
    const locationStatus = document.getElementById('location-status');
    locationStatus.textContent = message;
    locationStatus.style.display = 'block';
    setTimeout(() => locationStatus.style.display = 'none', 3000);
}

// Set up tap to add shapes
function setupTapEvents() {
    document.addEventListener('click', () => {
        if (currentProximityLocation) {
            addLocationShape();
        }
    });
}

function addLocationShape() {
    const location = currentProximityLocation;
    shapeCounter++;
    
    const shapesContainer = document.getElementById('dynamic-shapes');
    const shape = document.createElement('a-entity');
    shape.setAttribute('id', `shape-${location.id}-${shapeCounter}`);
    
    // Random position offset
    const xOffset = (Math.random() * 0.5) - 0.25;
    const zOffset = (Math.random() * 0.5) - 0.25;
    const position = `${xOffset} ${parseFloat(location.position.split(' ')[1])} ${zOffset}`;
    
    shape.innerHTML = `
        <a-${location.shape} 
            position="${position}"
            material="color: ${location.color}"
            scale="${location.scale}">
        </a-${location.shape}>
        <a-text 
            value="${location.name}"
            position="0 ${parseFloat(location.position.split(' ')[1]) + 0.5} 0"
            align="center"
            color="#FFFFFF"
            scale="0.5 0.5 0.5">
        </a-text>
    `;
    
    shapesContainer.appendChild(shape);
    showLocationStatusMessage(`Added ${location.name} shape!`);
}

// Set up touch feedback for buttons
function setupTouchFeedback() {
    document.querySelectorAll('.tab-button, .clue-header').forEach(button => {
        button.addEventListener('touchstart', () => button.style.transform = 'scale(0.95)');
        button.addEventListener('touchend', () => button.style.transform = '');
    });
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);