import * as THREE from 'three';
import { CHARACTER } from '@shared/constants';
import type { RobotConfig, AccessoryType } from '@shared/types';
import {
  createBodyMaterial,
  createChromeMaterial,
  createScreenMaterial,
  createEyeMaterial,
  createAccessoryMaterial,
} from './RobotMaterials';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Apply castShadow + receiveShadow to a mesh and return it. */
function shadow<T extends THREE.Mesh>(mesh: T): T {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/** Shorthand to create a shadowed mesh and add it to a group. */
function addMesh(
  group: THREE.Group,
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  position?: THREE.Vector3Tuple,
  name?: string,
): THREE.Mesh {
  const mesh = shadow(new THREE.Mesh(geometry, material));
  if (position) mesh.position.set(position[0], position[1], position[2]);
  if (name) mesh.name = name;
  group.add(mesh);
  return mesh;
}

// ---------------------------------------------------------------------------
// Body shape multipliers
// ---------------------------------------------------------------------------

interface ShapeScale { wX: number; hY: number; dZ: number }

function bodyShapeScale(config: RobotConfig): ShapeScale {
  switch (config.bodyShape) {
    case 'stocky':  return { wX: 1.2, hY: 0.85, dZ: 1.0 };
    case 'slim':    return { wX: 0.85, hY: 1.1, dZ: 1.0 };
    case 'round':   return { wX: 1.1, hY: 1.1, dZ: 1.1 };
    case 'tall':    return { wX: 0.9, hY: 1.3, dZ: 1.0 };
    default:        return { wX: 1.0, hY: 1.0, dZ: 1.0 };
  }
}

function headShapeScale(config: RobotConfig): ShapeScale {
  switch (config.headShape) {
    case 'wide':    return { wX: 1.3, hY: 1.0, dZ: 1.0 };
    default:        return { wX: 1.0, hY: 1.0, dZ: 1.0 };
  }
}

// ---------------------------------------------------------------------------
// createBody
// ---------------------------------------------------------------------------

export function createBody(config: RobotConfig): THREE.Group {
  const group = new THREE.Group();
  group.name = 'body';

  const s = bodyShapeScale(config);
  const bw = CHARACTER.BODY_WIDTH * s.wX;
  const bh = CHARACTER.BODY_HEIGHT * s.hY;
  const bd = CHARACTER.BODY_DEPTH * s.dZ;

  const bodyMat = createBodyMaterial(config.bodyColor);
  const accentMat = createBodyMaterial(config.accentColor);
  const chromeMat = createChromeMaterial();

  // Main torso
  addMesh(group, new THREE.BoxGeometry(bw, bh, bd), bodyMat, [0, 0, 0], 'body_torso');

  // Chest panel (inset darker rectangle)
  const panelW = bw * 0.6;
  const panelH = bh * 0.5;
  const panelMat = createBodyMaterial(
    '#' + new THREE.Color(config.bodyColor).multiplyScalar(0.65).getHexString(),
  );
  // Prefix with # for the color string used in material (already created above via Color multiply)
  addMesh(
    group,
    new THREE.BoxGeometry(panelW, panelH, 0.02),
    panelMat,
    [0, 0.02, bd / 2 + 0.011],
    'body_chest_panel',
  );

  // Buttons (3 small cylinders on chest panel)
  const buttonGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.015, 8);
  for (let i = 0; i < 3; i++) {
    const bx = -panelW * 0.25 + i * panelW * 0.25;
    const mesh = shadow(new THREE.Mesh(buttonGeo, accentMat));
    mesh.rotation.x = Math.PI / 2;
    mesh.position.set(bx, panelH * 0.3, bd / 2 + 0.025);
    mesh.name = `body_button_${i}`;
    group.add(mesh);
  }

  // Dials (2 small cylinders below buttons)
  const dialGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.012, 12);
  for (let i = 0; i < 2; i++) {
    const dx = -panelW * 0.15 + i * panelW * 0.3;
    const mesh = shadow(new THREE.Mesh(dialGeo, chromeMat));
    mesh.rotation.x = Math.PI / 2;
    mesh.position.set(dx, -panelH * 0.15, bd / 2 + 0.025);
    mesh.name = `body_dial_${i}`;
    group.add(mesh);
  }

  // Side vent grooves (left + right)
  const ventGeo = new THREE.BoxGeometry(0.015, bh * 0.08, bd * 0.4);
  const ventMat = createBodyMaterial('#222222');
  for (const side of [-1, 1]) {
    for (let v = 0; v < 3; v++) {
      const vy = bh * 0.15 - v * bh * 0.12;
      addMesh(
        group,
        ventGeo,
        ventMat,
        [side * (bw / 2 + 0.005), vy, 0],
        `body_vent_${side > 0 ? 'r' : 'l'}_${v}`,
      );
    }
  }

  return group;
}

