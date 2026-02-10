class SunFireEffect {
    constructor(sunRadius) {
        this.particles = [];
        this.particleCount = 1000;
        
        // Create particle system
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(this.particleCount * 3);
        const colors = new Float32Array(this.particleCount * 3);
        
        for (let i = 0; i < this.particleCount; i++) {
            // Initial positions
            this.particles.push({
                position: new THREE.Vector3(
                    (Math.random() - 0.5) * sunRadius * 2.2,
                    (Math.random() - 0.5) * sunRadius * 2.2,
                    (Math.random() - 0.5) * sunRadius * 2.2
                ),
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 2,
                    (Math.random() - 0.5) * 2,
                    (Math.random() - 0.5) * 2
                ),
                life: Math.random()
            });

            // Set initial positions and colors
            const i3 = i * 3;
            positions[i3] = this.particles[i].position.x;
            positions[i3 + 1] = this.particles[i].position.y;
            positions[i3 + 2] = this.particles[i].position.z;

            colors[i3] = 1;  // R
            colors[i3 + 1] = Math.random() * 0.3;  // G (varies for fire effect)
            colors[i3 + 2] = 0;  // B
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 2,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });

        this.particleSystem = new THREE.Points(geometry, material);
    }

    update(deltaTime) {
        const positions = this.particleSystem.geometry.attributes.position.array;
        const colors = this.particleSystem.geometry.attributes.color.array;

        for (let i = 0; i < this.particleCount; i++) {
            const particle = this.particles[i];
            const i3 = i * 3;

            // Update life
            particle.life -= deltaTime * 0.5;
            if (particle.life <= 0) {
                // Reset particle
                particle.position.set(
                    (Math.random() - 0.5) * 40,
                    (Math.random() - 0.5) * 40,
                    (Math.random() - 0.5) * 40
                );
                particle.velocity.set(
                    (Math.random() - 0.5) * 2,
                    (Math.random() - 0.5) * 2 + 2, // Bias upward
                    (Math.random() - 0.5) * 2
                );
                particle.life = 1;
            }

            // Move particle
            particle.position.add(particle.velocity.clone().multiplyScalar(deltaTime * 10));

            // Update position
            positions[i3] = particle.position.x;
            positions[i3 + 1] = particle.position.y;
            positions[i3 + 2] = particle.position.z;

            // Update color based on life
            colors[i3 + 1] = particle.life * 0.3; // G
            colors[i3 + 2] = particle.life * 0.1; // B
        }

        this.particleSystem.geometry.attributes.position.needsUpdate = true;
        this.particleSystem.geometry.attributes.color.needsUpdate = true;
    }
}

class CelestialBody {
    constructor(name, radius, textureUrl, orbitRadius, orbitSpeed, options = {}) {
        this.name = name;
        this.radius = radius;
        this.orbitRadius = orbitRadius;
        this.orbitSpeed = orbitSpeed;
        this.angle = Math.random() * Math.PI * 2;
        
        const geometry = new THREE.SphereGeometry(radius, 64, 64);
        const textureLoader = new THREE.TextureLoader();
        
        let materialOptions = {
            bumpScale: 0.05,
        };

        if (textureUrl) {
            materialOptions.map = textureLoader.load(textureUrl);
        } else if (options.color) {
            materialOptions.color = options.color;
        }

        // Add specific material properties
        if (options.emissive) {
            materialOptions.emissive = options.emissive;
            materialOptions.emissiveIntensity = options.emissiveIntensity || 1;
        }
        if (options.bumpMap) {
            materialOptions.bumpMap = textureLoader.load(options.bumpMap);
            materialOptions.bumpScale = options.bumpScale || 0.05;
        }
        if (options.specularMap) {
            materialOptions.specularMap = textureLoader.load(options.specularMap);
        }

        const material = new THREE.MeshPhongMaterial(materialOptions);
        this.mesh = new THREE.Mesh(geometry, material);

        // Simplify Jupiter's appearance
        if (options.stripes) {
            // Single orange sphere for Jupiter
            this.mesh.material.color.setHex(0xFFA500);
        }

        // Add Saturn's rings
        if (options.rings) {
            const ringGeometry = new THREE.RingGeometry(radius * 1.4, radius * 2.2, 64);
            const ringMaterial = new THREE.MeshPhongMaterial({
                color: options.ringColor || 0xC2B280,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.8
            });
            this.rings = new THREE.Mesh(ringGeometry, ringMaterial);
            this.rings.rotation.x = Math.PI / 2;
        }
        
        // Create orbit line with custom color
        if (orbitRadius > 0) {
            const orbitGeometry = new THREE.RingGeometry(orbitRadius, orbitRadius + 0.1, 128);
            const orbitMaterial = new THREE.MeshBasicMaterial({
                color: options.orbitColor || 0x444444,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.3
            });
            this.orbitLine = new THREE.Mesh(orbitGeometry, orbitMaterial);
            this.orbitLine.rotation.x = Math.PI / 2;
        }

        // Add 3D text label
        const loader = new THREE.FontLoader();
        loader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', (font) => {
            const textGeometry = new THREE.TextGeometry(name, {
                font: font,
                size: radius * 0.5,
                height: radius * 0.1,
                curveSegments: 12,
                bevelEnabled: true,
                bevelThickness: radius * 0.02,
                bevelSize: radius * 0.01,
                bevelOffset: 0,
                bevelSegments: 5
            });

            const textMaterial = new THREE.MeshPhongMaterial({ 
                color: 0xffffff,
                specular: 0x666666
            });
            
            this.textMesh = new THREE.Mesh(textGeometry, textMaterial);
            
            textGeometry.computeBoundingBox();
            const textWidth = textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x;
            this.textOffset = new THREE.Vector3(-textWidth/2, radius * 1.5, 0);
            
            if (solarSystem) {  // Check if solarSystem exists
                solarSystem.scene.add(this.textMesh);
            }
        });

        // Add fire effect for the sun
        if (name === 'Sun') {
            this.fireEffect = new SunFireEffect(radius);
            this.mesh.add(this.fireEffect.particleSystem);
        }
    }

    update(deltaTime) {
        if (this.orbitRadius > 0) {
            this.angle += this.orbitSpeed * deltaTime;
            this.mesh.position.x = Math.cos(this.angle) * this.orbitRadius;
            this.mesh.position.z = Math.sin(this.angle) * this.orbitRadius;
        }
        this.mesh.rotation.y += 0.1 * deltaTime;

        // Update text position and rotation
        if (this.textMesh) {
            // Position text above planet
            const planetPos = this.mesh.position.clone();
            this.textMesh.position.copy(planetPos.add(this.textOffset));

            // Make text face camera
            const camera = solarSystem.camera;
            this.textMesh.quaternion.copy(camera.quaternion);
        }

        // Update fire effect if this is the sun
        if (this.fireEffect) {
            this.fireEffect.update(deltaTime);
        }
    }
}

