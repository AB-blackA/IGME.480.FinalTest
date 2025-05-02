// Track current proximity location and image count
let currentProximityLocation = null;
let imageCounter = 0;
let currentLat = null;
let currentLng = null;

// Convert screen coordinates to AR world coordinates
function getWorldPosition(clientX, clientY) {
    // Normalize screen coordinates (-1 to 1)
    const x = (clientX / window.innerWidth) * 2 - 1;
    const y = -(clientY / window.innerHeight) * 2 + 1;
    
    // Place the sticker 1 meter away from camera
    const distance = 1;
    
    // Calculate position in world space
    return {
        x: x * distance,
        y: y * distance,
        z: -distance  // Negative Z = in front of camera
    };
}

// Generic function to add an image
function addImage(event, imageSrc, scale = '0.3 0.3 0.3') {
    const imagesContainer = document.getElementById('dynamic-images');
    if (!imagesContainer) return;
    
    const pos = getWorldPosition(event.clientX, event.clientY);
    
    imageCounter++;
    const image = document.createElement('a-image');
    image.setAttribute('id', `sticker-${imageCounter}`);
    image.setAttribute('src', imageSrc);
    image.setAttribute('position', `${pos.x} ${pos.y} ${pos.z}`);
    image.setAttribute('scale', scale);
    image.setAttribute('material', 'shader: flat; transparent: true');
    image.setAttribute('look-at', '[camera]');
    image.setAttribute('animation', 'property: material.opacity; to: 0; dur: 5000');
    
    imagesContainer.appendChild(image);
    
    setTimeout(() => {
        if (image.parentNode) {
            image.parentNode.removeChild(image);
        }
    }, 5000);
}

// Add sticker at clicked position
function addVotedSticker(event) {
    addImage(event, 'img/iVotedSticker.png');
}

// Sylvan Waters image
function sylvanImage(event) {
    if (currentProximityLocation && currentProximityLocation.id === 1) {
        addImage(event, 'img/sylvanImage.png');
    }
}

// Daffodil image
function daffodilImage(event) {
    if (currentProximityLocation && currentProximityLocation.id === 4) {
        addImage(event, 'img/daffodilImage.png');
    }
}

// Frederick Douglass image
function douglassImage(event) {
    if (currentProximityLocation && currentProximityLocation.id === 3) {
        addImage(event, 'img/douglassImage.png');
    }
}

// Civil War image
function civilWarImage(event) {
    if (currentProximityLocation && currentProximityLocation.id === 2) {
        addImage(event, 'img/civilWarImage.png');
    }
}

// Miliner image (assuming this is for Drummer Boy's Grave)
function milinerImage(event) {
    if (currentProximityLocation && currentProximityLocation.id === 5) {
        addImage(event, 'img/milinerImage.png');
    }
}

// Tab functionality
function setupTabs() {
    const leftTabButton = document.getElementById('left-tab-button');
    const rightTabButton = document.getElementById('right-tab-button');
    const leftTab = document.getElementById('left-tab');
    const rightTab = document.getElementById('right-tab');
    const closeButtons = document.querySelectorAll('.close-tab');
    
    leftTabButton.addEventListener('click', () => {
        rightTab.classList.remove('open');
        leftTab.classList.toggle('open');
    });
    
    rightTabButton.addEventListener('click', () => {
        leftTab.classList.remove('open');
        rightTab.classList.toggle('open');
    });
    
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            button.closest('.tab').classList.remove('open');
        });
    });
    
    document.querySelectorAll('.clue-header').forEach(header => {
        header.addEventListener('click', function() {
            const item = this.parentElement;
            item.classList.toggle('expanded');
            this.querySelector('.expand-icon').textContent = 
                item.classList.contains('expanded') ? '-' : '+';
        });
    });
}

// GPS functions
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
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