// ---------------------------------------------------------------------------
// createHead
// ---------------------------------------------------------------------------

export function createHead(config: RobotConfig): THREE.Group {
  const group = new THREE.Group();
  group.name = 'head';

  const hs = headShapeScale(config);
  const hw = CHARACTER.HEAD_WIDTH * hs.wX;
  const hh = CHARACTER.HEAD_HEIGHT * hs.hY;
  const hd = CHARACTER.HEAD_DEPTH * hs.dZ;

  const headMat = createBodyMaterial(config.bodyColor);

  switch (config.headShape) {
    case 'cylinder': {
      const radius = Math.max(hw, hd) / 2;
      addMesh(group, new THREE.CylinderGeometry(radius, radius, hh, 16), headMat, [0, 0, 0], 'head_shell');
      break;
    }
    case 'dome': {
      // Box base + hemisphere on top
      addMesh(group, new THREE.BoxGeometry(hw, hh * 0.6, hd), headMat, [0, -hh * 0.2, 0], 'head_base');
      const domeRadius = hw / 2;
      const dome = shadow(
        new THREE.Mesh(new THREE.SphereGeometry(domeRadius, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), headMat),
      );
      dome.position.set(0, hh * 0.1, 0);
      dome.name = 'head_dome';
      group.add(dome);
      break;
    }
    case 'rounded_box': {
      // Slightly beveled look: main box + 4 edge overlay strips
      addMesh(group, new THREE.BoxGeometry(hw, hh, hd), headMat, [0, 0, 0], 'head_shell');
      const bevelGeo = new THREE.CylinderGeometry(0.02, 0.02, hh, 6);
      const corners: [number, number][] = [
        [-hw / 2, -hd / 2], [hw / 2, -hd / 2],
        [-hw / 2, hd / 2], [hw / 2, hd / 2],
      ];
      corners.forEach(([cx, cz], i) => {
        addMesh(group, bevelGeo, headMat, [cx, 0, cz], `head_bevel_${i}`);
      });
      break;
    }
    case 'wide':
    case 'box':
    default: {
      addMesh(group, new THREE.BoxGeometry(hw, hh, hd), headMat, [0, 0, 0], 'head_shell');
      break;
    }
  }

  // Antenna mount point (invisible marker for accessory attachment)
  const mount = new THREE.Object3D();
  mount.name = 'antenna_mount';
  mount.position.set(0, hh / 2, 0);
  group.add(mount);

  return group;
}

// ---------------------------------------------------------------------------
// createScreen
// ---------------------------------------------------------------------------