class PlanetSurface {
    constructor(planetName) {
        this.scene = new THREE.Scene();
        this.isActive = false;
        
        // Add lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        this.scene.add(ambientLight);
        
        const dirLight = new THREE.DirectionalLight(0xffffff, 1);
        dirLight.position.set(1, 1, 1);
        this.scene.add(dirLight);

        // Create procedural grass texture
        this.grassTexture = this.createProceduralGrassTexture();
        this.grassBumpMap = this.createProceduralGrassBumpMap();

        // Create ground with grass texture for Earth
        const groundGeometry = new THREE.PlaneGeometry(2000, 2000, 50, 50);
        const groundMaterial = this.createGroundMaterial(planetName);
        this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
        this.ground.rotation.x = -Math.PI / 2;
        this.scene.add(this.ground);

        // Add grid helper for reference
        const gridHelper = new THREE.GridHelper(2000, 20, 0x000000, 0x333333);
        this.scene.add(gridHelper);

        // Store planet name
        this.planetName = planetName;

        // Simplified feature types with Earth-specific and Neptune-specific features
        this.featureTypes = {
            Mercury: [{
                geometry: new THREE.DodecahedronGeometry(50),
                material: new THREE.MeshPhongMaterial({ color: 0x8B4513 }),
                count: 50,
                heightOffset: 25
            }],
            Mars: [{
                geometry: new THREE.DodecahedronGeometry(40),
                material: new THREE.MeshPhongMaterial({ color: 0xA0522D }),
                count: 100,
                heightOffset: 20
            }],
            Earth: [
                {
                    name: 'tree',
                    geometry: new THREE.CylinderGeometry(0, 15, 60),
                    material: new THREE.MeshPhongMaterial({ color: 0x228B22 }),
                    count: 300,
                    heightOffset: 30,
                    createMesh: () => {
                        const tree = new THREE.Group();
                        // Trunk
                        const trunk = new THREE.Mesh(
                            new THREE.CylinderGeometry(2, 3, 20),
                            new THREE.MeshPhongMaterial({ color: 0x8B4513 })
                        );
                        // Leaves
                        const leaves = new THREE.Mesh(
                            new THREE.ConeGeometry(8, 40, 8),
                            new THREE.MeshPhongMaterial({ color: 0x228B22 })
                        );
                        leaves.position.y = 25;
                        tree.add(trunk);
                        tree.add(leaves);
                        return tree;
                    }
                },
                {
                    name: 'mountain',
                    geometry: new THREE.ConeGeometry(100, 200, 4),
                    material: new THREE.MeshPhongMaterial({ 
                        color: 0x808080,
                        flatShading: true 
                    }),
                    count: 10,
                    heightOffset: 100
                },
                {
                    name: 'house',
                    count: 50,
                    heightOffset: 10,
                    createMesh: () => {
                        const house = new THREE.Group();
                        // House body
                        const body = new THREE.Mesh(
                            new THREE.BoxGeometry(20, 15, 20),
                            new THREE.MeshPhongMaterial({ color: 0xDEB887 })
                        );
                        // Roof
                        const roof = new THREE.Mesh(
                            new THREE.ConeGeometry(15, 10, 4),
                            new THREE.MeshPhongMaterial({ color: 0x8B4513 })
                        );
                        roof.position.y = 12;
                        roof.rotation.y = Math.PI / 4;
                        house.add(body);
                        house.add(roof);
                        return house;
                    }
                }
            ],
            Venus: [{
                geometry: new THREE.ConeGeometry(30, 60),
                material: new THREE.MeshPhongMaterial({ 
                    color: 0xFF4500,
                    emissive: 0xFF0000,
                    emissiveIntensity: 0.5
                }),
                count: 30,
                heightOffset: 30
            }],
            Neptune: [
                {
                    name: 'iceMountain',
                    count: 15,
                    heightOffset: 50,
                    createMesh: () => {
                        const mountain = new THREE.Group();
                        
                        // Create jagged ice mountain
                        const geometry = new THREE.ConeGeometry(80, 200, 5);
                        const material = new THREE.MeshPhongMaterial({ 
                            color: 0xADD8E6,
                            shininess: 90,
                            transparent: true,
                            opacity: 0.8,
                            specular: 0xFFFFFF
                        });
                        
                        const peak = new THREE.Mesh(geometry, material);
                        peak.rotation.y = Math.random() * Math.PI;
                        mountain.add(peak);

                        // Add ice crystals around base
                        for (let i = 0; i < 5; i++) {
                            const crystal = new THREE.Mesh(
                                new THREE.ConeGeometry(20, 60, 4),
                                material
                            );
                            const angle = (i / 5) * Math.PI * 2;
                            crystal.position.set(
                                Math.cos(angle) * 50,
                                20,
                                Math.sin(angle) * 50
                            );
                            crystal.rotation.z = Math.random() * 0.5 - 0.25;
                            crystal.rotation.y = Math.random() * Math.PI;
                            mountain.add(crystal);
                        }

                        return mountain;
                    }
                },
                {
                    name: 'iceDragon',
                    count: 1,
                    heightOffset: 100,
                    createMesh: () => {
                        const dragon = new THREE.Group();

                        // Dragon body
                        const body = new THREE.Mesh(
                            new THREE.CylinderGeometry(20, 30, 200, 8),
                            new THREE.MeshPhongMaterial({ 
                                color: 0x87CEEB,
                                shininess: 100,
                                transparent: true,
                                opacity: 0.9
                            })
                        );
                        body.rotation.z = Math.PI / 3;
                        dragon.add(body);

                        // Dragon head
                        const head = new THREE.Mesh(
                            new THREE.ConeGeometry(15, 40, 8),
                            new THREE.MeshPhongMaterial({ 
                                color: 0xADD8E6,
                                shininess: 100
                            })
                        );
                        head.position.y = 120;
                        head.position.x = 60;
                        head.rotation.z = -Math.PI / 6;
                        dragon.add(head);

                        // Wings
                        const wingGeometry = new THREE.BufferGeometry();
                        const wingShape = new THREE.Shape();
                        wingShape.moveTo(0, 0);
                        wingShape.lineTo(100, 50);
                        wingShape.lineTo(80, 100);
                        wingShape.lineTo(0, 60);
                        wingShape.lineTo(0, 0);
                        
                        const wingMesh = new THREE.Mesh(
                            new THREE.ShapeGeometry(wingShape),
                            new THREE.MeshPhongMaterial({ 
                                color: 0xB0E2FF,
                                transparent: true,
                                opacity: 0.6,
                                side: THREE.DoubleSide
                            })
                        );
                        
                        // Add two wings
                        const wing1 = wingMesh.clone();
                        wing1.position.set(0, 50, 30);
                        wing1.rotation.x = Math.PI / 4;
                        dragon.add(wing1);

                        const wing2 = wingMesh.clone();
                        wing2.position.set(0, 50, -30);
                        wing2.rotation.x = -Math.PI / 4;
                        dragon.add(wing2);

                        // Add spikes along the back
                        for (let i = 0; i < 8; i++) {
                            const spike = new THREE.Mesh(
                                new THREE.ConeGeometry(5, 20, 4),
                                new THREE.MeshPhongMaterial({ color: 0xFFFFFF })
                            );
                            spike.position.y = i * 25;
                            spike.position.x = i * 8;
                            spike.rotation.z = -Math.PI / 6;
                            dragon.add(spike);
                        }

                        return dragon;
                    }
                }
            ]
        };

        // Create features
        this.createFeatures();

        // Create simple skybox
        this.createSkybox(planetName);
    }

