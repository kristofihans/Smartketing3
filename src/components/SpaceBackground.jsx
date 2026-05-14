import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import './SpaceBackground.css';

gsap.registerPlugin(ScrollTrigger);

/* ─── Constants ──────────────────────────────────────────────── */
const ROCK_COUNT = 180;           // fewer but much larger
const DUST_COUNT = 600;           // small background dust particles
const GALAXY_PARTICLE_COUNT = 22000;
const GALAXY_ARMS = 5;
const GALAXY_RADIUS = 16;

/* ─── Create several rock geometry variants for variety ──────── */
function createRockGeometries() {
  const geometries = [];
  const colorFire = new THREE.Color('#ff3300'); // Bright flaming orange/red
  const colorLava = new THREE.Color('#990000'); // Deep red
  const colorRock = new THREE.Color('#111111'); // Charcoal

  for (let v = 0; v < 5; v++) {
    // Photorealistic detail
    const geo = new THREE.IcosahedronGeometry(1, 3);
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);

    const freq = 2.0 + Math.random();
    const amp = 0.2 + Math.random() * 0.2;

    for (let i = 0; i < pos.count; i++) {
      let nx = pos.getX(i);
      let ny = pos.getY(i);
      let nz = pos.getZ(i);

      // Procedural noise for craters and ridges
      let n = Math.sin(nx*freq) * Math.cos(ny*freq) * Math.sin(nz*freq) +
              Math.sin(nx*freq*2)*0.5 + Math.cos(ny*freq*2)*0.5;
              
      // Normalize n to roughly 0 to 1
      n = (n + 2) / 4; 
      
      // Displacement
      const len = Math.sqrt(nx*nx + ny*ny + nz*nz);
      const disp = 1 + (n - 0.5) * amp * 2;
      
      pos.setX(i, (nx / len) * disp);
      pos.setY(i, (ny / len) * disp);
      pos.setZ(i, (nz / len) * disp);

      // Color mapping: deeper parts (n is low) are hot, outer parts (n is high) are dark
      const c = new THREE.Color();
      if (n < 0.3) {
        // Deep crevices -> fire
        c.lerpColors(colorFire, colorLava, n / 0.3);
      } else {
        // Outer crust -> cool down to rock
        c.lerpColors(colorLava, colorRock, Math.min(1, (n - 0.3) / 0.4));
      }

      colors[i*3] = c.r;
      colors[i*3+1] = c.g;
      colors[i*3+2] = c.b;
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Flatten some rocks to look more like irregular asteroids
    if (v % 2 === 0) {
      const squash = 0.6 + Math.random() * 0.4;
      for (let i = 0; i < pos.count; i++) {
        pos.setY(i, pos.getY(i) * squash);
      }
    }
    geo.computeVertexNormals();
    geometries.push(geo);
  }

  return geometries;
}

/* ─── Galaxy particle positions & colors ─────────────────────── */
function createGalaxyData() {
  const positions = new Float32Array(GALAXY_PARTICLE_COUNT * 3);
  const colors = new Float32Array(GALAXY_PARTICLE_COUNT * 3);
  const sizes = new Float32Array(GALAXY_PARTICLE_COUNT);

  const coreColor = new THREE.Color('#8B0000');
  const hotColor = new THREE.Color('#cc1100');
  const edgeColor = new THREE.Color('#1a0000');
  const dustColor = new THREE.Color('#220000');

  for (let i = 0; i < GALAXY_PARTICLE_COUNT; i++) {
    const i3 = i * 3;

    const arm = i % GALAXY_ARMS;
    const armAngle = (arm / GALAXY_ARMS) * Math.PI * 2;

    const r = Math.pow(Math.random(), 0.55) * GALAXY_RADIUS;
    const spinAngle = r * 1.4;
    const scatter = (Math.random() - 0.5) * (0.8 / (r + 0.3));
    const angle = armAngle + spinAngle + scatter;

    positions[i3] = Math.cos(angle) * r + (Math.random() - 0.5) * 0.6;
    positions[i3 + 1] = (Math.random() - 0.5) * (0.3 + r * 0.06);
    positions[i3 + 2] = Math.sin(angle) * r + (Math.random() - 0.5) * 0.6;

    const t = r / GALAXY_RADIUS;
    const c = new THREE.Color();
    if (t < 0.15) {
      c.lerpColors(hotColor, coreColor, t / 0.15);
    } else {
      c.lerpColors(coreColor, edgeColor, (t - 0.15) / 0.85);
    }
    if (Math.random() < 0.12) c.lerp(dustColor, 0.5);

    colors[i3] = c.r;
    colors[i3 + 1] = c.g;
    colors[i3 + 2] = c.b;

    // Varied particle sizes — bright core, smaller at edges
    sizes[i] = (1 - t * 0.7) * (0.6 + Math.random() * 0.8);
  }

  return { positions, colors, sizes };
}