export function createScreen(config: RobotConfig): THREE.Group {
  const group = new THREE.Group();
  group.name = 'screen';

  const sw = CHARACTER.SCREEN_WIDTH;
  const sh = CHARACTER.SCREEN_HEIGHT;

  // Screen bezel (darker border frame)
  const bezelW = sw + 0.04;
  const bezelH = sh + 0.04;
  const bezelMat = createBodyMaterial('#1A1A1A');
  addMesh(group, new THREE.BoxGeometry(bezelW, bezelH, 0.01), bezelMat, [0, 0, -0.005], 'screen_bezel');

  // Main screen plane
  const screenMat = createScreenMaterial(config.screenColor);
  addMesh(group, new THREE.PlaneGeometry(sw, sh), screenMat, [0, 0, 0.001], 'screen_face');

  // Scanline overlay (semi-transparent striped plane)
  const scanlineCanvas = document.createElement('canvas');
  scanlineCanvas.width = 4;
  scanlineCanvas.height = 64;
  const ctx = scanlineCanvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = 'rgba(0,0,0,0)';
    ctx.fillRect(0, 0, 4, 64);
    for (let y = 0; y < 64; y += 4) {
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.fillRect(0, y, 4, 2);
    }
  }
  const scanlineTex = new THREE.CanvasTexture(scanlineCanvas);
  scanlineTex.wrapS = THREE.RepeatWrapping;
  scanlineTex.wrapT = THREE.RepeatWrapping;
  scanlineTex.repeat.set(1, 4);
  const scanlineMat = new THREE.MeshBasicMaterial({
    map: scanlineTex,
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
  });
  addMesh(group, new THREE.PlaneGeometry(sw, sh), scanlineMat, [0, 0, 0.002], 'screen_scanlines');

  return group;
}

// ---------------------------------------------------------------------------
// createEyes
// ---------------------------------------------------------------------------

export function createEyes(config: RobotConfig): THREE.Group {
  const group = new THREE.Group();
  group.name = 'eyes';

  const eyeMat = createEyeMaterial(config.eyeColor);
  const eyeRadius = 0.04;
  const spacing = 0.09;
  const offsetY = 0.02;

  // Use CircleGeometry for flat emissive eye discs
  const eyeGeo = new THREE.CircleGeometry(eyeRadius, 16);

  const leftEye = shadow(new THREE.Mesh(eyeGeo, eyeMat));
  leftEye.name = 'eye_left';
  leftEye.position.set(-spacing, offsetY, 0.003);
  group.add(leftEye);

  const rightEye = shadow(new THREE.Mesh(eyeGeo, eyeMat));
  rightEye.name = 'eye_right';
  rightEye.position.set(spacing, offsetY, 0.003);
  group.add(rightEye);

  return group;
}

// ---------------------------------------------------------------------------
// createArm
// ---------------------------------------------------------------------------

export function createArm(config: RobotConfig, side: 'left' | 'right'): THREE.Group {
  const group = new THREE.Group();
  group.name = side === 'left' ? 'arm_left' : 'arm_right';

  const r = CHARACTER.ARM_RADIUS;
  const totalLen = CHARACTER.ARM_LENGTH;
  const upperLen = totalLen * 0.5;
  const foreLen = totalLen * 0.5;
  const jointR = r * 1.3;

  const bodyMat = createBodyMaterial(config.accentColor);
  const chromeMat = createChromeMaterial();

  // Shoulder joint sphere
  addMesh(group, new THREE.SphereGeometry(jointR, 10, 10), chromeMat, [0, 0, 0], `${group.name}_shoulder`);

  // Upper arm
  addMesh(
    group,
    new THREE.CylinderGeometry(r, r, upperLen, 8),
    bodyMat,
    [0, -upperLen / 2, 0],
    `${group.name}_upper`,
  );

  // Elbow joint sphere
  addMesh(
    group,
    new THREE.SphereGeometry(jointR * 0.9, 8, 8),
    chromeMat,
    [0, -upperLen, 0],
    `${group.name}_elbow`,
  );

  // Forearm
  addMesh(
    group,
    new THREE.CylinderGeometry(r * 0.9, r * 0.85, foreLen, 8),
    bodyMat,
    [0, -upperLen - foreLen / 2, 0],
    `${group.name}_forearm`,
  );

  // Hand (small box)
  addMesh(
    group,
    new THREE.BoxGeometry(0.06, 0.05, 0.06),
    bodyMat,
    [0, -upperLen - foreLen - 0.025, 0],
    `${group.name}_hand`,
  );

  return group;
}

// ---------------------------------------------------------------------------
// createLeg
// ---------------------------------------------------------------------------