    createFeatures() {
        const features = this.featureTypes[this.planetName];
        if (!features) return;

        features.forEach(featureType => {
            for (let i = 0; i < featureType.count; i++) {
                const mesh = featureType.createMesh ? 
                    featureType.createMesh() : 
                    new THREE.Mesh(featureType.geometry, featureType.material);
                
                // Random position within a circle, avoiding center
                const radius = 100 + Math.random() * 800; // Start from 100 units out
                const angle = Math.random() * Math.PI * 2;
                mesh.position.set(
                    Math.cos(angle) * radius,
                    featureType.heightOffset,
                    Math.sin(angle) * radius
                );

                // Random rotation and scale variation
                mesh.rotation.y = Math.random() * Math.PI * 2;
                const scale = 0.7 + Math.random() * 0.6;
                mesh.scale.set(scale, scale, scale);

                this.scene.add(mesh);
            }
        });
    }

    createSkybox(planetName) {
        // Create skybox based on planet type
        const skyColors = {
            Mercury: 0x000000, // Black for no atmosphere
            Venus: 0xFFA500,   // Orange toxic atmosphere
            Earth: 0x87CEEB,   // Light blue sky
            Mars: 0xFFB6C1,    // Pink-ish atmosphere
            Jupiter: 0xDEB887,  // Brownish storms
            Saturn: 0xFFE4B5,   // Pale yellow
            Uranus: 0xE0FFFF,   // Light cyan
            Neptune: 0x4169E1    // Royal blue
        };

        // Create a large sphere for the sky
        const skyGeometry = new THREE.SphereGeometry(900, 32, 32);
        const skyMaterial = new THREE.MeshBasicMaterial({
            color: skyColors[planetName] || 0x000000,
            side: THREE.BackSide,
            fog: false
        });
        const sky = new THREE.Mesh(skyGeometry, skyMaterial);
        this.scene.add(sky);
    }

    createProceduralGrassTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // Base green color
        ctx.fillStyle = '#2d5a27';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Add grass texture variation
        for (let i = 0; i < 5000; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const length = 2 + Math.random() * 4;
            const angle = Math.random() * Math.PI;
            
            ctx.strokeStyle = `rgba(${45 + Math.random() * 30}, ${90 + Math.random() * 40}, ${39 + Math.random() * 20}, 0.7)`;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
            ctx.stroke();
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(50, 50);
        return texture;
    }