/* ─── Component ──────────────────────────────────────────────── */
const SpaceBackground = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    /* ── Renderer ───────────────────────────────────────────── */
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x050505);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    /* ── Scene & Camera ────────────────────────────────────── */
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050505, 0.008);

    const camera = new THREE.PerspectiveCamera(
      55,
      window.innerWidth / window.innerHeight,
      0.1,
      300
    );
    camera.position.set(0, 2, 40);

    /* ── Lighting — cinematic three-point setup ────────────── */
    const ambient = new THREE.AmbientLight(0x1a0a0a, 0.8);
    scene.add(ambient);

    // Key light — warm deep red from above-right
    const keyLight = new THREE.DirectionalLight(0xff2200, 3.0); // Intense flaming red
    keyLight.position.set(10, 15, 10);
    keyLight.castShadow = true;
    scene.add(keyLight);

    // Fill light — subtle cool from left
    const fillLight = new THREE.DirectionalLight(0x1a1a2e, 0.8);
    fillLight.position.set(-8, 2, 5);
    scene.add(fillLight);

    // Rim / back light — red edge highlight
    const rimLight = new THREE.DirectionalLight(0xff0000, 2.5); // Intense red rim
    rimLight.position.set(-5, -8, -15);
    scene.add(rimLight);

    // Subtle point light for depth
    const pointLight = new THREE.PointLight(0xff3300, 2.5, 100);
    pointLight.position.set(0, 0, -10);
    scene.add(pointLight);

    /* ── Space Rocks (Multiple InstancedMeshes for variety) ─── */
    const rockGeometries = createRockGeometries();

    // Multiple material variants for realism (photorealistic with vertex colors)
    const rockMaterials = [
      new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.85,
        metalness: 0.2,
        transparent: true,
        opacity: 1,
      }),
      new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.95,
        metalness: 0.1,
        transparent: true,
        opacity: 1,
      }),
      new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.8,
        metalness: 0.3,
        transparent: true,
        opacity: 1,
      }),
    ];

    const dummy = new THREE.Object3D();
    const rockData = [];
    const rockMeshes = [];

    // Distribute rocks across mesh groups
    const rocksPerGroup = Math.ceil(ROCK_COUNT / rockGeometries.length);

    for (let g = 0; g < rockGeometries.length; g++) {
      const count = Math.min(rocksPerGroup, ROCK_COUNT - g * rocksPerGroup);
      if (count <= 0) break;

      const mat = rockMaterials[g % rockMaterials.length];
      const mesh = new THREE.InstancedMesh(rockGeometries[g], mat, count);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      for (let i = 0; i < count; i++) {
        // BIGGER rocks: scale range 0.4 → 2.8 (was 0.15 → 0.65)
        const scale = 0.4 + Math.pow(Math.random(), 1.5) * 2.4;
        const x = (Math.random() - 0.5) * 70;
        const y = (Math.random() - 0.5) * 50;
        const z = -Math.random() * 100 - 15;
        const rx = Math.random() * Math.PI * 2;
        const ry = Math.random() * Math.PI * 2;
        const rz = Math.random() * Math.PI * 2;
        // Parallax: larger rocks move slower (more distant feel)
        const speed = 0.2 + Math.random() * 0.6;
        // Per-rock tumble speeds for natural rotation
        const tumbleX = (Math.random() - 0.5) * 0.3;
        const tumbleY = (Math.random() - 0.5) * 0.25;
        const tumbleZ = (Math.random() - 0.5) * 0.15;
        // Non-uniform scale for elongated asteroids
        const sx = scale * (0.7 + Math.random() * 0.6);
        const sy = scale * (0.5 + Math.random() * 0.5);
        const sz = scale * (0.7 + Math.random() * 0.6);

        dummy.position.set(x, y, z);
        dummy.rotation.set(rx, ry, rz);
        dummy.scale.set(sx, sy, sz);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);

        rockData.push({
          x, y, z, rx, ry, rz, sx, sy, sz,
          speed, tumbleX, tumbleY, tumbleZ,
          group: g, index: i,
        });
      }

      mesh.instanceMatrix.needsUpdate = true;
      scene.add(mesh);
      rockMeshes.push(mesh);
    }

    /* ── Background dust particles ─────────────────────────── */
    const dustGeo = new THREE.BufferGeometry();
    const dustPositions = new Float32Array(DUST_COUNT * 3);
    for (let i = 0; i < DUST_COUNT; i++) {
      dustPositions[i * 3] = (Math.random() - 0.5) * 120;
      dustPositions[i * 3 + 1] = (Math.random() - 0.5) * 80;
      dustPositions[i * 3 + 2] = -Math.random() * 150;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    const dustMat = new THREE.PointsMaterial({
      size: 0.12,
      color: 0x444444,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const dust = new THREE.Points(dustGeo, dustMat);
    scene.add(dust);

    /* ── Galaxy (Particle System) ──────────────────────────── */
    const galaxyData = createGalaxyData();
    const galaxyGeo = new THREE.BufferGeometry();
    galaxyGeo.setAttribute('position', new THREE.BufferAttribute(galaxyData.positions, 3));
    galaxyGeo.setAttribute('color', new THREE.BufferAttribute(galaxyData.colors, 3));

    const galaxyMat = new THREE.PointsMaterial({
      size: 0.1,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const galaxy = new THREE.Points(galaxyGeo, galaxyMat);
    galaxy.rotation.x = Math.PI * 0.35;
    galaxy.position.set(0, -2, -8);
    scene.add(galaxy);

    /* ── Post-processing (Bloom) ───────────────────────────── */
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.0,
      0.6,
      0.8
    );
    composer.addPass(bloomPass);

    /* ── Animation state (driven by scroll) ────────────────── */
    const animState = { progress: 0 };

    /* ── Render loop ───────────────────────────────────────── */
    let frameId;
    const clock = new THREE.Clock();

    const render = () => {
      frameId = requestAnimationFrame(render);
      const elapsed = clock.getElapsedTime();
      const p = animState.progress;

      // --- Phase mapping ---
      // p 0.0 → 0.5: rocks fly toward camera with tumble
      // p 0.35 → 0.65: rocks dissolve out
      // p 0.45 → 1.0: galaxy fades in and rotates

      const rockFlyProgress = Math.min(1, p / 0.5);
      const rockOpacity = p < 0.35 ? 1 : Math.max(0, 1 - (p - 0.35) / 0.3);
      const galaxyOpacity = p < 0.4 ? 0 : Math.min(1, (p - 0.4) / 0.25);
      const bloomStrength = galaxyOpacity * 1.8;

      // Dust opacity — visible during rock phase, fades with them
      dustMat.opacity = rockOpacity * 0.5;
      dust.visible = rockOpacity > 0.01;

      // Update rocks per group
      let dataIdx = 0;
      for (let g = 0; g < rockMeshes.length; g++) {
        const mesh = rockMeshes[g];
        const mat = mesh.material;
        mat.opacity = rockOpacity;

        const count = mesh.count;
        for (let i = 0; i < count; i++) {
          const d = rockData[dataIdx++];

          // Fly toward camera with parallax
          const zOffset = rockFlyProgress * d.speed * 60;

          // Natural tumbling rotation — each rock has its own axis speeds
          const rotX = d.rx + elapsed * d.tumbleX;
          const rotY = d.ry + elapsed * d.tumbleY;
          const rotZ = d.rz + elapsed * d.tumbleZ;

          // Subtle lateral drift as rocks approach
          const lateralDrift = Math.sin(elapsed * 0.3 + d.x) * 0.5 * rockFlyProgress;

          dummy.position.set(
            d.x + lateralDrift,
            d.y + Math.sin(elapsed * 0.2 + d.y) * 0.3,
            d.z + zOffset
          );
          dummy.rotation.set(rotX, rotY, rotZ);

          // Slight scale pulse as they get close
          const proximity = Math.max(0, 1 - Math.abs(d.z + zOffset) / 40);
          const scaleMul = 1 + proximity * 0.15;
          dummy.scale.set(d.sx * scaleMul, d.sy * scaleMul, d.sz * scaleMul);
          dummy.updateMatrix();
          mesh.setMatrixAt(i, dummy.matrix);
        }
        mesh.instanceMatrix.needsUpdate = true;
        mesh.visible = rockOpacity > 0.01;
      }

      // Update galaxy
      galaxyMat.opacity = galaxyOpacity;
      galaxy.rotation.y = elapsed * 0.04 + p * Math.PI * 0.6;
      galaxy.visible = galaxyOpacity > 0.01;

      // Bloom
      bloomPass.strength = bloomStrength;

      // Camera — subtle cinematic sway
      camera.position.x = Math.sin(elapsed * 0.07) * 1.0;
      camera.position.y = 2 + Math.cos(elapsed * 0.05) * 0.6;
      camera.position.z = 40 - p * 8; // slow dolly forward
      camera.lookAt(0, 0, -5);

      // Dynamic fog
      scene.fog.density = 0.008 + rockOpacity * 0.004 - galaxyOpacity * 0.004;

      // Move point light with scroll for shifting shadows
      pointLight.position.x = Math.sin(elapsed * 0.15) * 8;
      pointLight.position.z = -10 + p * 5;

      composer.render();
    };

    render();

    /* ── GSAP ScrollTrigger ────────────────────────────────── */
    const scrollTarget = document.querySelector('.app__content') || document.body;
    const trigger = ScrollTrigger.create({
      trigger: scrollTarget,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1,
      onUpdate: (self) => {
        animState.progress = self.progress;
      },
    });

    /* ── Resize handler ────────────────────────────────────── */
    const onResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      composer.setSize(w, h);
      bloomPass.resolution.set(w, h);
    };
    window.addEventListener('resize', onResize);

    /* ── Cleanup ───────────────────────────────────────────── */
    return () => {
      cancelAnimationFrame(frameId);
      trigger.kill();
      window.removeEventListener('resize', onResize);
      rockGeometries.forEach(g => g.dispose());
      rockMaterials.forEach(m => m.dispose());
      dustGeo.dispose();
      dustMat.dispose();
      galaxyGeo.dispose();
      galaxyMat.dispose();
      renderer.dispose();
      composer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div className="space-background" ref={mountRef} />;
};

export default SpaceBackground;
