"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";


export default function FightingGame() {
  const mountRef = useRef(null);

  const [p1Health, setP1Health] = useState(100);
  const [p2Health, setP2Health] = useState(100);
  const [winner, setWinner] = useState(null);


  useEffect(() => {
    if (!mountRef.current) return;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x222222);

    // Camera
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 5, 12);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.appendChild(renderer.domElement);

    // ✅ OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = true;
    controls.minDistance = 5;
    controls.maxDistance = 30;
    controls.target.set(0, 1, 0);

    // Ground
    const groundGeo = new THREE.PlaneGeometry(30, 30);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    // Lights
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(10, 15, 10);
    scene.add(light);

    // Players
    let mixer1 = null;
    let mixer2 = null;
    let player1 = null;
    let player2 = null;

    const loader = new FBXLoader();

    // Load Player 1
    loader.load("/models/fighter1.fbx", (fbx) => {
      player1 = fbx;
      player1.scale.set(0.01, 0.01, 0.01); // scale down FBX
      player1.position.set(-4, 0, 0);
      scene.add(player1);

      mixer1 = new THREE.AnimationMixer(player1);
      if (fbx.animations && fbx.animations.length > 0) {
        const action = mixer1.clipAction(fbx.animations[0]);
        action.play(); // use the first animation available
      }
    });

    // Load Player 2
    loader.load("/models/fighter2.fbx", (fbx) => {
      player2 = fbx;
      player2.scale.set(0.01, 0.01, 0.01);
      player2.position.set(4, 0, 0);
      scene.add(player2);

      mixer2 = new THREE.AnimationMixer(player2);
      if (fbx.animations && fbx.animations.length > 0) {
        const action = mixer2.clipAction(fbx.animations[0]);
        action.play();
      }
    });

    // Controls
    const keys = {};
    window.addEventListener("keydown", (e) => (keys[e.key] = true));
    window.addEventListener("keyup", (e) => (keys[e.key] = false));

    // Clock
    const clock = new THREE.Clock();

    const checkCollision = () => {
      if (!player1 || !player2) return;
      const dist = player1.position.distanceTo(player2.position);
      if (dist < 2) {
        if (keys[" "]) setP2Health((h) => Math.max(0, h - 1));
        if (keys["Enter"]) setP1Health((h) => Math.max(0, h - 1));
      }
    };

    const animate = () => {
      if (winner) return;
      requestAnimationFrame(animate);

      const delta = clock.getDelta();
      if (mixer1) mixer1.update(delta);
      if (mixer2) mixer2.update(delta);

      // Player movement
      if (player1) {
        if (keys["a"]) player1.position.x -= 0.05;
        if (keys["d"]) player1.position.x += 0.05;
      }
      if (player2) {
        if (keys["ArrowLeft"]) player2.position.x -= 0.05;
        if (keys["ArrowRight"]) player2.position.x += 0.05;
      }

      checkCollision();
      // ✅ Update controls
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, [winner]);

  // Winner
  useEffect(() => {
    if (p1Health <= 0 && !winner) setWinner("Player 2 Wins!");
    if (p2Health <= 0 && !winner) setWinner("Player 1 Wins!");
  }, [p1Health, p2Health, winner]);

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh" }}>
      <div ref={mountRef} style={{ width: "100%", height: "100%" }} />

      {/* HUD */}
      <div
        style={{
          position: "absolute",
          top: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "80%",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <div style={{ flex: 1, marginRight: "10px" }}>
          <div
            style={{
              height: "20px",
              background: "red",
              width: `${p1Health}%`,
              transition: "width 0.2s",
            }}
          />
        </div>
        <div style={{ flex: 1, marginLeft: "10px" }}>
          <div
            style={{
              height: "20px",
              background: "green",
              width: `${p2Health}%`,
              transition: "width 0.2s",
            }}
          />
        </div>
      </div>

      {winner && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "rgba(0,0,0,0.7)",
            color: "white",
            padding: "20px 40px",
            borderRadius: "10px",
            fontSize: "2rem",
          }}
        >
          {winner}
        </div>
      )}
    </div>
  );
}