export function createLeg(config: RobotConfig, side: 'left' | 'right'): THREE.Group {
  const group = new THREE.Group();
  group.name = side === 'left' ? 'leg_left' : 'leg_right';

  const r = CHARACTER.LEG_RADIUS;
  const totalLen = CHARACTER.LEG_LENGTH;
  const upperLen = totalLen * 0.5;
  const lowerLen = totalLen * 0.5;
  const jointR = r * 1.2;

  const bodyMat = createBodyMaterial(config.accentColor);
  const chromeMat = createChromeMaterial();

  // Hip joint
  addMesh(group, new THREE.SphereGeometry(jointR, 8, 8), chromeMat, [0, 0, 0], `${group.name}_hip`);

  // Upper leg
  addMesh(
    group,
    new THREE.CylinderGeometry(r, r, upperLen, 8),
    bodyMat,
    [0, -upperLen / 2, 0],
    `${group.name}_upper`,
  );

  // Knee joint
  addMesh(
    group,
    new THREE.SphereGeometry(jointR * 0.85, 8, 8),
    chromeMat,
    [0, -upperLen, 0],
    `${group.name}_knee`,
  );

  // Lower leg
  addMesh(
    group,
    new THREE.CylinderGeometry(r * 0.9, r * 0.85, lowerLen, 8),
    bodyMat,
    [0, -upperLen - lowerLen / 2, 0],
    `${group.name}_lower`,
  );

  // Foot (box)
  addMesh(
    group,
    new THREE.BoxGeometry(0.1, 0.04, 0.12),
    bodyMat,
    [0, -upperLen - lowerLen - 0.02, 0.02],
    `${group.name}_foot`,
  );

  return group;
}

// ---------------------------------------------------------------------------
// createAccessory
// ---------------------------------------------------------------------------

