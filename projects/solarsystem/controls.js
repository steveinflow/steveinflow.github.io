class MovementControls {
    constructor(camera, rocket) {
        this.camera = camera;
        this.rocket = rocket;
        this.cameraPitch = 0;
        this.cameraYaw = 0;
        this.moveSpeed = 50;
        this.baseSpeed = 50;
        this.boostMultiplier = 2;
        this.keys = {};

        // Initialize controls
        document.addEventListener('keydown', (e) => this.keys[e.key.toLowerCase()] = true);
        document.addEventListener('keyup', (e) => this.keys[e.key.toLowerCase()] = false);

        // Mouse look controls
        document.addEventListener('mousemove', (e) => {
            if (document.pointerLockElement) {
                this.cameraYaw -= e.movementX * 0.002;
                this.cameraPitch -= e.movementY * 0.002;
                this.cameraPitch = Math.max(-Math.PI/3, Math.min(Math.PI/3, this.cameraPitch));
            }
        });

        // Add pointer lock on click
        document.addEventListener('click', () => {
            document.body.requestPointerLock();
        });
    }

    update(deltaTime, options = {}) {
        const {
            minHeight = -Infinity,
            maxHeight = Infinity,
            boostMultiplier = 2,
            isSpace = false
        } = options;

        // Update boost state
        this.moveSpeed = this.keys['f'] ? this.baseSpeed * boostMultiplier : this.baseSpeed;

        // Update camera rotation
        if (this.keys['a']) this.cameraYaw += deltaTime * 2;
        if (this.keys['d']) this.cameraYaw -= deltaTime * 2;
        if (this.keys['q']) this.cameraPitch += deltaTime * 2;
        if (this.keys['e']) this.cameraPitch -= deltaTime * 2;
        this.cameraPitch = Math.max(-Math.PI/3, Math.min(Math.PI/3, this.cameraPitch));

        // Apply camera rotation
        this.camera.quaternion.setFromEuler(new THREE.Euler(
            this.cameraPitch,
            this.cameraYaw,
            0,
            'YXZ'
        ));

        // Handle movement
        const direction = new THREE.Vector3(0, 0, -1);
        if (this.keys['w'] || this.keys['s']) {
            direction.applyQuaternion(this.camera.quaternion);
            const moveSpeed = (this.keys['w'] ? 1 : -1) * this.moveSpeed * deltaTime;
            
            const newPosition = this.camera.position.clone();
            newPosition.addScaledVector(direction, moveSpeed);
            newPosition.y = Math.max(minHeight, Math.min(maxHeight, newPosition.y));
            this.camera.position.copy(newPosition);

            // Update rocket in space
            if (isSpace && this.rocket) {
                // Position rocket relative to camera
                const rocketOffset = new THREE.Vector3(0, -2, -10);
                rocketOffset.applyQuaternion(this.camera.quaternion);
                this.rocket.container.position.copy(this.camera.position).add(rocketOffset);
                
                // Match rocket rotation to camera
                this.rocket.container.quaternion.copy(this.camera.quaternion);
                
                // Add tilt based on turning
                if (this.keys['a']) {
                    this.rocket.container.rotation.z = Math.min(this.rocket.container.rotation.z + 0.1, 0.5);
                } else if (this.keys['d']) {
                    this.rocket.container.rotation.z = Math.max(this.rocket.container.rotation.z - 0.1, -0.5);
                } else {
                    this.rocket.container.rotation.z *= 0.95;
                }
            }
        }

        // Vertical movement
        if (this.keys['space']) {
            this.camera.position.y = Math.min(maxHeight, 
                this.camera.position.y + this.moveSpeed * deltaTime);
        }
        if (this.keys['shift']) {
            this.camera.position.y = Math.max(minHeight, 
                this.camera.position.y - this.moveSpeed * deltaTime);
        }
    }
} 