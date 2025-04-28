// Possible shapes for random generation
const SHAPES = ['box', 'sphere', 'cylinder', 'cone', 'torus', 'octahedron', 'tetrahedron', 'dodecahedron', 'icosahedron'];

// Track current proximity location
let currentProximityLocation = null;
let shapeCounter = 0;
let imageCounter = 0;
let currentLat = null;
let currentLng = null;

// Simple tab toggle functionality
function setupTabs() {
    const leftTabButton = document.getElementById('left-tab-button');
    const rightTabButton = document.getElementById('right-tab-button');
    const leftTab = document.getElementById('left-tab');
    const rightTab = document.getElementById('right-tab');
    const closeButtons = document.querySelectorAll('.close-tab');
    
    // Left tab button click handler
    leftTabButton.addEventListener('click', function() {
        rightTab.classList.remove('open');
        leftTab.classList.toggle('open');
    });
    
    // Right tab button click handler
    rightTabButton.addEventListener('click', function() {
        leftTab.classList.remove('open');
        rightTab.classList.toggle('open');
    });
    
    // Close button handlers
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            this.closest('.tab').classList.remove('open');
        });
    });
    
    // Collapsible clue functionality
    document.querySelectorAll('.clue-header').forEach(header => {
        header.addEventListener('click', function() {
            const item = this.parentElement;
            item.classList.toggle('expanded');
            const icon = this.querySelector('.expand-icon');
            icon.textContent = item.classList.contains('expanded') ? '-' : '+';
        });
    });
}

// Calculate distance between two coordinates in meters
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