    createProceduralGrassBumpMap() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // Black background for no displacement
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Add bump texture
        for (let i = 0; i < 3000; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const size = 1 + Math.random() * 3;
            
            ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + Math.random() * 0.7})`;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }

        const bumpMap = new THREE.CanvasTexture(canvas);
        bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping;
        bumpMap.repeat.set(50, 50);
        return bumpMap;
    }

    createGroundMaterial(planetName) {
        const materials = {
            Mercury: new THREE.MeshPhongMaterial({
                color: 0x808080,
                shininess: 0,
                specular: 0x222222
            }),
            Venus: new THREE.MeshPhongMaterial({
                color: 0xC68E17,
                emissive: 0x330000,
                shininess: 10
            }),
            Earth: new THREE.MeshPhongMaterial({
                color: 0x355E3B,
                map: this.grassTexture,
                bumpMap: this.grassBumpMap,
                bumpScale: 1,
                shininess: 5
            }),
            Mars: new THREE.MeshPhongMaterial({
                color: 0xA52A2A,
                shininess: 0,
                specular: 0x111111
            }),
            Jupiter: new THREE.MeshPhongMaterial({
                color: 0xDEB887,
                shininess: 30
            }),
            Saturn: new THREE.MeshPhongMaterial({
                color: 0xDAA520,
                shininess: 30
            }),
            Uranus: new THREE.MeshPhongMaterial({
                color: 0x40E0D0,
                shininess: 50
            }),
            Neptune: new THREE.MeshPhongMaterial({
                color: 0x0000CD,
                shininess: 50
            })
        };

        if (planetName === 'Earth') {
            return materials[planetName];
        }

        return materials[planetName] || new THREE.MeshPhongMaterial({ color: 0x808080 });
    }

    update(camera) {
        // No need for updates in this simplified version
    }
}

class RocketShip {
    constructor() {
        // Create rocket body
        const bodyGeometry = new THREE.CylinderGeometry(1, 1.5, 8, 16);
        const bodyMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xDDDDDD,
            shininess: 100
        });
        this.body = new THREE.Mesh(bodyGeometry, bodyMaterial);

        // Create exhaust effect with smaller size
        this.exhaust = new THREE.Points(
            new THREE.BufferGeometry(),
            new THREE.PointsMaterial({
                size: 0.3, // Reduced size
                vertexColors: true,
                transparent: true,
                opacity: 0.6,
                blending: THREE.AdditiveBlending
            })
        );

        // Add boost properties with adjusted values
        this.baseParticleSpeed = 1; // Reduced base speed
        this.boostParticleSpeed = 3; // Reduced boost speed
        this.baseParticleCount = 100; // Fewer particles
        this.boostParticleCount = 200;
        this.particleCount = this.baseParticleCount;
        
        // Initialize particles
        this.particles = [];
        this.initializeParticles(this.boostParticleCount);

        // Create a container for the rocket
        this.container = new THREE.Object3D();
        
        // Add exhaust to body
        this.exhaust.position.y = -6; // Position exhaust at bottom of rocket
        this.body.add(this.exhaust);
        
        // Add body to container
        this.container.add(this.body);
        
        // Point rocket forward and scale it
        this.body.rotation.x = -Math.PI/2;
        this.body.scale.set(0.5, 0.5, 0.5);

        // Add nose cone and fins after setting up exhaust
        this.addNoseCone();
        this.addFins();
    }

    addNoseCone() {
        const noseGeometry = new THREE.ConeGeometry(1.5, 3, 16);
        const noseMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xCC0000,
            shininess: 100
        });
        const nose = new THREE.Mesh(noseGeometry, noseMaterial);
        nose.position.y = 5.5;
        this.body.add(nose);
    }

    addFins() {
        const finGeometry = new THREE.BoxGeometry(3, 2, 0.2);
        const finMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xCC0000,
            shininess: 100
        });
        
        for (let i = 0; i < 3; i++) {
            const fin = new THREE.Mesh(finGeometry, finMaterial);
            fin.position.set(
                Math.sin(i * Math.PI * 2/3) * 1.5,
                -4,
                Math.cos(i * Math.PI * 2/3) * 1.5
            );
            fin.rotation.y = i * Math.PI * 2/3;
            this.body.add(fin);
        }
    }

    initializeParticles(count) {
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            this.particles.push({
                position: new THREE.Vector3(
                    (Math.random() - 0.5) * 1,
                    -5 - Math.random() * 3,
                    (Math.random() - 0.5) * 1
                ),
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.2,
                    -Math.random() * 2,
                    (Math.random() - 0.5) * 0.2
                ),
                life: Math.random(),
                hue: Math.random()
            });

            positions[i * 3] = this.particles[i].position.x;
            positions[i * 3 + 1] = this.particles[i].position.y;
            positions[i * 3 + 2] = this.particles[i].position.z;

            const color = new THREE.Color();
            color.setHSL(this.particles[i].hue, 1, 0.5);
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
        }

        this.exhaust.geometry.setAttribute('position', 
            new THREE.BufferAttribute(positions, 3));
        this.exhaust.geometry.setAttribute('color',
            new THREE.BufferAttribute(colors, 3));
    }

    update(deltaTime, keys, camera) {
        // Get camera's direction
        const cameraDirection = new THREE.Vector3(0, 0, -1);
        cameraDirection.applyQuaternion(camera.quaternion);

        // Position rocket further in front of camera
        const rocketOffset = new THREE.Vector3(0, -3, -15); // Further away (-8 to -15) and slightly lower
        rocketOffset.applyQuaternion(camera.quaternion);
        
        this.container.position.copy(camera.position).add(rocketOffset);
        
        // Make rocket face same direction as camera
        this.container.quaternion.copy(camera.quaternion);

        // Update exhaust particles - now always active
        const isBoosting = keys['f'];
        const isMoving = keys['w'];
        const particleSpeed = isBoosting ? this.boostParticleSpeed : this.baseParticleSpeed;
        const activeParticles = isBoosting ? this.boostParticleCount : this.baseParticleCount;

        const positions = this.exhaust.geometry.attributes.position.array;
        const colors = this.exhaust.geometry.attributes.color.array;

        for (let i = 0; i < activeParticles; i++) {
            const particle = this.particles[i];
            
            particle.life -= deltaTime * (isMoving ? 2 : 1); // Faster life reduction when moving

            if (particle.life <= 0) {
                // Reset particle with adjusted spread and speed
                const spread = isBoosting ? 0.4 : 0.2; // Reduced spread
                particle.position.set(
                    (Math.random() - 0.5) * spread,
                    -5 - Math.random() * 2, // Shorter trail
                    (Math.random() - 0.5) * spread
                );
                particle.velocity.set(
                    (Math.random() - 0.5) * 0.1 * spread,
                    -Math.random() * particleSpeed * (isMoving ? 1 : 0.3), // Slower when idle
                    (Math.random() - 0.5) * 0.1 * spread
                );
                particle.life = 1;
                particle.hue = (particle.hue + deltaTime) % 1;
            }

            particle.position.add(
                particle.velocity.clone().multiplyScalar(deltaTime * 10)
            );

            const i3 = i * 3;
            positions[i3] = particle.position.x;
            positions[i3 + 1] = particle.position.y;
            positions[i3 + 2] = particle.position.z;

            // Update color - dimmer when idle
            const color = new THREE.Color();
            const intensity = isBoosting ? 0.6 : (isMoving ? 0.4 : 0.2);
            color.setHSL(particle.hue, 1, intensity);
            colors[i3] = color.r;
            colors[i3 + 1] = color.g;
            colors[i3 + 2] = color.b;
        }

        this.exhaust.geometry.attributes.position.needsUpdate = true;
        this.exhaust.geometry.attributes.color.needsUpdate = true;
    }
}

class VenusScene {
    constructor() {
        // Set up scene
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        // Camera controls
        this.cameraPitch = 0;
        this.cameraYaw = 0;
        this.moveSpeed = 50;
        this.keys = {};

        // Store bound event handlers for cleanup
        this.onKeyDown = (e) => {
            this.keys[e.key.toLowerCase()] = true;
            if (e.code === 'Space') {
                this.shoot();
            }
        };
        this.onKeyUp = (e) => this.keys[e.key.toLowerCase()] = false;
        this.onResize = () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        };

        // Set up keyboard controls
        document.addEventListener('keydown', this.onKeyDown);
        document.addEventListener('keyup', this.onKeyUp);

        // Create simple ground
        const groundGeometry = new THREE.PlaneGeometry(2000, 2000);
        const groundMaterial = new THREE.MeshPhongMaterial({
            color: 0x808080,
            shininess: 0
        });
        this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
        this.ground.rotation.x = -Math.PI / 2;
        this.scene.add(this.ground);

        // Basic lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
        dirLight.position.set(1, 1, 1);
        this.scene.add(dirLight);

        // Add rocket ship
        this.rocket = new RocketShip();
        this.scene.add(this.rocket.container);

        // Set initial camera position
        this.camera.position.set(0, 150, 300);

        // Handle window resize
        window.addEventListener('resize', this.onResize);

        // Add zombies
        this.zombies = [];
        this.createZombies(20); // Create 20 zombies

        this.lastTime = 0;

        // Add laser management
        this.lasers = [];
        this.laserGeometry = new THREE.CylinderGeometry(0.1, 0.1, 20);
        this.laserMaterial = new THREE.MeshPhongMaterial({
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 1
        });

        // Set minimum height above ground
        this.minHeight = 10;
        this.maxHeight = 200;

        // Add ogre boss
        this.createOgre();

        // Track ogre health
        this.ogreHealth = 50;
        this.ogreHitTime = 0;
        this.ogreHitDuration = 0.1; // How long the red flash lasts

        // Add boulder management
        this.boulders = [];
        this.boulderGeometry = new THREE.SphereGeometry(5, 8, 8);
        this.boulderMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x808080,
            roughness: 1
        });
        
        // Ogre attack timing
        this.lastBoulderTime = 0;
        this.boulderCooldown = 2; // Seconds between throws

        // Add rocket health system
        this.rocketHealth = 3;
        this.rocketHitTime = 0;
        this.rocketHitDuration = 0.2; // How long the red flash lasts
        this.isGameOver = false;

        // Create game over screen
        this.createGameOverScreen();

        // Increase rocket collision radius
        this.rocketCollisionRadius = 15; // Increased from 5
    }

    createZombies(count) {
        for (let i = 0; i < count; i++) {
            const zombie = this.createZombie();
            
            // Give each zombie a different starting position and wander area
            const angle = (i / count) * Math.PI * 2;
            const radius = 100 + Math.random() * 300;
            const centerX = Math.cos(angle) * radius;
            const centerZ = Math.sin(angle) * radius;
            
            zombie.position.set(centerX, 0, centerZ);
            zombie.userData.centerPoint = new THREE.Vector3(centerX, 0, centerZ);
            zombie.userData.wanderRadius = 30 + Math.random() * 40;
            zombie.userData.speed = 0.2 + Math.random() * 0.4;
            zombie.userData.timeOffset = Math.random() * Math.PI * 2;
            
            this.zombies.push(zombie);
            this.scene.add(zombie);
        }
    }

    createZombie() {
        const zombie = new THREE.Group();
        const material = new THREE.MeshPhongMaterial({ color: 0x4A6741 });

        // Body
        const body = new THREE.Mesh(
            new THREE.CylinderGeometry(2, 2, 12),
            material
        );
        zombie.add(body);

        // Head
        const head = new THREE.Mesh(
            new THREE.SphereGeometry(2),
            material
        );
        head.position.y = 7;
        zombie.add(head);

        // Arms and legs
        const limbGeometry = new THREE.CylinderGeometry(0.5, 0.5, 8);
        const limbs = new THREE.Group();
        
        [[-2, 3], [2, 3], [-1, -6], [1, -6]].forEach(([x, y]) => {
            const limb = new THREE.Mesh(limbGeometry, material);
            limb.position.set(x, y, 0);
            if (y > 0) limb.rotation.z = x > 0 ? Math.PI / 3 : -Math.PI / 3;
            limbs.add(limb);
        });

        zombie.add(limbs);

        // Animation properties
        zombie.userData = {
            time: Math.random() * Math.PI * 2,
            speed: 0.5,
            direction: new THREE.Vector3(1, 0, 0),
            wanderRadius: 50,
            centerPoint: new THREE.Vector3(0, 0, 0),
            timeOffset: 0,
            updateAnimation: (deltaTime) => {
                zombie.userData.time += deltaTime;

                // Shambling motion
                zombie.position.y = Math.sin(zombie.userData.time * 2) * 0.5;
                limbs.children.forEach((limb, i) => {
                    limb.rotation.x = Math.sin(zombie.userData.time * 2 + (i * Math.PI)) * 0.4;
                });

                // Wandering motion
                const angle = (zombie.userData.time + zombie.userData.timeOffset) * 0.2;
                zombie.position.x = zombie.userData.centerPoint.x + Math.cos(angle) * zombie.userData.wanderRadius;
                zombie.position.z = zombie.userData.centerPoint.z + Math.sin(angle) * zombie.userData.wanderRadius;

                // Face movement direction
                zombie.rotation.y = angle + Math.PI / 2;
            }
        };

        return zombie;
    }

    shoot() {
        const laser = new THREE.Mesh(this.laserGeometry, this.laserMaterial);
        
        // Position laser at rocket's position
        laser.position.copy(this.camera.position);
        
        // Set laser direction based on camera direction
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyQuaternion(this.camera.quaternion);
        laser.quaternion.copy(this.camera.quaternion);
        
        // Store direction for movement
        laser.userData = {
            direction: direction,
            speed: 200, // Laser speed
            distanceTraveled: 0,
            maxDistance: 1000 // Maximum laser travel distance
        };

        this.lasers.push(laser);
        this.scene.add(laser);
    }

    createOgre() {
        const ogre = new THREE.Group();
        
        // Create shared materials
        const ogreMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x355E3B, // Dark green
            shininess: 0
        });

        // Massive body
        const body = new THREE.Mesh(
            new THREE.CylinderGeometry(20, 30, 120),
            ogreMaterial
        );
        ogre.add(body);

        // Large head
        const head = new THREE.Mesh(
            new THREE.SphereGeometry(25),
            ogreMaterial
        );
        head.position.y = 80;
        ogre.add(head);

        // Muscular arms
        const armGeometry = new THREE.CylinderGeometry(8, 6, 80);
        [-30, 30].forEach(x => {
            const arm = new THREE.Mesh(armGeometry, ogreMaterial);
            arm.position.set(x, 40, 0);
            arm.rotation.z = x > 0 ? -Math.PI/6 : Math.PI/6;
            ogre.add(arm);
        });

        // Thick legs
        const legGeometry = new THREE.CylinderGeometry(10, 8, 60);
        [-15, 15].forEach(x => {
            const leg = new THREE.Mesh(legGeometry, ogreMaterial);
            leg.position.set(x, -60, 0);
            ogre.add(leg);
        });

        // Position ogre
        ogre.position.set(0, 60, -200); // Place behind starting position
        
        // Add animation
        ogre.userData = {
            time: 0,
            updateAnimation: (deltaTime) => {
                ogre.userData.time += deltaTime;
                
                // Stomping motion
                ogre.position.y = 60 + Math.sin(ogre.userData.time) * 5;
                
                // Arm swaying
                ogre.children.forEach((limb, i) => {
                    if (i > 1 && i < 4) { // Arms are index 2 and 3
                        limb.rotation.x = Math.sin(ogre.userData.time + i) * 0.2;
                    }
                });
            }
        };

        this.scene.add(ogre);
        this.ogre = ogre;
    }

    checkLaserCollisions() {
        // Check each laser
        for (let i = this.lasers.length - 1; i >= 0; i--) {
            const laser = this.lasers[i];
            
            // Check if laser has traveled too far
            if (laser.userData.distanceTraveled > laser.userData.maxDistance) {
                this.scene.remove(laser);
                this.lasers.splice(i, 1);
                continue;
            }

            // Check for ogre hits
            if (this.ogre) {
                const distance = laser.position.distanceTo(this.ogre.position);
                if (distance < 40) { // Large hit box for ogre
                    // Remove laser
                    this.scene.remove(laser);
                    this.lasers.splice(i, 1);
                    
                    // Damage ogre
                    this.ogreHealth--;
                    this.ogreHitTime = this.lastTime;
                    
                    // Flash red
                    this.ogre.children.forEach(part => {
                        if (part.material) {
                            part.material.color.setHex(0xff0000);
                        }
                    });
                    
                    // Check if ogre is defeated
                    if (this.ogreHealth <= 0) {
                        this.createExplosion(this.ogre.position);
                        this.scene.remove(this.ogre);
                        this.ogre = null;
                    }
                    continue;
                }
            }

            // Check for zombie hits
            for (let j = this.zombies.length - 1; j >= 0; j--) {
                const zombie = this.zombies[j];
                const distance = laser.position.distanceTo(zombie.position);
                
                if (distance < 5) {
                    this.createExplosion(zombie.position);
                    this.scene.remove(zombie);
                    this.scene.remove(laser);
                    this.zombies.splice(j, 1);
                    this.lasers.splice(i, 1);
                    break;
                }
            }
        }
    }

    createExplosion(position) {
        const particleCount = 20;
        const particles = [];
        
        for (let i = 0; i < particleCount; i++) {
            const particle = new THREE.Mesh(
                new THREE.SphereGeometry(0.5),
                new THREE.MeshPhongMaterial({ 
                    color: 0xff4400,
                    emissive: 0xff4400,
                    emissiveIntensity: 0.5
                })
            );
            
            particle.position.copy(position);
            particle.userData = {
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 20,
                    Math.random() * 15,
                    (Math.random() - 0.5) * 20
                ),
                lifetime: 1 // Seconds
            };
            
            this.scene.add(particle);
            particles.push(particle);
        }

        // Remove particles after animation
        setTimeout(() => {
            particles.forEach(particle => {
                this.scene.remove(particle);
            });
        }, 1000);

        return particles;
    }

    createBoulder(position, targetPosition) {
        const boulder = new THREE.Mesh(this.boulderGeometry, this.boulderMaterial);
        boulder.position.copy(position);
        
        // Get rocket's current position
        const rocketPosition = new THREE.Vector3();
        this.rocket.container.getWorldPosition(rocketPosition);
        
        // Calculate direct path to rocket
        const direction = rocketPosition.clone().sub(position).normalize();
        
        // Add moderate upward arc - reduced from 0.8
        direction.y += 0.4;
        direction.normalize();

        boulder.userData = {
            velocity: direction.multiplyScalar(50), // Reduced from 70
            gravity: new THREE.Vector3(0, -15, 0)  // Reduced from -20
        };

        this.boulders.push(boulder);
        this.scene.add(boulder);
    }

    updateBoulders(deltaTime) {
        // Get rocket position once for all boulder checks
        const rocketPosition = new THREE.Vector3();
        this.rocket.container.getWorldPosition(rocketPosition);

        for (let i = this.boulders.length - 1; i >= 0; i--) {
            const boulder = this.boulders[i];
            
            // Update velocity with gravity
            boulder.userData.velocity.add(boulder.userData.gravity.clone().multiplyScalar(deltaTime));
            
            // Update position
            boulder.position.add(boulder.userData.velocity.clone().multiplyScalar(deltaTime));
            
            // Add rotation for effect
            boulder.rotation.x += deltaTime * 2;
            boulder.rotation.z += deltaTime * 2;

            // Check for ground collision
            if (boulder.position.y < 0) {
                this.scene.remove(boulder);
                this.boulders.splice(i, 1);
                this.createExplosion(boulder.position);
                continue;
            }

            // Check for collision with rocket
            const distance = boulder.position.distanceTo(rocketPosition);
            if (distance < this.rocketCollisionRadius) {
                this.scene.remove(boulder);
                this.boulders.splice(i, 1);
                this.createExplosion(rocketPosition);
                
                if (!this.isGameOver) {
                    this.handleRocketHit();
                }
                continue;
            }
        }
    }

    handleRocketHit() {
        this.rocketHealth--;
        this.rocketHitTime = this.lastTime;

        // Flash rocket red
        this.rocket.container.traverse(child => {
            if (child.material) {
                child.material.color.setHex(0xff0000);
            }
        });

        if (this.rocketHealth <= 0) {
            this.gameOver();
        }
    }

    gameOver() {
        this.isGameOver = true;
        
        // Create large explosion at rocket position
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                this.createExplosion(this.camera.position, 2);
            }, i * 200);
        }

        // Show game over screen after explosion
        setTimeout(() => {
            this.gameOverScreen.style.display = 'flex';
        }, 1000);
    }

    createGameOverScreen() {
        // Create game over overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: none;
            justify-content: center;
            align-items: center;
            flex-direction: column;
            color: red;
            font-family: Arial, sans-serif;
            z-index: 1000;
        `;

        const gameOverText = document.createElement('h1');
        gameOverText.textContent = 'GAME OVER';
        gameOverText.style.fontSize = '48px';

        const restartButton = document.createElement('button');
        restartButton.textContent = 'Restart Game';
        restartButton.style.cssText = `
            padding: 15px 30px;
            font-size: 20px;
            margin-top: 20px;
            background: red;
            color: white;
            border: none;
            cursor: pointer;
            border-radius: 5px;
        `;
        restartButton.onclick = () => window.location.reload();

        overlay.appendChild(gameOverText);
        overlay.appendChild(restartButton);
        document.body.appendChild(overlay);
        this.gameOverScreen = overlay;
    }

    update(timestamp) {
        const deltaTime = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        if (this.isGameOver) {
            // Only render scene during game over
            this.renderer.render(this.scene, this.camera);
            requestAnimationFrame((t) => this.update(t));
            return;
        }

        // Update camera controls
        if (this.keys['a']) this.cameraYaw += deltaTime * 2;
        if (this.keys['d']) this.cameraYaw -= deltaTime * 2;
        if (this.keys['q']) this.cameraPitch += deltaTime * 2;
        if (this.keys['e']) this.cameraPitch -= deltaTime * 2;

        // Clamp pitch
        this.cameraPitch = Math.max(-Math.PI/3, Math.min(Math.PI/3, this.cameraPitch));

        // Apply camera rotation
        this.camera.quaternion.setFromEuler(new THREE.Euler(
            this.cameraPitch,
            this.cameraYaw,
            0,
            'YXZ'
        ));

        // Handle movement with collision detection
        if (this.keys['w'] || this.keys['s']) {
            const direction = new THREE.Vector3(0, 0, -1);
            direction.applyQuaternion(this.camera.quaternion);
            const moveSpeed = (this.keys['w'] ? 1 : -1) * this.moveSpeed * deltaTime;
            
            // Calculate new position
            const newPosition = this.camera.position.clone();
            newPosition.addScaledVector(direction, moveSpeed);

            // Check height constraints
            if (newPosition.y >= this.minHeight && newPosition.y <= this.maxHeight) {
                this.camera.position.copy(newPosition);
            } else {
                // Allow horizontal movement even when at height limits
                const horizontalMove = direction.clone();
                horizontalMove.y = 0;
                horizontalMove.normalize();
                horizontalMove.multiplyScalar(moveSpeed);
                this.camera.position.add(horizontalMove);
            }

            // Enforce minimum and maximum height
            this.camera.position.y = Math.max(this.minHeight, Math.min(this.maxHeight, this.camera.position.y));
        }

        // Update all zombie animations
        this.zombies.forEach(zombie => {
            if (zombie.userData) {
                zombie.userData.updateAnimation(deltaTime);
            }
        });

        // Update rocket
        this.rocket.update(deltaTime, this.keys, this.camera);

        // Update lasers
        this.lasers.forEach(laser => {
            const movement = laser.userData.direction.clone()
                .multiplyScalar(laser.userData.speed * deltaTime);
            laser.position.add(movement);
            laser.userData.distanceTraveled += movement.length();
        });

        // Check for laser hits
        this.checkLaserCollisions();

        // Update explosion particles
        this.scene.children.forEach(child => {
            if (child.userData && child.userData.velocity) {
                child.position.add(child.userData.velocity.clone().multiplyScalar(deltaTime));
                child.userData.velocity.y -= 20 * deltaTime; // Add gravity
                child.userData.lifetime -= deltaTime;
                if (child.userData.lifetime <= 0) {
                    this.scene.remove(child);
                }
            }
        });

        // Update ogre
        if (this.ogre) {
            this.ogre.userData.updateAnimation(deltaTime);
            
            // Reset ogre color after hit
            if (this.lastTime - this.ogreHitTime > this.ogreHitDuration * 1000) {
                this.ogre.children.forEach(part => {
                    if (part.material) {
                        part.material.color.setHex(0x355E3B);
                    }
                });
            }
        }

        // Update ogre attacks
        if (this.ogre) {
            // Check if it's time to throw a boulder
            if (timestamp - this.lastBoulderTime > this.boulderCooldown * 1000) {
                // Throw boulder at player
                const boulderStart = this.ogre.position.clone();
                boulderStart.y += 80; // Throw from ogre's head height
                this.createBoulder(boulderStart, this.camera.position);
                this.lastBoulderTime = timestamp;
            }
        }

        // Update boulder positions
        this.updateBoulders(deltaTime);

        // Reset rocket color after hit
        if (this.lastTime - this.rocketHitTime > this.rocketHitDuration * 1000) {
            this.rocket.container.traverse(child => {
                if (child.material) {
                    child.material.color.setHex(0xcccccc); // Reset to original color
                }
            });
        }

        // Render scene
        this.renderer.render(this.scene, this.camera);
        requestAnimationFrame((t) => this.update(t));
    }

    cleanup() {
        // Remove event listeners
        window.removeEventListener('resize', this.onResize);
        document.removeEventListener('keydown', this.onKeyDown);
        document.removeEventListener('keyup', this.onKeyUp);

        // Remove game over screen
        if (this.gameOverScreen) {
            this.gameOverScreen.remove();
        }

        // Dispose of geometries and materials
        this.scene.traverse(object => {
            if (object.geometry) {
                object.geometry.dispose();
            }
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(material => material.dispose());
                } else {
                    object.material.dispose();
                }
            }
        });

        // Dispose of shared geometries/materials
        this.laserGeometry.dispose();
        this.laserMaterial.dispose();
        this.boulderGeometry.dispose();
        this.boulderMaterial.dispose();

        // Dispose of renderer
        this.renderer.dispose();

        // Remove canvas
        this.renderer.domElement.remove();
    }
}

