// Track current proximity location and image count
let currentProximityLocation = null;
let imageCounter = 0;
let currentLat = null;
let currentLng = null;
let activeObjects = {};

// Track daffodil model rotation
let currentDaffodilModel = 1;
const totalDaffodilModels = 3;

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

function checkAllCluesCompleted() {
    return LOCATIONS.every(location => location.completed);
}

// Generic function to add a 3D object at tap position
function add3DObject(event, objPath, mtlPath, scale = '0.1 0.1 0.1') {
    const objectsContainer = document.getElementById('dynamic-objects');
    if (!objectsContainer) return;

    const pos = getWorldPosition(event.clientX, event.clientY);

    const obj = document.createElement('a-entity');
    const objId = `obj-${Date.now()}`; // Unique ID based on timestamp
    obj.setAttribute('id', objId);

    // Set object properties
    obj.setAttribute('position', `${pos.x} ${pos.y} ${pos.z}`);
    obj.setAttribute('scale', scale);
    obj.setAttribute('look-at', '[camera]');

    // Add OBJ model component
    obj.setAttribute('obj-model', {
        obj: objPath,
        mtl: mtlPath
    });

    objectsContainer.appendChild(obj);

    // Wait for model to load
    obj.addEventListener('model-loaded', () => {
        // Set initial material properties
        obj.object3D.traverse(child => {
            if (child.material) {
                child.material.transparent = true;
                child.material.opacity = 1;
            }
        });
    });

    // Remove after timeout (if still desired)
    setTimeout(() => {
        if (obj.parentNode) {
            objectsContainer.removeChild(obj);
        }
    }, 2500);
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

// Updated sylvan function to work like iVoted
function sylvanImage(event) {
    if (currentProximityLocation && currentProximityLocation.id === 1) {
        add3DObject(event, 'img/cattails.obj', 'img/cattails.mtl', '0.1 0.1 0.1');
    }
}

// Updated daffodil function with model rotation
function daffodilImage(event) {
    if (currentProximityLocation && currentProximityLocation.id === 4) {
        const modelNum = currentDaffodilModel;
        add3DObject(event, `img/daffodil-${modelNum}.obj`, `img/daffodil-${modelNum}.mtl`, '0.05 0.05 0.05');

        // Rotate to next model
        currentDaffodilModel = currentDaffodilModel % totalDaffodilModels + 1;
    }
}

function douglassImage(event) {
    if (currentProximityLocation && currentProximityLocation.id === 3) {
        add3DObject(event, 'img/candle.obj', 'img/candle.mtl', '0.1 0.1 0.1');
    }
}

function civilWarImage(event) {
    if (currentProximityLocation && currentProximityLocation.id === 2) {
        add3DObject(event, 'img/bugle.obj', 'img/bugle.mtl', '0.1 0.1 0.1');
    }
}

function milinerImage(event) {
    if (currentProximityLocation && currentProximityLocation.id === 5) {
        add3DObject(event, 'img/drum.obj', 'img/drum.mtl', '0.2 0.2 0.2');
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
        header.addEventListener('click', function () {
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
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

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
        statusEl.textContent = `Visited ${LOCATIONS[clueIndex].trueName}!`;
        statusEl.style.display = 'block';
        setTimeout(() => statusEl.style.display = 'none', 3000);

        // Check if all clues are now completed
        if (checkAllCluesCompleted()) {
            showCelebration();
        }
    }
}

function triggerCelebrationForTesting() {
    // First mark all clues as completed for testing
    LOCATIONS.forEach(location => {
        location.completed = true;
        const indicator = document.querySelector(`.clue-item[data-location-id="${location.id}"] .status-indicator`);
        if (indicator) {
            indicator.classList.add('completed');
        }
    });
    
    // Then show the celebration
    showCelebration();
    
    console.log("Celebration manually triggered for testing");
}

function showCelebration() {
    const overlay = document.getElementById('celebration-overlay');
    overlay.style.display = 'flex';
    
    // Load the Tenor script if not already loaded
    if (!window.tgif) {
        const script = document.createElement('script');
        script.src = 'https://tenor.com/embed.js';
        script.async = true;
        document.body.appendChild(script);
    }
    
    // Hide after 20 seconds
    setTimeout(() => {
        overlay.style.display = 'none';
    }, 20000);
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

// Update your click handler to pass the event
document.addEventListener('DOMContentLoaded', () => {
    setupTabs();
    setupGeolocation();

    document.addEventListener('click', (event) => {
        if (!event.target.closest('.tab, .tab-button, .clue-header')) {
            if (currentProximityLocation) {
                switch (currentProximityLocation.id) {
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

    // Add this in your DOMContentLoaded event listener or initialization function
    document.getElementById('check-location-btn').addEventListener('click', () => {
        if (currentLat && currentLng) {
            checkProximity(currentLat, currentLng);
            const statusEl = document.getElementById('location-status');
            statusEl.textContent = `Location checked!\nLat: ${currentLat.toFixed(6)}\nLng: ${currentLng.toFixed(6)}`;
            statusEl.style.display = 'block';
            setTimeout(() => statusEl.style.display = 'none', 3000);
        } else {
            const statusEl = document.getElementById('location-status');
            statusEl.textContent = "Location not available yet...";
            statusEl.style.display = 'block';
            setTimeout(() => statusEl.style.display = 'none', 3000);
        }
    });

    // Also add touch feedback for mobile
    document.getElementById('check-location-btn').addEventListener('touchstart', function () {
        this.style.transform = 'translateX(-50%) scale(0.95)';
    });
    document.getElementById('check-location-btn').addEventListener('touchend', function () {
        this.style.transform = 'translateX(-50%)';
    });

    /* const testBtn = document.getElementById('test-celebration-btn');
    testBtn.style.display = 'block';
    testBtn.addEventListener('click', triggerCelebrationForTesting); */

    window.dispatchEvent(new Event('resize'));
});