// Check proximity to all locations
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
        
        if (distance <= location.radius) {
            if (!location.completed) {
                location.completed = true;
                markClueCompleted(location.id);
            }
        }
    });
    
    // Update current proximity location
    currentProximityLocation = closestLocation;
    
    const proximityIndicator = document.getElementById('proximity-indicator');
    const tapInstruction = document.getElementById('tap-instruction');
    
    if (closestLocation && !closestLocation.completed) {
        proximityIndicator.textContent = `Near ${closestLocation.name} (${Math.round(closestDistance)}m away)\nYour position: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        proximityIndicator.style.display = 'block';
        tapInstruction.style.display = 'block';
    } else {
        proximityIndicator.style.display = 'none';
        tapInstruction.style.display = 'none';
    }
}

// Show proximity alert
function showProximityAlert(locationName) {
    const proximityIndicator = document.getElementById('proximity-indicator');
    proximityIndicator.textContent = `Approaching ${locationName}!`;
    proximityIndicator.style.display = 'block';
    
    setTimeout(() => {
        proximityIndicator.style.display = 'none';
    }, 3000);
}

// Function to mark a clue as completed
function markClueCompleted(clueIndex) {
    const clues = document.querySelectorAll('.clue-item');
    if (clueIndex >= 0 && clueIndex < clues.length) {
        const indicator = clues[clueIndex].querySelector('.status-indicator');
        indicator.classList.add('completed');
        
        const locationStatus = document.getElementById('location-status');
        locationStatus.textContent = `Visited ${LOCATIONS[clueIndex].name}!`;
        locationStatus.style.display = 'block';
        setTimeout(() => {
            locationStatus.style.display = 'none';
        }, 3000);
    }
}

// Generate a random color in hex format
function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

// Generate random properties for a shape
function getRandomShapeProperties() {
    const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    const color = getRandomColor();
    const size = 0.2 + Math.random() * 0.6; // Random size between 0.2 and 0.8
    const scale = `${size} ${size} ${size}`;
    
    // Random position in front of camera (1-3 meters away)
    const distance = 1 + Math.random() * 2;
    const angle = Math.random() * Math.PI * 2; // Random angle around the camera
    const xOffset = Math.cos(angle) * 0.5; // Random x position within 0.5m radius
    const zOffset = Math.sin(angle) * 0.5; // Random z position within 0.5m radius
    
    return {
        shape: shape,
        color: color,
        scale: scale,
        position: `${xOffset} ${0.5} -${distance}`, // Position in front of camera
        rotation: `${Math.random() * 360} ${Math.random() * 360} ${Math.random() * 360}`
    };
}

function addRandomShape() {
    const shapesContainer = document.getElementById('dynamic-shapes');
    const props = getRandomShapeProperties();
    shapeCounter++;
    
    // Create a new shape entity
    const shape = document.createElement('a-entity');
    shape.setAttribute('id', `shape-${shapeCounter}`);
    shape.setAttribute('visible', 'true');
    
    // Create the shape with flat shading
    shape.innerHTML = `
        <a-${props.shape} 
            position="${props.position}"
            material="color: ${props.color}; shader: flat"
            scale="${props.scale}"
            rotation="${props.rotation}">
        </a-${props.shape}>
    `;
    
    shapesContainer.appendChild(shape);
    
    // Remove shape after 30 seconds to prevent clutter
    setTimeout(() => {
        if (shape.parentNode) {
            shape.parentNode.removeChild(shape);
        }
    }, 3000);
}

function addVotedSticker() {
    const imagesContainer = document.getElementById('dynamic-images');
    imageCounter++;
    
    // Create a new image entity
    const image = document.createElement('a-image');
    image.setAttribute('id', `image-${imageCounter}`);
    image.setAttribute('src', 'img/iVotedSticker.png');
    image.setAttribute('position', '0 0 -1'); // 1 meter in front of camera
    image.setAttribute('scale', '0.1 0.1 0.1'); // Scaled down to 10%
    image.setAttribute('material', 'shader: flat');
    image.setAttribute('look-at', '[camera]');
    
    // Add fade-out animation
    image.classList.add('fade-out');
    
    imagesContainer.appendChild(image);
    
    // Remove image after animation completes
    setTimeout(() => {
        if (image.parentNode) {
            image.parentNode.removeChild(image);
        }
    }, 5000);
}

// Setup tap event listener
function setupTapEvents() {
    document.addEventListener('click', function() {
        if (currentProximityLocation && currentProximityLocation.id === 0) {
            // Near Susan B. Anthony's grave - show sticker
            addVotedSticker();
        } else {
            // Not near a special location - show random shape
            addRandomShape();
        }
    });
}

function setupGeolocation() {
    const locationStatus = document.getElementById('location-status');
    
    if (!navigator.geolocation) {
        locationStatus.textContent = "Geolocation not supported";
        locationStatus.style.display = 'block';
        return;
    }
    
    locationStatus.style.display = 'block';
    locationStatus.textContent = "Acquiring precise location...";
    
    // First try with high accuracy
    const highAccuracyOptions = {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000
    };
    
    const fallbackOptions = {
        enableHighAccuracy: false,
        maximumAge: 30000,
        timeout: 15000
    };
    
    // Modify the handlePosition function in setupGeolocation():
    function handlePosition(position) {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracy = position.coords.accuracy;
        
        console.log(`Raw position: ${lat}, ${lng} (±${accuracy}m)`);
        
        // During testing, let's be more lenient with accuracy
        const MAX_TESTING_ACCURACY = 50; // meters - adjust as needed
        if (accuracy > MAX_TESTING_ACCURACY) {
            console.warn(`Low accuracy (${Math.round(accuracy)}m), but proceeding for testing`);
            // Continue anyway for testing purposes
        }
        
        currentLat = lat;
        currentLng = lng;
        
        locationStatus.textContent = `Lat: ${lat.toFixed(6)}\nLng: ${lng.toFixed(6)}\nAccuracy: ${Math.round(accuracy)}m`;
        locationStatus.style.display = 'block';
        
        checkProximity(lat, lng);
    }

    function showTemporaryCoordinates(lat, lng) {
        const tempDisplay = document.createElement('div');
        tempDisplay.style.position = 'fixed';
        tempDisplay.style.backgroundColor = 'rgba(0,0,0,0.7)';
        tempDisplay.style.color = 'white';
        tempDisplay.style.padding = '10px';
        tempDisplay.style.borderRadius = '5px';
        tempDisplay.style.zIndex = '1000';
        
        // Random position on screen
        const x = Math.random() * (window.innerWidth - 200) + 50;
        const y = Math.random() * (window.innerHeight - 100) + 50;
        tempDisplay.style.left = `${x}px`;
        tempDisplay.style.top = `${y}px`;
        
        tempDisplay.textContent = `Lat: ${lat.toFixed(6)}\nLng: ${lng.toFixed(6)}`;
        document.body.appendChild(tempDisplay);
        
        setTimeout(() => {
            tempDisplay.remove();
        }, 3000);
    }
    
    function handleError(error) {
        let message = "Error: ";
        switch(error.code) {
            case error.PERMISSION_DENIED:
                message += "Location permission denied";
                break;
            case error.POSITION_UNAVAILABLE:
                message += "Location unavailable";
                break;
            case error.TIMEOUT:
                message += "Location request timed out";
                break;
            default:
                message += "Unknown error";
        }
        locationStatus.textContent = message;
    }
    
    // Start with high accuracy request
    navigator.geolocation.getCurrentPosition(handlePosition, handleError, highAccuracyOptions);
    
    // Then set up the watcher with best available settings
    const watchId = navigator.geolocation.watchPosition(
        handlePosition,
        handleError,
        highAccuracyOptions
    );
}

// Handle window resize
window.addEventListener('resize', function() {
    const scene = document.querySelector('a-scene');
    if (scene) {
        scene.style.width = window.innerWidth + 'px';
        scene.style.height = window.innerHeight + 'px';
    }
});

// Force initial resize
window.dispatchEvent(new Event('resize'));

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    setupTabs();
    setupGeolocation();
    setupTapEvents();
    
    // Show tap instruction by default
    document.getElementById('tap-instruction').style.display = 'block';
    
    // Touch feedback for buttons
    document.querySelectorAll('.tab-button, .clue-header').forEach(button => {
        button.addEventListener('touchstart', function() {
            this.style.transform = 'scale(0.95)';
        });
        
        button.addEventListener('touchend', function() {
            this.style.transform = '';
        });
    });
});