class SolarSystem {
    constructor() {
        // Set up scene
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        // Add stronger lighting
        const ambientLight = new THREE.AmbientLight(0x666666); // Brighter ambient light
        this.scene.add(ambientLight);
        
        // Add directional light for better visibility
        const dirLight = new THREE.DirectionalLight(0xffffff, 1);
        dirLight.position.set(1, 1, 1);
        this.scene.add(dirLight);

        // Initialize camera controls
        this.cameraPitch = 0;
        this.cameraYaw = 0;
        
        // Set initial camera position and rotation
        this.camera.position.set(0, 150, 300);
        this.camera.lookAt(0, 0, 0);

        // Add starfield background
        this.createStarfield();

        // Create celestial bodies with simpler details
        this.bodies = [
            new CelestialBody('Sun', 20, null, 0, 0, {
                color: 0xFFFF00,
                emissive: 0xFFFF00,
                emissiveIntensity: 0.8
            }),
            new CelestialBody('Mercury', 3.8, null, 40, 0.05, {
                color: 0x8B8B83,
                orbitColor: 0x8B4513
            }),
            new CelestialBody('Venus', 9.5, null, 65, 0.035, {
                color: 0xFAD6A5,
                orbitColor: 0xDEB887
            }),
            new CelestialBody('Earth', 10, 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_atmos_2048.jpg', 90, 0.03, {
                orbitColor: 0x4169E1
            }),
            new CelestialBody('Mars', 5.3, null, 115, 0.025, {
                color: 0xFF4500,
                orbitColor: 0xFF4500
            }),
            new CelestialBody('Jupiter', 15, null, 140, 0.015, {
                color: 0xFFA500,
                stripes: true,
                orbitColor: 0xFFA500
            }),
            new CelestialBody('Saturn', 13, null, 165, 0.01, {
                color: 0xDAA520,
                rings: true,
                ringColor: 0xC2B280,
                orbitColor: 0xDAA520
            }),
            new CelestialBody('Uranus', 11, null, 190, 0.007, {
                color: 0x40E0D0,
                orbitColor: 0x40E0D0
            }),
            new CelestialBody('Neptune', 11, null, 215, 0.005, {
                color: 0x0000CD,
                orbitColor: 0x0000CD
            })
        ];