export function createAccessory(type: AccessoryType, config: RobotConfig): THREE.Group {
  const group = new THREE.Group();
  group.name = `accessory_${type}`;

  const chromeMat = createChromeMaterial();
  const accentMat = createBodyMaterial(config.accentColor);

  switch (type) {
    // --- Antenna: single ---
    case 'antenna_single': {
      const stalk = shadow(new THREE.Mesh(
        new THREE.CylinderGeometry(0.012, 0.012, 0.18, 6),
        chromeMat,
      ));
      stalk.position.set(0, 0.09, 0);
      stalk.name = 'antenna_stalk';
      group.add(stalk);

      const tip = shadow(new THREE.Mesh(
        new THREE.SphereGeometry(0.025, 8, 8),
        accentMat,
      ));
      tip.position.set(0, 0.19, 0);
      tip.name = 'antenna_tip';
      group.add(tip);
      break;
    }

    // --- Antenna: double (V-shape) ---
    case 'antenna_double': {
      for (const side of [-1, 1]) {
        const stalk = shadow(new THREE.Mesh(
          new THREE.CylinderGeometry(0.01, 0.01, 0.16, 6),
          chromeMat,
        ));
        stalk.position.set(side * 0.04, 0.08, 0);
        stalk.rotation.z = side * -0.3;
        stalk.name = `antenna_stalk_${side > 0 ? 'r' : 'l'}`;
        group.add(stalk);

        const tip = shadow(new THREE.Mesh(
          new THREE.SphereGeometry(0.018, 8, 8),
          accentMat,
        ));
        tip.position.set(side * 0.065, 0.17, 0);
        tip.name = `antenna_tip_${side > 0 ? 'r' : 'l'}`;
        group.add(tip);
      }
      break;
    }

    // --- Antenna: dish ---
    case 'antenna_dish': {
      const stalk = shadow(new THREE.Mesh(
        new THREE.CylinderGeometry(0.012, 0.012, 0.1, 6),
        chromeMat,
      ));
      stalk.position.set(0, 0.05, 0);
      stalk.name = 'dish_stalk';
      group.add(stalk);

      const dish = shadow(new THREE.Mesh(
        new THREE.ConeGeometry(0.06, 0.04, 12, 1, true),
        chromeMat,
      ));
      dish.position.set(0, 0.12, 0);
      dish.rotation.x = Math.PI;
      dish.name = 'dish_cone';
      group.add(dish);
      break;
    }

    // --- Wire hair (Einstein signature) ---
    case 'wire_hair': {
      const wireCount = 9;
      const wireMat = createAccessoryMaterial(config.accentColor, 'metal');
      for (let i = 0; i < wireCount; i++) {
        const angle = (i / wireCount) * Math.PI * 2;
        const radius = 0.06 + Math.random() * 0.04;
        const height = 0.08 + Math.random() * 0.1;
        const wire = shadow(new THREE.Mesh(
          new THREE.CylinderGeometry(0.006, 0.004, height, 4),
          wireMat,
        ));
        wire.position.set(
          Math.cos(angle) * radius,
          height / 2,
          Math.sin(angle) * radius,
        );
        wire.rotation.z = (Math.random() - 0.5) * 0.6;
        wire.rotation.x = (Math.random() - 0.5) * 0.4;
        wire.name = `wire_${i}`;
        group.add(wire);
      }
      break;
    }

    // --- Lab coat ---
    case 'lab_coat': {
      const coatMat = createAccessoryMaterial('#EEEEEE', 'fabric');
      const coatH = CHARACTER.BODY_HEIGHT * 0.9 + CHARACTER.LEG_LENGTH * 0.5;
      const coatW = CHARACTER.BODY_WIDTH * 0.55;

      for (const side of [-1, 1]) {
        const panel = shadow(new THREE.Mesh(
          new THREE.PlaneGeometry(coatW, coatH),
          coatMat,
        ));
        panel.position.set(side * (CHARACTER.BODY_WIDTH / 2 + 0.01), -coatH * 0.15, 0);
        panel.rotation.y = side * Math.PI / 2;
        panel.name = `lab_coat_${side > 0 ? 'r' : 'l'}`;
        group.add(panel);
      }
      break;
    }

    // --- Goggles ---
    case 'goggles': {
      const frameMat = createAccessoryMaterial(config.accentColor, 'metal');
      const lensMat = createAccessoryMaterial('#88CCFF', 'glass');
      const lensR = 0.04;

      for (const side of [-1, 1]) {
        // Lens frame cylinder
        const frame = shadow(new THREE.Mesh(
          new THREE.CylinderGeometry(lensR + 0.008, lensR + 0.008, 0.02, 12),
          frameMat,
        ));
        frame.rotation.x = Math.PI / 2;
        frame.position.set(side * 0.065, 0.04, 0);
        frame.name = `goggle_frame_${side > 0 ? 'r' : 'l'}`;
        group.add(frame);

        // Glass lens
        const lens = shadow(new THREE.Mesh(
          new THREE.CircleGeometry(lensR, 12),
          lensMat,
        ));
        lens.position.set(side * 0.065, 0.04, 0.011);
        lens.name = `goggle_lens_${side > 0 ? 'r' : 'l'}`;
        group.add(lens);
      }

      // Strap across head
      const strap = shadow(new THREE.Mesh(
        new THREE.BoxGeometry(0.26, 0.02, 0.015),
        frameMat,
      ));
      strap.position.set(0, 0.04, -0.005);
      strap.name = 'goggle_strap';
      group.add(strap);
      break;
    }

    // --- Backpack ---
    case 'backpack': {
      const bpMat = createAccessoryMaterial(config.accentColor, 'metal');
      const bpW = CHARACTER.BODY_WIDTH * 0.7;
      const bpH = CHARACTER.BODY_HEIGHT * 0.6;
      const bpD = 0.12;

      const pack = shadow(new THREE.Mesh(
        new THREE.BoxGeometry(bpW, bpH, bpD),
        bpMat,
      ));
      pack.position.set(0, 0, -(CHARACTER.BODY_DEPTH / 2 + bpD / 2 + 0.005));
      pack.name = 'backpack_box';
      group.add(pack);

      // Straps
      const strapMat = createAccessoryMaterial('#444444', 'fabric');
      for (const side of [-1, 1]) {
        const strap = shadow(new THREE.Mesh(
          new THREE.BoxGeometry(0.025, bpH * 0.8, CHARACTER.BODY_DEPTH + bpD + 0.01),
          strapMat,
        ));
        strap.position.set(
          side * bpW * 0.35,
          0.05,
          -(CHARACTER.BODY_DEPTH / 2 + bpD / 2 + 0.005) / 2,
        );
        strap.name = `backpack_strap_${side > 0 ? 'r' : 'l'}`;
        group.add(strap);
      }
      break;
    }

    // --- Jetpack ---
    case 'jetpack': {
      const jpMat = createAccessoryMaterial('#555555', 'metal');
      const nozzleMat = createAccessoryMaterial('#CC3300', 'metal');
      const jetZ = -(CHARACTER.BODY_DEPTH / 2 + 0.06);

      for (const side of [-1, 1]) {
        // Tank cylinder
        const tank = shadow(new THREE.Mesh(
          new THREE.CylinderGeometry(0.05, 0.05, 0.25, 10),
          jpMat,
        ));
        tank.position.set(side * 0.1, 0, jetZ);
        tank.name = `jetpack_tank_${side > 0 ? 'r' : 'l'}`;
        group.add(tank);

        // Nozzle cone
        const nozzle = shadow(new THREE.Mesh(
          new THREE.ConeGeometry(0.035, 0.06, 8),
          nozzleMat,
        ));
        nozzle.position.set(side * 0.1, -0.155, jetZ);
        nozzle.name = `jetpack_nozzle_${side > 0 ? 'r' : 'l'}`;
        group.add(nozzle);
      }
      break;
    }

    // --- Tool belt ---
    case 'tool_belt': {
      const beltMat = createAccessoryMaterial('#6B4226', 'fabric');
      const toolMat = createAccessoryMaterial('#888888', 'metal');

      // Belt ring (thin box around midsection)
      const beltW = CHARACTER.BODY_WIDTH + 0.04;
      const beltD = CHARACTER.BODY_DEPTH + 0.04;
      const belt = shadow(new THREE.Mesh(
        new THREE.BoxGeometry(beltW, 0.04, beltD),
        beltMat,
      ));
      belt.position.set(0, -CHARACTER.BODY_HEIGHT * 0.2, 0);
      belt.name = 'belt_band';
      group.add(belt);

      // Small tool shapes (wrench-like boxes)
      const toolPositions: [number, number, number][] = [
        [beltW / 2 + 0.01, -CHARACTER.BODY_HEIGHT * 0.2, 0],
        [-beltW / 2 - 0.01, -CHARACTER.BODY_HEIGHT * 0.2, 0.05],
        [0.1, -CHARACTER.BODY_HEIGHT * 0.2, beltD / 2 + 0.01],
      ];
      toolPositions.forEach(([tx, ty, tz], i) => {
        const tool = shadow(new THREE.Mesh(
          new THREE.BoxGeometry(0.015, 0.06, 0.01),
          toolMat,
        ));
        tool.position.set(tx, ty, tz);
        tool.name = `tool_${i}`;
        group.add(tool);
      });
      break;
    }

    // --- Scarf ---
    case 'scarf': {
      const scarfMat = createAccessoryMaterial('#CC3333', 'fabric');
      const neckY = CHARACTER.BODY_HEIGHT / 2;

      // Wrapped portion around neck
      const wrap = shadow(new THREE.Mesh(
        new THREE.BoxGeometry(
          CHARACTER.BODY_WIDTH * 0.9,
          0.06,
          CHARACTER.BODY_DEPTH * 0.9,
        ),
        scarfMat,
      ));
      wrap.position.set(0, neckY, 0);
      wrap.name = 'scarf_wrap';
      group.add(wrap);

      // Dangling tail piece
      const tail = shadow(new THREE.Mesh(
        new THREE.PlaneGeometry(0.06, 0.18),
        scarfMat,
      ));
      tail.position.set(0.08, neckY - 0.1, CHARACTER.BODY_DEPTH / 2 + 0.015);
      tail.rotation.z = -0.15;
      tail.name = 'scarf_tail';
      group.add(tail);
      break;
    }

    // --- Monocle ---
    case 'monocle': {
      const frameMat = createAccessoryMaterial('#DAA520', 'metal');
      const lensMat = createAccessoryMaterial('#BBDDFF', 'glass');
      const monocleR = 0.035;

      // Ring frame
      const ring = shadow(new THREE.Mesh(
        new THREE.TorusGeometry(monocleR, 0.005, 8, 16),
        frameMat,
      ));
      ring.position.set(0.07, 0.02, 0.005);
      ring.name = 'monocle_ring';
      group.add(ring);

      // Glass fill
      const glass = shadow(new THREE.Mesh(
        new THREE.CircleGeometry(monocleR - 0.003, 12),
        lensMat,
      ));
      glass.position.set(0.07, 0.02, 0.006);
      glass.name = 'monocle_glass';
      group.add(glass);

      // Chain (thin line down)
      const chain = shadow(new THREE.Mesh(
        new THREE.CylinderGeometry(0.003, 0.003, 0.12, 4),
        frameMat,
      ));
      chain.position.set(0.07, -0.04, 0.005);
      chain.name = 'monocle_chain';
      group.add(chain);
      break;
    }

    // --- Top hat ---
    case 'top_hat': {
      const hatMat = createAccessoryMaterial('#222222', 'fabric');

      // Brim (wider cylinder)
      const brim = shadow(new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.12, 0.015, 16),
        hatMat,
      ));
      brim.position.set(0, 0.007, 0);
      brim.name = 'hat_brim';
      group.add(brim);

      // Crown (taller cylinder)
      const crown = shadow(new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.075, 0.14, 16),
        hatMat,
      ));
      crown.position.set(0, 0.085, 0);
      crown.name = 'hat_crown';
      group.add(crown);

      // Band accent
      const bandMat = createAccessoryMaterial(config.accentColor, 'fabric');
      const band = shadow(new THREE.Mesh(
        new THREE.CylinderGeometry(0.076, 0.076, 0.02, 16),
        bandMat,
      ));
      band.position.set(0, 0.03, 0);
      band.name = 'hat_band';
      group.add(band);
      break;
    }

    // --- Headphones ---
    case 'headphones': {
      const cupMat = createAccessoryMaterial('#333333', 'metal');
      const bandMat = createAccessoryMaterial('#444444', 'metal');

      const hs = headShapeScale(config);
      const hw = CHARACTER.HEAD_WIDTH * hs.wX;
      const hh = CHARACTER.HEAD_HEIGHT * hs.hY;

      // Ear cups
      for (const side of [-1, 1]) {
        const cup = shadow(new THREE.Mesh(
          new THREE.SphereGeometry(0.05, 10, 10),
          cupMat,
        ));
        cup.position.set(side * (hw / 2 + 0.03), 0, 0);
        cup.scale.set(0.6, 1, 1);
        cup.name = `headphone_cup_${side > 0 ? 'r' : 'l'}`;
        group.add(cup);
      }

      // Headband (curved box arching over head)
      const band = shadow(new THREE.Mesh(
        new THREE.BoxGeometry(hw + 0.08, 0.02, 0.03),
        bandMat,
      ));
      band.position.set(0, hh / 2 + 0.01, 0);
      band.name = 'headphone_band';
      group.add(band);
      break;
    }

    // --- Cape ---
    case 'cape': {
      const capeMat = createAccessoryMaterial(config.accentColor, 'fabric');
      const capeW = CHARACTER.BODY_WIDTH * 1.1;
      const capeH = CHARACTER.BODY_HEIGHT + CHARACTER.LEG_LENGTH * 0.6;

      const cape = shadow(new THREE.Mesh(
        new THREE.PlaneGeometry(capeW, capeH),
        capeMat,
      ));
      // Slightly behind the body, hanging from shoulders
      cape.position.set(0, -capeH * 0.15, -(CHARACTER.BODY_DEPTH / 2 + 0.02));
      cape.name = 'cape_cloth';
      group.add(cape);

      // Shoulder clasp (small circle)
      const claspMat = createAccessoryMaterial('#DAA520', 'metal');
      const clasp = shadow(new THREE.Mesh(
        new THREE.CircleGeometry(0.025, 8),
        claspMat,
      ));
      clasp.position.set(0, capeH * 0.35, -(CHARACTER.BODY_DEPTH / 2 + 0.015));
      clasp.name = 'cape_clasp';
      group.add(clasp);
      break;
    }
  }

  return group;
}