function checkProximity(lat, lng) {
    let closestDistance = Infinity;
    let closestLocation = null;
    
    LOCATIONS.forEach(location => {
        const distance = getDistance(lat, lng, location.lat, location.lng);
        location.inProximity = distance <= location.radius * 1.5;
        
        if (location.inProximity && distance < closestDistance) {
            closestDistance = distance;
            closestLocation = location;
        }
        
        if (distance <= location.radius && !location.completed) {
            location.completed = true;
            markClueCompleted(location.id);
        }
    });
    
    currentProximityLocation = closestLocation;
    const proximityIndicator = document.getElementById('proximity-indicator');
    
    if (closestLocation && !closestLocation.completed) {
        proximityIndicator.textContent = `Near ${closestLocation.name} (${Math.round(closestDistance)}m away)`;
        proximityIndicator.style.display = 'block';
    } else {
        proximityIndicator.style.display = 'none';
    }
}

function markClueCompleted(clueIndex) {
    const clues = document.querySelectorAll('.clue-item');
    if (clueIndex >= 0 && clueIndex < clues.length) {
        const indicator = clues[clueIndex].querySelector('.status-indicator');
        indicator.classList.add('completed');
        
        const statusEl = document.getElementById('location-status');
        statusEl.textContent = `Visited ${LOCATIONS[clueIndex].name}!`;
        statusEl.style.display = 'block';
        setTimeout(() => statusEl.style.display = 'none', 3000);
    }
}

function setupGeolocation() {
    const locationStatus = document.getElementById('location-status');
    
    if (!navigator.geolocation) {
        locationStatus.textContent = "Geolocation not supported";
        locationStatus.style.display = 'block';
        return;
    }
    
    const handlePosition = (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracy = position.coords.accuracy;
        currentLat = lat;
        currentLng = lng;
        
        // Update persistent status display
        locationStatus.textContent = `Lat: ${lat.toFixed(6)}\nLng: ${lng.toFixed(6)}\nAccuracy: ${Math.round(accuracy)}m`;
        locationStatus.style.display = 'block';
        
        // Show temporary floating coordinates
        // showTemporaryCoordinates(lat, lng);
        checkProximity(lat, lng);
    };
    
    const handleError = (error) => {
        console.error("Geolocation error:", error);
        locationStatus.textContent = `Error: ${error.message}`;
        locationStatus.style.display = 'block';
    };
    
    navigator.geolocation.watchPosition(
        handlePosition,
        handleError,
        { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );
}

function setLocation(id) {
    // Make sure the ID is valid
    if (id >= 0 && id < LOCATIONS.length) {
        currentProximityLocation = LOCATIONS[id];
        
        // Update the proximity indicator for testing
        const proximityIndicator = document.getElementById('proximity-indicator');
        proximityIndicator.textContent = `TESTING: Near ${LOCATIONS[id].name}`;
        proximityIndicator.style.display = 'block';
        
        console.log(`Location set to: ${LOCATIONS[id].name}`);
    } else {
        console.error(`Invalid location ID: ${id}`);
    }
}

function printCurrentLocation() {
    if (currentProximityLocation) {
        console.log(`Current location: ${currentProximityLocation.name} (ID: ${currentProximityLocation.id})`);
    } else {
        console.log("No current location set");
    }
}

// Initialize everything
document.addEventListener('DOMContentLoaded', () => {
    setupTabs();
    setupGeolocation();
    
    // Click handler for stickers (ignores UI clicks)
    document.addEventListener('click', (event) => {
        if (!event.target.closest('.tab, .tab-button, .clue-header')) {
            // Check current location and call appropriate function
            if (currentProximityLocation) {
                switch(currentProximityLocation.id) {
                    case 0: addVotedSticker(event); break;
                    case 1: sylvanImage(event); break;
                    case 2: civilWarImage(event); break;
                    case 3: douglassImage(event); break;
                    case 4: daffodilImage(event); break;
                    case 5: milinerImage(event); break;
                    default: addVotedSticker(event);
                }
            } else {
                addVotedSticker(event);
            }
        }
    });
    
    // Touch feedback for buttons
    document.querySelectorAll('.tab-button, .clue-header').forEach(btn => {
        btn.addEventListener('touchstart', () => btn.style.transform = 'scale(0.95)');
        btn.addEventListener('touchend', () => btn.style.transform = '');
    });
    
    // Handle window resize for AR scene
    window.addEventListener('resize', () => {
        const scene = document.querySelector('a-scene');
        if (scene) {
            scene.style.width = window.innerWidth + 'px';
            scene.style.height = window.innerHeight + 'px';
        }
    });
    window.dispatchEvent(new Event('resize'));
});