        // Add bodies to scene
        this.bodies.forEach(body => {
            this.scene.add(body.mesh);
            if (body.orbitLine) {
                this.scene.add(body.orbitLine);
            }
        });

        // Mouse event listeners for orbit controls
        this.renderer.domElement.addEventListener('mousedown', (e) => this.onMouseDown(e));
        document.addEventListener('mousemove', (e) => this.onMouseMove(e));
        document.addEventListener('mouseup', () => this.onMouseUp());
        this.renderer.domElement.addEventListener('wheel', (e) => this.onMouseWheel(e));

        // Handle window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        // Add back keyboard controls
        this.keys = {};
        this.cameraVelocity = new THREE.Vector3();
        document.addEventListener('keydown', (e) => this.keys[e.key.toLowerCase()] = true);
        document.addEventListener('keyup', (e) => this.keys[e.key.toLowerCase()] = false);

        this.lastTime = 0;

        // Make the instance globally available (needed for text positioning)
        window.solarSystem = this;

        // Add rocket ship with adjusted initial position
        this.rocket = new RocketShip();
        this.scene.add(this.rocket.container);
        
        // Set initial camera position
        this.camera.position.set(0, 150, 300);
        
        // Add base speed and boost multiplier
        this.baseSpeed = 50;
        this.boostMultiplier = 3;
        this.moveSpeed = this.baseSpeed;

