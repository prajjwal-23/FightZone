"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { AudioListener, Audio, AudioLoader } from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
// import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import useInput from "./useInput";

export default function Scene3D({
  onP1Hit,
  onP2Hit,
  onWin,
  enabled, // if false, stop loop (when winner shown)
  resetToken, // changing this remounts/refreshes scene
  onBgmReady ,
}) {
  const mountRef = useRef(null);
  const keys = useInput();
  let p1HitTimer = 0;
  let p2HitTimer = 0;
  let knockback1 = { x: 0, z: 0 };
  let knockback2 = { x: 0, z: 0 };

  useEffect(() => {
    if (!mountRef.current) return;

    
    // --- Core ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x222222);

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 5, 12);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);

    // --- OrbitControls (mouse rotate/zoom/pan) ---
    // const controls = new OrbitControls(camera, renderer.domElement);
    // controls.enableDamping = true;
    // controls.enablePan = true;
    // controls.minDistance = 5;
    // controls.maxDistance = 30;
    // controls.target.set(0, 1, 0);

    // --- Lights ---
    const hemi = new THREE.HemisphereLight(0xffffff, 0x222233, 0.6);
    scene.add(hemi);
    const dir = new THREE.DirectionalLight(0xffffff, 1);
    dir.position.set(10, 15, 10);
    dir.castShadow = false;
    scene.add(dir);

    // --- Ground with Texture ---
    const floorTex = new THREE.TextureLoader().load("/floor-texture.jpg");
    floorTex.wrapS = THREE.RepeatWrapping;
    floorTex.wrapT = THREE.RepeatWrapping;
    floorTex.repeat.set(4, 4);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 40),
      new THREE.MeshStandardMaterial({ map: floorTex })
    );
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    // --- Crowd Dummies ---
    const dummyMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });

    for (let i = -18; i <= 18; i += 6) {
      for (let j = -18; j <= 18; j += 6) {
        if (Math.abs(i) === 18 || Math.abs(j) === 18) {
          // body
          const body = new THREE.Mesh(
            new THREE.CylinderGeometry(0.3, 0.3, 1.5),
            dummyMat
          );
          body.position.set(i, 0.75, j);
          scene.add(body);

          // head
          const head = new THREE.Mesh(
            new THREE.SphereGeometry(0.4, 16, 16),
            dummyMat
          );
          head.position.set(i, 1.8, j);
          scene.add(head);
        }
      }
    }

    // --- Arena Walls (simple boxes around) ---
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x222222,
      metalness: 0.3,
      roughness: 0.7,
    });
    const wallHeight = 3;
    const wallThickness = 0.5;

    const wall1 = new THREE.Mesh(
      new THREE.BoxGeometry(40, wallHeight, wallThickness),
      wallMat
    );
    wall1.position.set(0, wallHeight / 2, -20);
    scene.add(wall1);

    const wall2 = wall1.clone();
    wall2.position.set(0, wallHeight / 2, 20);
    scene.add(wall2);

    const wall3 = new THREE.Mesh(
      new THREE.BoxGeometry(wallThickness, wallHeight, 40),
      wallMat
    );
    wall3.position.set(-20, wallHeight / 2, 0);
    scene.add(wall3);

    const wall4 = wall3.clone();
    wall4.position.set(20, wallHeight / 2, 0);
    scene.add(wall4);

    // --- Basic Ambient Light (fills shadows) ---
    const ambient = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambient);

    // --- Directional Light (like the sun) ---
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // --- Stadium Spotlights ---
    const spot1 = new THREE.SpotLight(0xff4444, 2, 100, Math.PI / 5, 0.3);
    spot1.position.set(-15, 20, 10);
    spot1.target.position.set(0, 0, 0);
    scene.add(spot1, spot1.target);

    const spot2 = new THREE.SpotLight(0x44aaff, 2, 100, Math.PI / 5, 0.3);
    spot2.position.set(15, 20, -10);
    spot2.target.position.set(0, 0, 0);
    scene.add(spot2, spot2.target);

    // --- Overhead White Light ---
    const overhead = new THREE.PointLight(0xffffff, 1.2, 150);
    overhead.position.set(0, 15, 0);
    scene.add(overhead);

    // --- Arena Logo / Banner ---
    const bannerTexture = new THREE.TextureLoader().load("/arena-logo.png"); // put in public/
    const banner = new THREE.Mesh(
      new THREE.PlaneGeometry(12, 4),
      new THREE.MeshBasicMaterial({ map: bannerTexture, transparent: true })
    );
    banner.position.set(0, 6, -19.8); // stick on back wall
    scene.add(banner);

    // --- Audio Setup ---
    const listener = new AudioListener();
    camera.add(listener);

    const audioLoader = new AudioLoader();

    // Punch sound
    const punchSound = new Audio(listener);
    audioLoader.load("/sounds/punch.mp3", (buffer) => {
      punchSound.setBuffer(buffer);
      punchSound.setVolume(0.6);
    });

    // Background music
    const bgm = new Audio(listener);
    audioLoader.load("/sounds/bgm.mp3", (buffer) => {
      bgm.setBuffer(buffer);
      bgm.setLoop(true);
      bgm.setVolume(0.06);
      bgm.play();
      // expose bgm control to parent
      if (onBgmReady) onBgmReady(bgm);
    });



    // --- Fighters ---
    const loader = new FBXLoader();
    let player1 = null;
    let player2 = null;
    let mixer1 = null;
    let mixer2 = null;

    // physics: vertical motion
    const g = -0.009; // gravity per frame
    const jumpV = 0.22; // initial jump velocity
    let vy1 = 0,
      vy2 = 0; // vertical velocities
    let y1 = 0,
      y2 = 0; // vertical positions (offsets)
    let crouch1 = false,
      crouch2 = false;

    // movement speeds
    const speedWalk = 0.06;
    const speedCrouch = 0.03;

    // attack timing (no cooldown yet; can add later)
    const attackRange = 2.0;

    // Load P1
    loader.load("/models/fighter1.fbx", (fbx) => {
      player1 = fbx;
      player1.scale.set(0.01, 0.01, 0.01);
      player1.position.set(-4, 0, 0);
      scene.add(player1);

      mixer1 = new THREE.AnimationMixer(player1);
      if (fbx.animations?.length) {
        const action = mixer1.clipAction(fbx.animations[0]);
        action.play(); // current animation only
      }
    });

    // Load P2
    loader.load("/models/fighter2.fbx", (fbx) => {
      player2 = fbx;
      player2.scale.set(0.01, 0.01, 0.01);
      player2.position.set(4, 0, 0);
      scene.add(player2);

      mixer2 = new THREE.AnimationMixer(player2);
      if (fbx.animations?.length) {
        const action = mixer2.clipAction(fbx.animations[0]);
        action.play();
      }
    });

    // --- Helpers ---
    const clock = new THREE.Clock();

    function grounded(y) {
      return y <= 0.0001;
    }

    function stepPhysics() {
      // P1 jump
      if (player1) {
        if (keys.current["w"] && grounded(y1)) vy1 = jumpV;
        // crouch only when grounded
        crouch1 = !!keys.current["s"] && grounded(y1);
      }
      // P2 jump
      if (player2) {
        if (keys.current["ArrowUp"] && grounded(y2)) vy2 = jumpV;
        crouch2 = !!keys.current["ArrowDown"] && grounded(y2);
      }

      // integrate velocities
      vy1 += g;
      vy2 += g;
      y1 = Math.max(0, y1 + vy1);
      y2 = Math.max(0, y2 + vy2);

      if (grounded(y1)) vy1 = 0;
      if (grounded(y2)) vy2 = 0;

      if (player1) player1.position.y = y1 + (crouch1 ? -0.3 : 0);
      if (player2) player2.position.y = y2 + (crouch2 ? -0.3 : 0);
    }

    // --- Arena Bounce Effect ---
    function enforceArenaBounds(player) {
      if (!player) return;

      const arenaLimit = 18;
      const bounce = 0.3; // how much to push back

      if (player.position.x < -arenaLimit)
        player.position.x = -arenaLimit + bounce;
      if (player.position.x > arenaLimit)
        player.position.x = arenaLimit - bounce;
      if (player.position.z < -arenaLimit)
        player.position.z = -arenaLimit + bounce;
      if (player.position.z > arenaLimit)
        player.position.z = arenaLimit - bounce;
    }

    function stepMovement() {
      if (player1) {
        const s1 = crouch1 ? speedCrouch : speedWalk;

        // X movement
        if (keys.current["a"]) player1.position.x -= s1;
        if (keys.current["d"]) player1.position.x += s1;

        // Z movement (forward/back)
        if (keys.current["w"]) player1.position.z -= s1;
        if (keys.current["s"]) player1.position.z += s1;

        // ✅ Apply knockback for Player 1
        player1.position.x += knockback1.x;
        player1.position.z += knockback1.z;
        knockback1.x *= 0.85;
        knockback1.z *= 0.85;
        if (Math.abs(knockback1.x) < 0.01) knockback1.x = 0;
        if (Math.abs(knockback1.z) < 0.01) knockback1.z = 0;
      }

      if (player2) {
        const s2 = crouch2 ? speedCrouch : speedWalk;

        if (keys.current["ArrowLeft"]) player2.position.x -= s2;
        if (keys.current["ArrowRight"]) player2.position.x += s2;
        if (keys.current["ArrowUp"]) player2.position.z -= s2;
        if (keys.current["ArrowDown"]) player2.position.z += s2;

        // ✅ Apply knockback for Player 2
        player2.position.x += knockback2.x;
        player2.position.z += knockback2.z;
        knockback2.x *= 0.85;
        knockback2.z *= 0.85;
        if (Math.abs(knockback2.x) < 0.01) knockback2.x = 0;
        if (Math.abs(knockback2.z) < 0.01) knockback2.z = 0;
      }
    }

    function stepCombat() {
      if (!player1 || !player2) return;
      const dist = player1.position.distanceTo(player2.position);

      if (dist <= attackRange) {
        // Calculate direction vector between players
        const dx = player2.position.x - player1.position.x;
        const dz = player2.position.z - player1.position.z;
        const len = Math.sqrt(dx * dx + dz * dz) || 1; // avoid division by zero

        // Player 1 attacks
        if (keys.current[" "]) {
          onP2Hit?.();
          p2HitTimer = 10;
          knockback2.x = (dx / len) * 0.3;
          knockback2.z = (dz / len) * 0.3;
          if (punchSound.isPlaying) punchSound.stop();
          punchSound.play();
        }
        // Player 2 attacks
        if (keys.current["Enter"]) {
          onP1Hit?.();
          p1HitTimer = 10;
          // Reuse the same dx/dz but reverse direction for player 1
          knockback1.x = (-dx / len) * 0.3;
          knockback1.z = (-dz / len) * 0.3;
          if (punchSound.isPlaying) punchSound.stop();
          punchSound.play();
        }
      }
    }

    let rafId = null;
    const animate = () => {
      if (!enabled) return; // stop when winner shown
      rafId = requestAnimationFrame(animate);

      const dt = clock.getDelta();
      mixer1?.update(dt);
      mixer2?.update(dt);

      stepPhysics();
      stepMovement();
      stepCombat(); // make sure combat still runs!

      // --- Arena Bounce ---
      enforceArenaBounds(player1);
      enforceArenaBounds(player2);

      // --- Hit flash effect ---
      if (p1HitTimer > 0 && player1) {
        player1.traverse((child) => {
          if (child.isMesh) child.material.color.set(0xff0000);
        });
        p1HitTimer--;
      } else if (player1) {
        player1.traverse((child) => {
          if (child.isMesh) child.material.color.set(0xffffff);
        });
      }

      if (p2HitTimer > 0 && player2) {
        player2.traverse((child) => {
          if (child.isMesh) child.material.color.set(0xff0000);
        });
        p2HitTimer--;
      } else if (player2) {
        player2.traverse((child) => {
          if (child.isMesh) child.material.color.set(0xffffff);
        });
      }

      //   controls.update();
      if (player1 && player2) {
        // Midpoint between fighters
        const midX = (player1.position.x + player2.position.x) / 2;
        const midZ = (player1.position.z + player2.position.z) / 2;
        const midY = (player1.position.y + player2.position.y) / 2;

        const center = new THREE.Vector3(midX, midY + 1, midZ);

        // Distance between fighters
        const dist = player1.position.distanceTo(player2.position);

        // Camera distance based on how far fighters are
        const camDistance = Math.max(12, dist * 1.2); // zooms out when far apart

        // Camera position (slightly behind & above midpoint)
        camera.position.lerp(
          new THREE.Vector3(midX, 6, midZ + camDistance),
          0.1 // smoothing factor
        );

        camera.lookAt(center);
      }

      renderer.render(scene, camera);
    };

    stepCombat();
    animate();

    // Resize
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", onResize);
      if (rafId) cancelAnimationFrame(rafId);
      renderer.dispose();
      mountRef.current?.removeChild(renderer.domElement);
    };
  }, [enabled, resetToken]); // re-init when restarting

  return <div ref={mountRef} style={{ width: "100%", height: "100%" }} />;
}