        // Create surface environments for each planet
        this.planetSurfaces = {};
        this.bodies.forEach(body => {
            if (body.name !== 'Sun') {
                this.planetSurfaces[body.name] = new PlanetSurface(body.name);
            }
        });

        // Track active scene and transitions
        this.currentScene = 'space';
        this.venusScene = null;
        this.transitionInProgress = false;
    }

    createStarfield() {
        const starsGeometry = new THREE.BufferGeometry();
        const starPositions = [];
        
        for (let i = 0; i < 10000; i++) {
            const x = (Math.random() - 0.5) * 2000;
            const y = (Math.random() - 0.5) * 2000;
            const z = (Math.random() - 0.5) * 2000;
            starPositions.push(x, y, z);
        }
        
        starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
        
        const starsMaterial = new THREE.PointsMaterial({
            color: 0xFFFFFF,
            size: 1
        });
        
        const starField = new THREE.Points(starsGeometry, starsMaterial);
        this.scene.add(starField);
    }

    onMouseDown(event) {
        this.isDragging = true;
        this.previousMousePosition = {
            x: event.clientX,
            y: event.clientY
        };
    }

    onMouseMove(event) {
        if (!this.isDragging) return;

        const deltaMove = {
            x: event.clientX - this.previousMousePosition.x,
            y: event.clientY - this.previousMousePosition.y
        };

        this.cameraRotation.x += deltaMove.y * 0.005;
        this.cameraRotation.y += deltaMove.x * 0.005;

        // Clamp vertical rotation
        this.cameraRotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, this.cameraRotation.x));

        this.previousMousePosition = {
            x: event.clientX,
            y: event.clientY
        };

        this.updateCameraPosition();
    }

    onMouseUp() {
        this.isDragging = false;
    }

    onMouseWheel(event) {
        const zoomSpeed = 0.1;
        this.cameraDistance += event.deltaY * zoomSpeed;
        this.cameraDistance = Math.max(50, Math.min(500, this.cameraDistance));
        this.updateCameraPosition();
    }

    updateCameraPosition() {
        const phi = this.cameraRotation.x;
        const theta = this.cameraRotation.y;
        
        // Calculate the camera position relative to its target
        const offset = new THREE.Vector3(
            this.cameraDistance * Math.cos(phi) * Math.sin(theta),
            this.cameraDistance * Math.sin(phi),
            this.cameraDistance * Math.cos(phi) * Math.cos(theta)
        );
        
        this.camera.position.copy(this.cameraTarget).add(offset);
        this.camera.lookAt(this.cameraTarget);
    }

    update(timestamp) {
        const deltaTime = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        if (this.currentScene === 'space') {
            // Update space scene
            this.bodies.forEach(body => body.update(deltaTime));
            this.checkPlanetProximity();
            
            // Update rocket and camera in space
            if (this.rocket) {
                this.rocket.update(deltaTime, this.keys, this.camera);
            }
            this.updateSpaceControls(deltaTime);
            
            this.renderer.render(this.scene, this.camera);
        } else if (this.currentScene === 'venus') {
            // Check if we should return to space
            if (this.camera.position.y > 200) {
                this.returnToSpace();
            } else {
                // Update Venus scene
                this.venusScene.update(timestamp);
            }
        }

        requestAnimationFrame((t) => this.update(t));
    }

    checkPlanetProximity() {
        if (this.transitionInProgress) return;

        this.bodies.forEach(body => {
            if (body.name === 'Venus') {
                const distance = this.camera.position.distanceTo(body.mesh.position);
                if (distance < body.radius * 5) {
                    this.startVenusTransition();
                }
            }
        });
    }

    startVenusTransition() {
        if (this.transitionInProgress) return;
        
        console.log('Transitioning to Venus scene...');
        this.transitionInProgress = true;

        try {
            // Create Venus scene only when needed
            if (!this.venusScene) {
                console.log('Creating Venus scene...');
                this.venusScene = new VenusScene();
            }

            // Remove rocket from space scene
            this.scene.remove(this.rocket.container);

            // Hide space scene renderer
            this.renderer.domElement.style.display = 'none';

            // Show Venus scene renderer
            this.venusScene.renderer.domElement.style.display = 'block';

            // Reset camera position and rotation for Venus scene
            this.venusScene.camera.position.set(0, 100, 0);
            this.venusScene.cameraPitch = 0;
            this.venusScene.cameraYaw = 0;
            this.venusScene.camera.quaternion.setFromEuler(new THREE.Euler(
                this.venusScene.cameraPitch,
                this.venusScene.cameraYaw,
                0,
                'YXZ'
            ));

            this.currentScene = 'venus';
            console.log('Transition complete, starting Venus scene update');
            
            // Start Venus scene update loop
            this.venusScene.update(0);

        } catch (error) {
            console.error('Error during Venus transition:', error);
        }

        this.transitionInProgress = false;
    }

    returnToSpace() {
        if (this.transitionInProgress) return;
        console.log('Returning to space...');
        this.transitionInProgress = true;

        try {
            // Hide Venus scene renderer
            if (this.venusScene) {
                this.venusScene.renderer.domElement.style.display = 'none';
            }

            // Show space scene renderer
            this.renderer.domElement.style.display = 'block';

            // Find Venus
            const venus = this.bodies.find(b => b.name === 'Venus');
            
            // Position camera above Venus
            if (venus) {
                this.camera.position.copy(venus.mesh.position);
                this.camera.position.y += venus.radius * 5;
            }

            // Reset camera rotation
            this.cameraPitch = 0;
            this.cameraYaw = 0;
            this.camera.quaternion.setFromEuler(new THREE.Euler(
                this.cameraPitch,
                this.cameraYaw,
                0,
                'YXZ'
            ));

            // Add rocket back to space scene
            this.scene.add(this.rocket.container);

            this.currentScene = 'space';
            console.log('Successfully returned to space');

        } catch (error) {
            console.error('Error returning to space:', error);
        }

        this.transitionInProgress = false;
    }

    // Add cleanup method
    cleanup() {
        this.bodies.forEach(body => {
            if (body.textMesh) {
                this.scene.remove(body.textMesh);
            }
        });
        if (this.venusScene) {
            this.venusScene.cleanup();
        }
    }

    updateSpaceControls(deltaTime) {
        // Update boost state
        this.moveSpeed = this.keys['f'] ? this.baseSpeed * this.boostMultiplier : this.baseSpeed;

        // Update camera controls
        if (this.keys['a']) this.cameraYaw += deltaTime * 2;
        if (this.keys['d']) this.cameraYaw -= deltaTime * 2;
        if (this.keys['q']) this.cameraPitch += deltaTime * 2;
        if (this.keys['e']) this.cameraPitch -= deltaTime * 2;

        // Clamp pitch
        this.cameraPitch = Math.max(-Math.PI/3, Math.min(Math.PI/3, this.cameraPitch));

        // Apply camera rotation
        this.camera.quaternion.setFromEuler(new THREE.Euler(
            this.cameraPitch,
            this.cameraYaw,
            0,
            'YXZ'
        ));

        // Handle movement
        if (this.keys['w'] || this.keys['s']) {
            const direction = new THREE.Vector3(0, 0, -1);
            direction.applyQuaternion(this.camera.quaternion);
            const moveSpeed = (this.keys['w'] ? 1 : -1) * this.moveSpeed * deltaTime;
            this.camera.position.addScaledVector(direction, moveSpeed);
        }
    }
}

// Initialize at the end of the file
window.onload = () => {
    console.log('Starting in space scene...');
    solarSystem = new SolarSystem();
    solarSystem.update(0);
}; 