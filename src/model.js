import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const TAU = Math.PI * 2;

const PART_SPECS = [
  {
    id: 'engine',
    num: '01',
    zh: '柴油发动机',
    en: 'DIESEL ENGINE',
    title: 'KTA19-G3',
    base: [-1.22, 0.88, 0],
    explode: [-0.5, 0.2, 0],
    anchor: [0.02, 0.68, 0.3],
    label: { dx: -178, dy: 62 },
    summary:
      '康明斯 19 升级直列六缸涡轮增压中冷柴油机，是整个发电机组的动力核心。PT 燃油系统、铸铁缸体与整体式锻钢曲轴构成重型工业底盘。',
    facts: [
      ['排量', '18.9 L'],
      ['缸数', '直列 6 缸'],
      ['进气', '涡轮增压 / 中冷'],
      ['额定转速', '1 500 rpm'],
    ],
  },
  {
    id: 'flywheel',
    num: '02',
    zh: '飞轮壳',
    en: 'FLYWHEEL HOUSING',
    title: 'SAE BELL HOUSING',
    base: [-0.39, 0.88, 0],
    explode: [-0.33, 0.11, 0],
    anchor: [0, 0.36, 0.2],
    label: { dx: -24, dy: -102, minor: true },
    summary:
      '连接柴油机机体与斯坦福电机的 SAE 接口，承担飞轮、联轴器与电机转子的对中与防护，是动力链中的刚性过渡段。',
    facts: [
      ['接口', 'SAE 标准飞轮壳'],
      ['功能', '对中 / 防护 / 承载'],
      ['材质', '高强度铸铁'],
      ['位置', '发动机 — 电机之间'],
    ],
  },
  {
    id: 'coupling',
    num: '03',
    zh: '柔性联轴器',
    en: 'FLEXIBLE COUPLING',
    title: 'FLEX PLATE',
    base: [-0.22, 0.88, 0],
    explode: [0.14, 0.2, 0],
    anchor: [0.01, 0.2, 0.16],
    label: { dx: 84, dy: 96, minor: true },
    summary:
      '将飞轮输出的扭矩传递给电机转子，并吸收微小的轴向与角向偏差，降低机组运行时的扭转振动。',
    facts: [
      ['形式', '柔性盘式联轴器'],
      ['作用', '传递扭矩 / 补偿偏差'],
      ['连接', '飞轮 ↔ 电机转子'],
      ['维护', '定期检查紧固件'],
    ],
  },
  {
    id: 'alternator',
    num: '04',
    zh: '交流发电机',
    en: 'AC ALTERNATOR',
    title: 'STAMFORD HCI544',
    base: [0.78, 0.88, 0],
    explode: [0.77, 0.14, 0],
    anchor: [0.02, 0.52, 0.24],
    label: { dx: 132, dy: 10 },
    summary:
      '斯坦福 HCI 系列无刷自励同步电机，单轴承旋转磁场结构，与康明斯发动机共同构成 500 kVA 级发电机组。',
    facts: [
      ['容量', '500 kVA / 400 kW'],
      ['电压', '400 / 230 V'],
      ['结构', '无刷 / 单轴承'],
      ['防护', 'IP23 · H 级绝缘'],
    ],
  },
  {
    id: 'radiator',
    num: '05',
    zh: '散热器总成',
    en: 'RADIATOR',
    title: 'CLOSED-LOOP COOLING',
    base: [-2.32, 0.98, 0],
    explode: [-0.93, 0.1, 0],
    anchor: [0.03, 0.58, 0.2],
    label: { dx: -150, dy: -88 },
    summary:
      '横流式散热器、冷却风扇与上下水管组成闭式水冷回路，将发动机缸套热量排入环境，维持机组稳定工作温度。',
    facts: [
      ['冷却方式', '闭式水冷'],
      ['系统容量', '66 L'],
      ['风扇', '机械驱动'],
      ['维护', '保持芯体清洁'],
    ],
  },
  {
    id: 'aircleaner',
    num: '06',
    zh: '空气滤清器',
    en: 'AIR CLEANER',
    title: 'HEAVY-DUTY FILTER',
    base: [-1.56, 1.73, -0.28],
    explode: [-0.16, 0.62, -0.44],
    anchor: [0.12, 0.23, 0.02],
    label: { dx: -106, dy: -134 },
    summary:
      '重型干式纸芯空气滤清器，为涡轮增压器提供洁净进气。筒式壳体与快拆卡箍便于现场维护。',
    facts: [
      ['类型', '干式纸芯'],
      ['安装', '发动机上部'],
      ['作用', '进气过滤'],
      ['提示', '堵塞时及时更换'],
    ],
  },
  {
    id: 'exhaust',
    num: '07',
    zh: '排气消声器',
    en: 'EXHAUST SILENCER',
    title: 'INDUSTRIAL MUFFLER',
    base: [-1.12, 1.52, 0.4],
    explode: [0.1, 0.68, 0.5],
    anchor: [-0.04, 0.32, 0.12],
    label: { dx: 76, dy: -144 },
    summary:
      '工业级排气消声器通过扩张腔与吸声结构降低排气脉冲噪声，尾管配有防雨帽，排气系统背压需控制在允许范围。',
    facts: [
      ['最大背压', '≤ 10 kPa'],
      ['排气温度', '≈ 532 °C'],
      ['接口', '法兰 / 卡箍'],
      ['注意', '高温表面 · 禁止触碰'],
    ],
  },
  {
    id: 'controller',
    num: '08',
    zh: '数字控制屏',
    en: 'CONTROL PANEL',
    title: 'GENSET CONTROLLER',
    base: [0.74, 1.37, 0.06],
    explode: [0.24, 0.66, 0.48],
    anchor: [0.02, 0.28, 0.1],
    label: { dx: 150, dy: 70 },
    summary:
      '机组控制与保护中枢，显示电压、频率、转速和运行状态，提供本地启停、报警与保护停机信号。',
    facts: [
      ['显示', 'LCD 数显'],
      ['启动', 'DC 24 V 电启动'],
      ['监测', '电压 / 频率 / 油压 / 水温'],
      ['保护', '过速 · 低油压 · 高水温'],
    ],
  },
  {
    id: 'base',
    num: '09',
    zh: '底座油箱',
    en: 'BASE FUEL TANK',
    title: 'STRUCTURAL SKID',
    base: [0, 0, 0],
    explode: [0, 0, 0],
    anchor: [1.95, 0.3, 0.52],
    label: { dx: -154, dy: 116 },
    summary:
      '钢制底座同时作为日用燃油箱与机组承重结构，四点减振垫隔离发动机与电机的振动，端部设有搬运与起吊结构。',
    facts: [
      ['结构', '钢制底座 / 集成油箱'],
      ['减振', '四点橡胶减振'],
      ['搬运', '叉车槽 / 起吊点'],
      ['附件', '燃油加注口 · 液位计'],
    ],
  },
  {
    id: 'battery',
    num: '10',
    zh: '启动蓄电池',
    en: 'STARTING BATTERY',
    title: '24 V DC BANK',
    base: [1.29, 0.47, 0.5],
    explode: [0.16, 0.35, 0.44],
    anchor: [0.02, 0.19, 0.12],
    label: { dx: 106, dy: 124, minor: true },
    summary:
      '双 12 V 免维护蓄电池串联组成 24 V 直流启动电源，为起动马达与控制回路供电，通过电缆与机组电气系统连接。',
    facts: [
      ['电压', '24 V DC'],
      ['配置', '2 × 12 V 串联'],
      ['用途', '启动 / 控制供电'],
      ['维护', '检查端子与充电状态'],
    ],
  },
];

export function createGenerator() {
  const root = new THREE.Group();
  root.name = 'cummins-kta19-generator';

  const surface = createSurfaceMaps();
  const M = createMaterials(surface);
  const parts = [];
  const pickables = [];

  const partById = new Map();
  for (const spec of PART_SPECS) {
    const group = new THREE.Group();
    group.name = spec.id;
    group.position.fromArray(spec.base);
    group.userData.partId = spec.id;
    root.add(group);

    const part = {
      ...spec,
      group,
      basePosition: new THREE.Vector3().fromArray(spec.base),
      explodePosition: new THREE.Vector3()
        .fromArray(spec.base)
        .add(new THREE.Vector3().fromArray(spec.explode)),
      baseRotation: new THREE.Euler(),
      explodeRotation: new THREE.Euler(),
      anchorVector: new THREE.Vector3().fromArray(spec.anchor),
    };
    parts.push(part);
    partById.set(spec.id, part);
  }

  buildRadiator(partById.get('radiator').group, M);
  buildEngine(partById.get('engine').group, M);
  buildFlywheelHousing(partById.get('flywheel').group, M);
  buildCoupling(partById.get('coupling').group, M);
  buildAlternator(partById.get('alternator').group, M);
  buildAirCleaner(partById.get('aircleaner').group, M);
  buildExhaust(partById.get('exhaust').group, M);
  buildController(partById.get('controller').group, M);
  buildBase(partById.get('base').group, M);
  buildBattery(partById.get('battery').group, M);

  const canopy = buildCanopy(M);
  root.add(canopy.group);

  // Merge static opaque parts by material to reduce draw calls from several
  // hundred small mechanical details to a compact set of meshes per assembly.
  for (const part of parts) mergeStaticPartGeometry(part);

  // Give every assembly its own material instances so hover / focus effects stay local.
  for (const part of parts) {
    const cloned = new Map();
    const materials = new Set();
    part.group.traverse((object) => {
      if (!object.isMesh && !object.isLine) return;
      object.userData.partId = part.id;
      pickables.push(object);
      const sourceMaterials = Array.isArray(object.material) ? object.material : [object.material];
      const nextMaterials = sourceMaterials.map((source) => {
        if (!source) return source;
        if (!cloned.has(source)) {
          const copy = source.clone();
          copy.userData = { ...source.userData };
          if (copy.emissive) {
            copy.userData.baseEmissive = copy.emissive.getHex();
            copy.userData.baseEmissiveIntensity = copy.emissiveIntensity;
          }
          cloned.set(source, copy);
          materials.add(copy);
        }
        return cloned.get(source);
      });
      object.material = Array.isArray(object.material) ? nextMaterials : nextMaterials[0];
    });
    part.materials = materials;

    // Local bounds are used for camera framing and the floor focus ring.
    const position = part.group.position.clone();
    const rotation = part.group.rotation.clone();
    part.group.position.set(0, 0, 0);
    part.group.rotation.set(0, 0, 0);
    part.group.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(part.group);
    const sphere = box.getBoundingSphere(new THREE.Sphere());
    part.localBox = box;
    part.localCenter = sphere.center.clone();
    part.radius = Math.max(sphere.radius, 0.24);
    part.group.position.copy(position);
    part.group.rotation.copy(rotation);
    part.group.updateMatrixWorld(true);
  }

  collectCanopyMaterials(canopy);

  // Animation state is kept outside the builders so the scene can update cheaply.
  const partRuntime = parts.map((part) => ({
    part,
    base: part.basePosition.clone(),
    target: part.explodePosition.clone(),
    baseRot: part.baseRotation.clone(),
    targetRot: part.explodeRotation.clone(),
  }));

  const state = {
    explode: 0,
    canopyVisible: false,
    canopyOpacity: 0,
  };
  const canopyMeshes = [];
  canopy.group.traverse((object) => {
    if (object.isMesh) canopyMeshes.push(object);
  });

  function setExplode(value) {
    const t = THREE.MathUtils.clamp(value, 0, 1);
    state.explode = t;
    for (const runtime of partRuntime) {
      const eased = easeInOutCubic(t);
      runtime.part.group.position.lerpVectors(runtime.base, runtime.target, eased);
      runtime.part.group.rotation.set(
        THREE.MathUtils.lerp(runtime.baseRot.x, runtime.targetRot.x, eased),
        THREE.MathUtils.lerp(runtime.baseRot.y, runtime.targetRot.y, eased),
        THREE.MathUtils.lerp(runtime.baseRot.z, runtime.targetRot.z, eased),
      );
    }
    // Shell panels separate around the machine as the same single control is moved.
    for (const panel of canopy.panels) {
      const eased = easeInOutCubic(t);
      panel.group.position.lerpVectors(panel.closed, panel.open, eased);
      panel.group.rotation.set(
        panel.closedRot.x + (panel.openRot.x - panel.closedRot.x) * eased,
        panel.closedRot.y + (panel.openRot.y - panel.closedRot.y) * eased,
        panel.closedRot.z + (panel.openRot.z - panel.closedRot.z) * eased,
      );
    }
    applyCanopyMaterials();
  }

  function applyCanopyMaterials() {
    // Once the shell opens, fade it to a ghosted envelope so it frames the
    // internals instead of hiding them.
    const ghost = smoothstep(state.explode, 0.16, 0.72) * 0.78;
    const effective = state.canopyOpacity * (1 - ghost);
    const visible = state.canopyVisible && effective > 0.004;
    canopy.group.visible = visible;
    for (const material of canopy.materials) {
      material.opacity = (material.userData.canopyBaseOpacity ?? 1) * effective;
      const alwaysTransparent = Boolean(material.userData.canopyAlwaysTransparent);
      const transparent = alwaysTransparent || effective < 0.995;
      const depthWrite = alwaysTransparent ? false : effective > 0.86;
      if (material.transparent !== transparent || material.depthWrite !== depthWrite) {
        material.transparent = transparent;
        material.depthWrite = depthWrite;
        material.needsUpdate = true;
      }
    }
    for (const mesh of canopyMeshes) {
      mesh.castShadow = effective > 0.9;
      mesh.receiveShadow = false;
    }
  }

  function setCanopyOpacity(opacity) {
    state.canopyOpacity = opacity;
    state.canopyVisible = opacity > 0.01;
    applyCanopyMaterials();
  }

  function getPartWorldAnchor(part) {
    return part.group.localToWorld(part.anchorVector.clone());
  }

  setCanopyOpacity(0);
  setExplode(0);

  return {
    root,
    parts,
    pickables,
    canopy,
    setExplode,
    setCanopyOpacity,
    getPartWorldAnchor,
    state,
    materials: M,
  };
}

/* ------------------------------------------------------------------------- */
/* Builders                                                                  */
/* ------------------------------------------------------------------------- */

function buildBase(group, M) {
  const grain = M.surface.grain;
  const basePaint = M.basePaint;

  box(group, 4.5, 0.22, 1.4, basePaint, 0, 0.17, 0, { r: 0.045, cast: true });
  box(group, 4.28, 0.1, 1.3, M.deck, 0, 0.3, 0, { r: 0.025, cast: true });
  box(group, 4.38, 0.035, 1.35, M.steelDark, 0, 0.355, 0, { r: 0.012 });

  // Heavy wraparound rail / bumper look.
  box(group, 4.54, 0.09, 0.1, M.steelDark, 0, 0.2, 0.69, { r: 0.025 });
  box(group, 4.54, 0.09, 0.1, M.steelDark, 0, 0.2, -0.69, { r: 0.025 });
  box(group, 0.1, 0.19, 1.4, M.steelDark, -2.27, 0.17, 0, { r: 0.02 });
  box(group, 0.1, 0.19, 1.4, M.steelDark, 2.26, 0.17, 0, { r: 0.02 });

  // Inset fuel-tank panels and ribs.
  for (const side of [-1, 1]) {
    box(group, 3.4, 0.13, 0.018, M.baseInset, -0.35, 0.19, side * 0.706, { r: 0.01 });
    for (let i = 0; i < 7; i += 1) {
      const x = -1.55 + i * 0.46;
      box(group, 0.028, 0.16, 0.025, M.steelDark, x, 0.19, side * 0.716, { r: 0.008 });
    }
    box(group, 1.05, 0.045, 0.03, M.steel, -1.38, 0.11, side * 0.717, { r: 0.01 });
    box(group, 0.035, 0.045, 0.35, M.steelDark, -1.7, 0.08, side * 0.58, { r: 0.01 });
    box(group, 0.035, 0.045, 0.35, M.steelDark, 1.38, 0.08, side * 0.58, { r: 0.01 });
  }

  // Fork pockets / lifting points.
  for (const x of [-1.72, 1.42]) {
    for (const side of [-1, 1]) {
      box(group, 0.52, 0.12, 0.025, M.rubber, x, 0.12, side * 0.72, { r: 0.015 });
      box(group, 0.18, 0.055, 0.04, M.steel, x, 0.2, side * 0.725, { r: 0.01 });
    }
  }

  // Corner bumpers / rubber feet.
  for (const x of [-2.08, 2.08]) {
    for (const z of [-0.56, 0.56]) {
      box(group, 0.28, 0.1, 0.18, M.rubber, x, 0.045, z, { r: 0.035, cast: false });
      cylinder(group, 0.045, 0.045, 0.035, M.steelDark, [x, 0.02, z], [0, 0, 0], 16, false);
    }
  }

  // Engine / alternator mounting rails.
  for (const side of [-1, 1]) {
    box(group, 2.0, 0.07, 0.11, M.steelDark, -1.12, 0.385, side * 0.42, { r: 0.018 });
    box(group, 1.6, 0.07, 0.12, M.steelDark, 0.77, 0.385, side * 0.34, { r: 0.018 });
  }

  // Four vibration isolators for the engine and four compact pads for the alternator.
  for (const x of [-1.58, -0.68]) {
    for (const z of [-0.42, 0.42]) addIsolator(group, M, x, 0.4, z, 0.9);
  }
  for (const x of [0.38, 1.18]) {
    for (const z of [-0.3, 0.3]) addIsolator(group, M, x, 0.4, z, 0.66);
  }

  // Fuel filler, breather and level sender.
  cylinder(group, 0.1, 0.1, 0.045, M.steelDark, [1.38, 0.39, 0.31], [0, 0, 0], 24);
  cylinder(group, 0.073, 0.073, 0.025, M.brass, [1.38, 0.425, 0.31], [0, 0, 0], 24);
  cylinder(group, 0.052, 0.052, 0.032, M.darkSteel, [1.38, 0.45, 0.31], [0, 0, 0], 16);
  box(group, 0.12, 0.035, 0.06, M.steel, 1.38, 0.466, 0.31, { r: 0.015 });
  box(group, 0.17, 0.11, 0.06, M.steelDark, -2.03, 0.31, 0.56, { r: 0.015 });
  cylinder(group, 0.032, 0.032, 0.05, M.brass, [-2.03, 0.34, 0.6], [0, 0, 0], 16);

  // Fuel sender and a compact gauge bezel on the side.
  cylinder(group, 0.045, 0.045, 0.02, M.steelDark, [0.94, 0.23, 0.724], [Math.PI / 2, 0, 0], 24);
  const gauge = sticker(
    group,
    makeGaugeTexture(),
    0.18,
    0.18,
    [0.94, 0.23, 0.736],
    [0, 0, 0],
  );
  gauge.userData.decal = true;

  // Side branding and safety labels.
  sticker(
    group,
    makeTextTexture({
      text: 'DIESEL',
      width: 640,
      height: 160,
      font: '700 74px "Arial Narrow", Arial',
      color: '#e4e0d5',
      tracking: 12,
    }),
    0.64,
    0.16,
    [-1.48, 0.21, 0.724],
  );
  sticker(
    group,
    makeTextTexture({
      text: 'KTA19-G3',
      width: 1000,
      height: 200,
      font: '700 122px "Arial Narrow", Arial, sans-serif',
      color: '#67736e',
      tracking: 12,
    }),
    1.18,
    0.22,
    [0.36, 0.18, 0.724],
  );
  sticker(
    group,
    makeTextTexture({
      text: 'BASE FUEL TANK  /  500 kVA CLASS',
      width: 900,
      height: 90,
      font: '500 28px "Arial", sans-serif',
      color: '#525e5a',
      tracking: 4,
    }),
    0.82,
    0.075,
    [0.36, 0.06, 0.724],
  );
  const hazard = sticker(
    group,
    makeHazardTexture('FLAMMABLE', '柴油 · DIESEL FUEL'),
    0.31,
    0.21,
    [1.82, 0.2, 0.722],
  );
  hazard.userData.decal = true;

  // Identification plate.
  sticker(
    group,
    makePlaqueTexture({
      eyebrow: 'CUMMINS POWER GENERATION',
      value: 'KTA19-G3',
      footnote: 'STAMFORD HCI544  ·  50 Hz  ·  1500 rpm',
    }),
    0.54,
    0.21,
    [-1.2, 0.05, 0.725],
  );

  // Thin edge highlight along the skid.
  box(group, 4.42, 0.012, 0.012, M.steel, 0, 0.355, 0.681, { r: 0.003, cast: false });
  box(group, 4.42, 0.012, 0.012, M.steel, 0, 0.355, -0.681, { r: 0.003, cast: false });

  // Fuel lines tucked under the deck.
  tube(
    group,
    [
      [1.48, 0.38, 0.5],
      [1.2, 0.44, 0.53],
      [0.66, 0.47, 0.56],
      [0.11, 0.44, 0.57],
    ],
    0.018,
    M.hose,
    10,
    32,
  );
  tube(
    group,
    [
      [1.47, 0.37, 0.44],
      [1.03, 0.36, 0.46],
      [0.44, 0.37, 0.5],
    ],
    0.012,
    M.hoseBlack,
    8,
    24,
  );

  void grain;
}

function addIsolator(group, M, x, y, z, scale = 1) {
  box(group, 0.25 * scale, 0.03, 0.21 * scale, M.steelDark, x, y + 0.015, z, { r: 0.01 });
  cylinder(group, 0.075 * scale, 0.085 * scale, 0.085, M.rubber, [x, y + 0.075, z], [0, 0, 0], 20);
  cylinder(group, 0.11 * scale, 0.11 * scale, 0.025, M.steelDark, [x, y + 0.13, z], [0, 0, 0], 20);
  cylinder(group, 0.018, 0.018, 0.05, M.steel, [x, y + 0.16, z], [0, 0, 0], 12, false);
}

function buildEngine(group, M) {
  const blockMat = M.engine;
  const blockX = 1.38;
  const blockY = 0.55;
  const blockZ = 0.68;

  // Main cast-iron block.
  box(group, blockX, blockY, blockZ, blockMat, 0, 0, 0, {
    r: 0.055,
    seg: 4,
    bump: true,
  });
  box(group, blockX - 0.04, 0.19, blockZ - 0.07, M.engineDark, 0, 0.035, 0, { r: 0.025 });

  // Deep oil pan with a small sump.
  box(group, 1.19, 0.24, 0.49, M.oilPan, -0.02, -0.39, 0, { r: 0.065, seg: 4 });
  box(group, 0.45, 0.1, 0.38, M.oilPan, -0.08, -0.54, 0, { r: 0.035 });
  cylinder(group, 0.038, 0.038, 0.045, M.steelDark, [0.33, -0.615, 0.03], [0, 0, 0], 16);
  for (let i = 0; i < 8; i += 1) {
    bolt(group, -0.5 + i * 0.145, -0.272, 0.255, M.steel, 'z', 0.017);
    bolt(group, -0.5 + i * 0.145, -0.272, -0.255, M.steel, 'z', 0.017);
  }

  // Cylinder head and valve cover.
  box(group, 1.33, 0.19, 0.61, M.engineLight, 0, 0.365, 0, { r: 0.035, seg: 3 });
  box(group, 1.22, 0.17, 0.47, M.valveCover, 0, 0.53, 0, { r: 0.05, seg: 3 });
  box(group, 1.14, 0.04, 0.4, M.redDark, 0, 0.625, 0, { r: 0.018 });
  // Six raised cam-cover humps.
  for (let i = 0; i < 6; i += 1) {
    const x = -0.505 + i * 0.202;
    box(group, 0.158, 0.06, 0.34, M.valveCover, x, 0.655, 0, { r: 0.024, seg: 3 });
    cylinder(group, 0.029, 0.029, 0.015, M.redDark, [x, 0.691, 0.1], [0, 0, 0], 12);
  }
  // Oil filler cap and breather.
  cylinder(group, 0.055, 0.055, 0.035, M.darkSteel, [-0.43, 0.705, -0.12], [0, 0, 0], 20);
  cylinder(group, 0.038, 0.038, 0.035, M.steel, [0.52, 0.7, -0.08], [0, 0, 0], 16);
  tube(
    group,
    [
      [0.53, 0.7, -0.08],
      [0.62, 0.63, -0.15],
      [0.64, 0.48, -0.25],
    ],
    0.025,
    M.hoseBlack,
    8,
    22,
  );

  // Engine identity.
  sticker(
    group,
    makeTextTexture({
      text: 'CUMMINS',
      width: 900,
      height: 170,
      font: '700 126px "Arial Narrow", Arial, sans-serif',
      color: '#f3eee3',
      tracking: 17,
    }),
    0.64,
    0.12,
    [0, 0.543, 0.239],
  );
  sticker(
    group,
    makePlaqueTexture({
      eyebrow: 'DIESEL ENGINE',
      value: 'KTA19-G3',
      footnote: '18.9 L  ·  6 CYL  ·  TURBO AFTERCOOLED',
      dark: true,
    }),
    0.39,
    0.19,
    [0.33, 0.02, 0.345],
  );
  sticker(
    group,
    makeHazardTexture('HOT SURFACE', '高温表面 · 请勿触摸'),
    0.23,
    0.16,
    [-0.47, 0.26, 0.346],
  );
  sticker(
    group,
    makeTextTexture({
      text: '6 CYL  /  18.9 L',
      width: 700,
      height: 100,
      font: '500 38px "Arial", sans-serif',
      color: '#b8c0bc',
      tracking: 4,
    }),
    0.34,
    0.048,
    [-0.28, -0.16, 0.349],
  );

  // Side ribs and inspection covers.
  for (let i = 0; i < 7; i += 1) {
    const x = -0.51 + i * 0.17;
    box(group, 0.042, 0.42, 0.025, M.engineDark, x, -0.03, 0.349, { r: 0.008 });
    if (i % 2 === 0) {
      cylinder(group, 0.042, 0.042, 0.03, M.steelDark, [x, 0.19, 0.357], [Math.PI / 2, 0, 0], 16);
    }
  }
  box(group, 0.42, 0.25, 0.02, M.engineDark, 0.08, -0.12, 0.354, { r: 0.018 });
  box(group, 0.48, 0.28, 0.02, M.engineDark, -0.45, -0.04, 0.354, { r: 0.018 });

  // Front gear case, damper and pulley stack.
  box(group, 0.08, 0.62, 0.52, M.engineDark, -0.72, 0.02, 0, { r: 0.025 });
  cylinder(group, 0.2, 0.21, 0.085, M.steelDark, [-0.79, -0.02, 0], [0, 0, Math.PI / 2], 40);
  cylinder(group, 0.16, 0.16, 0.11, M.steel, [-0.84, -0.02, 0], [0, 0, Math.PI / 2], 40);
  for (let i = 0; i < 6; i += 1) {
    const a = (i / 6) * TAU;
    bolt(group, -0.901, -0.02 + Math.sin(a) * 0.11, Math.cos(a) * 0.11, M.steelDark, 'x', 0.016);
  }
  for (let i = 0; i < 3; i += 1) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.24 + i * 0.035, 0.016, 8, 48),
      M.rubber,
    );
    ring.rotation.y = Math.PI / 2;
    ring.position.set(-0.88 - i * 0.003, -0.02, 0);
    finalize(ring);
    group.add(ring);
  }
  // Fan / alternator belt loop.
  const beltPoints = [];
  for (let i = 0; i < 32; i += 1) {
    const a = (i / 32) * TAU;
    beltPoints.push(new THREE.Vector3(-0.9, 0.25 + Math.cos(a) * 0.13, Math.sin(a) * 0.13));
  }
  tube(group, beltPoints, 0.018, M.rubber, 5, 48, true);

  // Water pump and thermostat housing.
  cylinder(group, 0.1, 0.1, 0.12, M.engineLight, [-0.63, 0.25, -0.1], [0, 0, Math.PI / 2], 24);
  cylinder(group, 0.055, 0.055, 0.14, M.aluminum, [-0.58, 0.33, -0.1], [0, 0, 0], 20);
  tube(
    group,
    [
      [-0.64, 0.37, -0.1],
      [-0.54, 0.53, -0.1],
      [-0.49, 0.62, -0.06],
    ],
    0.038,
    M.hose,
    10,
    28,
  );

  // Exhaust manifold, head branches and turbocharger.
  tube(
    group,
    [
      [-0.62, 0.35, 0.4],
      [-0.3, 0.36, 0.46],
      [0.05, 0.36, 0.47],
      [0.42, 0.35, 0.45],
      [0.64, 0.31, 0.38],
    ],
    0.083,
    M.castIron,
    12,
    48,
  );
  for (let i = 0; i < 6; i += 1) {
    const x = -0.52 + i * 0.205;
    tube(
      group,
      [
        [x, 0.3, 0.35],
        [x, 0.36, 0.5],
        [x + 0.01, 0.38, 0.52],
      ],
      0.045,
      M.castIron,
      8,
      16,
    );
    bolt(group, x, 0.41, 0.54, M.steelDark, 'z', 0.021);
  }

  const turbo = new THREE.Group();
  turbo.position.set(-0.53, 0.48, 0.54);
  group.add(turbo);
  const turbine = new THREE.Mesh(
    new THREE.TorusGeometry(0.13, 0.06, 16, 36, Math.PI * 1.72),
    M.turboDark,
  );
  turbine.rotation.set(0.18, Math.PI / 2, 0.4);
  finalize(turbine);
  turbo.add(turbine);
  cylinder(turbo, 0.105, 0.105, 0.09, M.turbo, [-0.02, 0, 0], [0, 0, Math.PI / 2], 28);
  cylinder(turbo, 0.04, 0.04, 0.13, M.turbo, [0.03, 0, 0], [0, 0, Math.PI / 2], 18);
  box(turbo, 0.18, 0.09, 0.1, M.steelDark, -0.09, 0.12, 0.02, { r: 0.02 });
  cylinder(turbo, 0.035, 0.04, 0.14, M.steel, [-0.1, 0.2, 0.02], [0, 0, Math.PI / 2], 16);
  tube(
    turbo,
    [
      [-0.06, 0.09, 0],
      [-0.14, 0.25, -0.02],
      [-0.1, 0.37, -0.04],
    ],
    0.028,
    M.steelDark,
    8,
    24,
  );
  // Turbo outlet charge-air pipe over the engine.
  tube(
    group,
    [
      [-0.52, 0.55, 0.48],
      [-0.5, 0.67, 0.32],
      [-0.36, 0.64, 0.05],
      [-0.52, 0.55, -0.28],
      [-0.68, 0.4, -0.38],
    ],
    0.065,
    M.aluminum,
    14,
    48,
  );
  for (const p of [
    [-0.49, 0.67, 0.22],
    [-0.57, 0.49, -0.32],
  ]) {
    const clamp = new THREE.Mesh(new THREE.TorusGeometry(0.073, 0.012, 6, 24), M.steelDark);
    clamp.position.set(...p);
    clamp.rotation.set(Math.PI / 2.7, 0, 0);
    finalize(clamp);
    group.add(clamp);
  }

  // Intake manifold on the far side.
  tube(
    group,
    [
      [-0.6, 0.31, -0.4],
      [-0.24, 0.35, -0.43],
      [0.18, 0.35, -0.43],
      [0.58, 0.31, -0.4],
    ],
    0.075,
    M.aluminum,
    12,
    36,
  );
  for (let i = 0; i < 6; i += 1) {
    const x = -0.52 + i * 0.205;
    cylinder(group, 0.042, 0.042, 0.09, M.aluminum, [x, 0.38, -0.37], [Math.PI / 2, 0, 0], 12);
  }

  // Radiator upper / lower coolant stubs.
  cylinder(group, 0.062, 0.062, 0.14, M.aluminum, [-0.68, 0.29, 0.22], [0, 0, Math.PI / 2], 20);
  cylinder(group, 0.047, 0.047, 0.16, M.aluminum, [-0.68, -0.14, 0.18], [0, 0, Math.PI / 2], 20);

  // PT fuel pump, filters and lines on the visible side.
  box(group, 0.2, 0.18, 0.16, M.castIron, 0.53, 0.19, 0.39, { r: 0.03 });
  cylinder(group, 0.045, 0.045, 0.12, M.aluminum, [0.6, 0.23, 0.47], [0, 0, Math.PI / 2], 16);
  for (const x of [0.19, 0.34]) {
    cylinder(group, 0.06, 0.06, 0.24, M.filter, [x, -0.22, 0.42], [0, 0, 0], 24);
    cylinder(group, 0.065, 0.065, 0.035, M.steelDark, [x, -0.08, 0.42], [0, 0, 0], 24);
    cylinder(group, 0.02, 0.02, 0.04, M.steel, [x, -0.07, 0.42], [0, 0, 0], 12, false);
    box(group, 0.13, 0.09, 0.03, M.steelDark, x, -0.23, 0.451, { r: 0.008 });
  }
  tube(
    group,
    [
      [0.53, 0.17, 0.34],
      [0.47, 0.06, 0.47],
      [0.35, -0.05, 0.47],
      [0.34, -0.08, 0.4],
    ],
    0.013,
    M.steelDark,
    8,
    24,
  );
  tube(
    group,
    [
      [0.53, 0.12, 0.33],
      [0.39, -0.02, 0.39],
      [0.2, -0.07, 0.4],
      [0.19, -0.08, 0.36],
    ],
    0.011,
    M.steelDark,
    8,
    24,
  );

  // Starter motor, dipstick and a few service details.
  cylinder(group, 0.09, 0.09, 0.3, M.steelDark, [0.48, -0.25, -0.24], [0, 0, Math.PI / 2], 24);
  cylinder(group, 0.065, 0.065, 0.016, M.aluminum, [0.54, -0.35, -0.24], [0, 0, 0], 18);
  cylinder(group, 0.012, 0.012, 0.34, M.steel, [0.1, -0.18, -0.34], [0, 0, 0], 10);
  cylinder(group, 0.04, 0.04, 0.045, M.warning, [0.1, 0.0, -0.34], [0, 0, 0], 12);

  // Lifting eyes.
  for (const x of [-0.4, 0.42]) {
    const eye = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.019, 8, 28, Math.PI * 1.45), M.redDark);
    eye.position.set(x, 0.58, 0.22);
    eye.rotation.set(0, 0, -0.3);
    finalize(eye);
    group.add(eye);
    box(group, 0.07, 0.035, 0.055, M.redDark, x, 0.55, 0.22, { r: 0.01 });
  }

  // A couple of tidy sensor harnesses.
  tube(
    group,
    [
      [-0.35, 0.55, -0.25],
      [-0.05, 0.62, -0.31],
      [0.25, 0.56, -0.3],
      [0.36, 0.5, -0.25],
    ],
    0.017,
    M.harness,
    6,
    32,
  );
  tube(
    group,
    [
      [0.62, 0.37, 0.2],
      [0.69, 0.2, 0.23],
      [0.65, 0.03, 0.24],
    ],
    0.012,
    M.harnessYellow,
    6,
    24,
  );
  cylinder(group, 0.028, 0.028, 0.06, M.brass, [-0.2, 0.4, 0.46], [0, 0, 0], 12);

  // Front accessory drive bracket.
  box(group, 0.055, 0.24, 0.32, M.engineDark, -0.76, 0.16, -0.2, { r: 0.018 });
  cylinder(group, 0.052, 0.052, 0.045, M.steelDark, [-0.8, 0.16, -0.2], [0, 0, Math.PI / 2], 16);

  // Small bolt ring around the block's front cover.
  for (let i = 0; i < 10; i += 1) {
    const a = (i / 10) * TAU;
    bolt(group, -0.77, Math.sin(a) * 0.24, Math.cos(a) * 0.24, M.steel, 'x', 0.014);
  }

  // Oil drain plug and some grime-catching highlights around the pan.
  cylinder(group, 0.028, 0.028, 0.025, M.brass, [0.52, -0.48, 0.03], [Math.PI / 2, 0, 0], 12);
}

function buildFlywheelHousing(group, M) {
  ringPlate(group, 0.46, 0.29, 0.12, M.bell, 0, 0, 0, 64);
  ringPlate(group, 0.425, 0.285, 0.09, M.engineDark, 0.11, 0, 0, 64);
  torus(group, 0.455, 0.028, M.steelDark, 0, 0, 0, Math.PI / 2, 64);
  torus(group, 0.315, 0.024, M.steelDark, 0.12, 0, 0, Math.PI / 2, 64);

  // Radial ribs and mounting bolts.
  for (let i = 0; i < 8; i += 1) {
    const a = (i / 8) * TAU + 0.18;
    const x = Math.sin(a) * 0.375;
    const y = Math.cos(a) * 0.375;
    const rib = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.14, 0.026), M.steelDark);
    rib.position.set(0.035, x, y);
    rib.rotation.x = -a;
    rib.castShadow = true;
    rib.receiveShadow = true;
    group.add(rib);
    bolt(group, 0.08, Math.sin(a) * 0.405, Math.cos(a) * 0.405, M.steel, 'x', 0.025);
  }
  // Starter pocket.
  box(group, 0.2, 0.16, 0.22, M.steelDark, 0.08, -0.38, 0.12, { r: 0.035 });
  cylinder(group, 0.065, 0.065, 0.08, M.rubber, [0.2, -0.4, 0.12], [0, 0, Math.PI / 2], 18);
  sticker(
    group,
    makeTextTexture({
      text: 'SAE 00',
      width: 300,
      height: 90,
      font: '600 44px "Arial", sans-serif',
      color: '#d7d2c7',
      tracking: 3,
    }),
    0.16,
    0.05,
    [0.05, -0.08, 0.32],
  );
}

function buildCoupling(group, M) {
  // Center boss and flexible disc.
  cylinder(group, 0.1, 0.1, 0.18, M.steelDark, [0, 0, 0], [0, 0, Math.PI / 2], 32);
  ringPlate(group, 0.28, 0.13, 0.065, M.coupling, 0.01, 0, 0, 48);
  torus(group, 0.265, 0.018, M.steel, 0.035, 0, 0, Math.PI / 2, 48);
  for (let i = 0; i < 8; i += 1) {
    const a = (i / 8) * TAU;
    bolt(group, 0.06, Math.sin(a) * 0.225, Math.cos(a) * 0.225, M.steel, 'x', 0.024);
    // Dark rubber pucks between the bolt circle and hub.
    const puck = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.075, 18), M.rubber);
    puck.rotation.z = Math.PI / 2;
    puck.position.set(0.01, Math.sin(a) * 0.14, Math.cos(a) * 0.14);
    finalize(puck);
    group.add(puck);
  }
  ringPlate(group, 0.19, 0.11, 0.03, M.couplingDark, -0.075, 0, 0, 40);
  sticker(
    group,
    makeTextTexture({
      text: 'FLEX',
      width: 280,
      height: 84,
      font: '600 40px "Arial", sans-serif',
      color: '#9eaaa7',
      tracking: 6,
    }),
    0.12,
    0.04,
    [0.05, 0.0, 0.286],
  );
  // Small keyed shaft end.
  cylinder(group, 0.055, 0.055, 0.18, M.steel, [-0.15, 0, 0], [0, 0, Math.PI / 2], 24);
}

function buildAlternator(group, M) {
  const radius = 0.43;
  const length = 1.04;

  // Main stator frame.
  const body = cylinder(group, radius, radius, length, M.alternator, [0, 0, 0], [0, 0, Math.PI / 2], 64);
  body.castShadow = true;
  // Slight waist detail.
  cylinder(group, radius + 0.012, radius + 0.012, 0.12, M.alternatorDark, [-0.31, 0, 0], [0, 0, Math.PI / 2], 64);
  cylinder(group, radius + 0.012, radius + 0.012, 0.12, M.alternatorDark, [0.31, 0, 0], [0, 0, Math.PI / 2], 64);

  // Cooling fins, leaving a smooth front arc for the identity plate.
  const finGeometry = new THREE.BoxGeometry(0.82, 0.05, 0.032);
  const finCount = 30;
  const fins = new THREE.InstancedMesh(finGeometry, M.alternatorDark, finCount);
  const dummy = new THREE.Object3D();
  let finIndex = 0;
  for (let i = 0; i < finCount + 8; i += 1) {
    const a = -Math.PI + 0.05 + (i / (finCount + 8)) * TAU;
    if (Math.abs(Math.atan2(Math.sin(a), Math.cos(a))) < 0.32) continue;
    if (finIndex >= finCount) break;
    dummy.position.set(0, Math.sin(a) * (radius + 0.03), Math.cos(a) * (radius + 0.03));
    dummy.rotation.set(Math.PI / 2 - a, 0, 0);
    dummy.updateMatrix();
    fins.setMatrixAt(finIndex, dummy.matrix);
    finIndex += 1;
  }
  fins.count = finIndex;
  fins.castShadow = true;
  fins.receiveShadow = true;
  fins.frustumCulled = false;
  group.add(fins);

  // End shields.
  cylinder(group, 0.4, 0.43, 0.08, M.alternatorDark, [-0.55, 0, 0], [0, 0, Math.PI / 2], 56);
  cylinder(group, 0.43, 0.38, 0.1, M.alternatorDark, [0.56, 0, 0], [0, 0, Math.PI / 2], 56);
  torus(group, 0.4, 0.025, M.steelDark, -0.59, 0, 0, Math.PI / 2, 56);
  torus(group, 0.385, 0.022, M.steel, 0.61, 0, 0, Math.PI / 2, 56);

  // Terminal box / exciter housing on top.
  box(group, 0.4, 0.25, 0.3, M.alternatorDark, -0.16, 0.43, 0, { r: 0.045 });
  box(group, 0.34, 0.025, 0.26, M.steelDark, -0.16, 0.565, 0, { r: 0.015 });
  for (const x of [-0.28, -0.04]) {
    cylinder(group, 0.035, 0.035, 0.07, M.steel, [x, 0.6, 0.06], [0, 0, 0], 16);
    cylinder(group, 0.024, 0.024, 0.085, M.brass, [x, 0.61, -0.04], [0, 0, 0], 12);
  }
  sticker(
    group,
    makeTextTexture({
      text: 'TERMINAL BOX',
      width: 420,
      height: 80,
      font: '500 30px "Arial", sans-serif',
      color: '#9ba7a3',
      tracking: 3,
    }),
    0.22,
    0.042,
    [-0.16, 0.565, 0.143],
  );

  // Curved STAMFORD wordmark on the cylinder side, between cooling fins.
  curvedSticker(
    group,
    makeTextTexture({
      text: 'STAMFORD',
      width: 1200,
      height: 220,
      font: '700 170px "Arial Narrow", Arial, sans-serif',
      color: '#f2eee2',
      tracking: 19,
    }),
    0.74,
    0.22,
    radius + 0.004,
    64,
    [0, 0.035, 0],
  );
  curvedSticker(
    group,
    makeTextTexture({
      text: 'HCI544  ·  IP23  ·  H CLASS',
      width: 1200,
      height: 100,
      font: '500 39px "Arial", sans-serif',
      color: '#95aaa2',
      tracking: 4,
    }),
    0.58,
    0.055,
    radius + 0.006,
    40,
    [0, -0.12, 0],
  );

  // Rating plate with a few embossed bolts.
  box(group, 0.2, 0.16, 0.015, M.steel, 0.33, -0.17, radius + 0.017, { r: 0.012, cast: false });
  sticker(
    group,
    makePlaqueTexture({
      eyebrow: 'STAMFORD',
      value: '500 kVA',
      footnote: '400 V  ·  50 Hz  ·  PF 0.8',
      dark: true,
    }),
    0.18,
    0.14,
    [0.33, -0.17, radius + 0.026],
  );

  // Feet.
  for (const side of [-1, 1]) {
    box(group, 0.86, 0.065, 0.15, M.alternatorDark, 0.02, -0.425, side * 0.31, { r: 0.025 });
    box(group, 0.2, 0.15, 0.19, M.alternatorDark, -0.3, -0.38, side * 0.31, { r: 0.025 });
    box(group, 0.2, 0.15, 0.19, M.alternatorDark, 0.35, -0.38, side * 0.31, { r: 0.025 });
    for (const x of [-0.38, 0.4]) {
      cylinder(group, 0.034, 0.034, 0.03, M.steel, [x, -0.465, side * 0.31], [0, 0, 0], 16);
    }
  }

  // Rotation grille at the non-drive end.
  const grille = new THREE.Group();
  grille.position.set(0.67, 0, 0);
  group.add(grille);
  for (let i = 0; i < 4; i += 1) {
    torus(grille, 0.11 + i * 0.062, 0.011, M.steelDark, 0, 0, 0, Math.PI / 2, 32);
  }
  for (let i = 0; i < 12; i += 1) {
    const a = (i / 12) * TAU;
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.018, 0.36), M.steelDark);
    spoke.position.set(0, Math.sin(a) * 0.18, Math.cos(a) * 0.18);
    spoke.rotation.set(Math.PI / 2 - a, 0, 0);
    finalize(spoke);
    grille.add(spoke);
  }
  cylinder(grille, 0.06, 0.06, 0.07, M.steelDark, [0.03, 0, 0], [0, 0, Math.PI / 2], 24);

  // Bolt ring on drive end.
  for (let i = 0; i < 12; i += 1) {
    const a = (i / 12) * TAU;
    bolt(group, -0.605, Math.sin(a) * 0.32, Math.cos(a) * 0.32, M.steel, 'x', 0.018);
  }
  for (let i = 0; i < 8; i += 1) {
    const a = (i / 8) * TAU;
    bolt(group, 0.625, Math.sin(a) * 0.3, Math.cos(a) * 0.3, M.steel, 'x', 0.016);
  }

  // Lifting eyes and small cable entry.
  for (const x of [-0.33, 0.3]) {
    const eye = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.014, 8, 24, Math.PI * 1.35), M.steelDark);
    eye.position.set(x, 0.51, 0.02);
    eye.rotation.set(0, 0, -0.35);
    finalize(eye);
    group.add(eye);
  }
  tube(
    group,
    [
      [0.02, 0.55, 0.02],
      [0.16, 0.63, 0.08],
      [0.34, 0.56, 0.16],
    ],
    0.026,
    M.harness,
    8,
    28,
  );

  // Subtle warning label.
  sticker(
    group,
    makeHazardTexture('VOLTAGE', '400 / 230 V · 50 Hz'),
    0.22,
    0.15,
    [-0.43, -0.18, 0.438],
  );

  // Cooling air inlet slots near the terminal box.
  for (let i = 0; i < 5; i += 1) {
    box(group, 0.2, 0.012, 0.012, M.steelDark, -0.42, 0.36 + i * 0.026, 0.36, {
      r: 0.004,
      cast: false,
    });
  }
}

function buildRadiator(group, M) {
  // Core and frame.
  box(group, 0.22, 1.18, 1.2, M.radiatorCore, 0, 0, 0, { r: 0.025, seg: 3 });
  const finGeo = new THREE.BoxGeometry(0.195, 1.08, 0.014);
  const fins = new THREE.InstancedMesh(finGeo, M.radiatorFin, 38);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < 38; i += 1) {
    dummy.position.set(0.012, 0, -0.56 + (i / 37) * 1.12);
    dummy.updateMatrix();
    fins.setMatrixAt(i, dummy.matrix);
  }
  fins.castShadow = true;
  fins.receiveShadow = true;
  fins.frustumCulled = false;
  group.add(fins);

  box(group, 0.32, 0.19, 1.22, M.radiatorTank, 0, 0.68, 0, { r: 0.06 });
  box(group, 0.32, 0.19, 1.22, M.radiatorTank, 0, -0.68, 0, { r: 0.06 });
  for (const side of [-1, 1]) {
    box(group, 0.28, 1.42, 0.075, M.radiatorFrame, 0, 0, side * 0.65, { r: 0.025 });
    box(group, 0.11, 1.36, 0.04, M.steelDark, 0.15, 0, side * 0.635, { r: 0.015 });
    box(group, 0.27, 0.1, 0.16, M.steelDark, 0, 0.78, side * 0.56, { r: 0.02 });
  }
  // Top tanks, hose necks and pressure cap.
  cylinder(group, 0.085, 0.085, 0.16, M.aluminum, [0, 0.77, 0.31], [0, 0, 0], 24);
  cylinder(group, 0.055, 0.055, 0.16, M.aluminum, [0, -0.75, 0.31], [0, 0, 0], 20);
  cylinder(group, 0.095, 0.095, 0.07, M.steelDark, [0, 0.88, 0.34], [0, 0, 0], 24);
  cylinder(group, 0.072, 0.072, 0.045, M.brass, [0, 0.93, 0.34], [0, 0, 0], 20);
  box(group, 0.1, 0.035, 0.1, M.steelDark, 0, 0.955, 0.34, { r: 0.015 });
  // Fan shroud.
  cylinder(group, 0.6, 0.6, 0.085, M.fanShroud, [0.23, 0, 0], [0, 0, Math.PI / 2], 64, true);
  torus(group, 0.6, 0.035, M.steelDark, 0.275, 0, 0, Math.PI / 2, 64);
  torus(group, 0.5, 0.02, M.steelDark, 0.28, 0, 0, Math.PI / 2, 64);
  torus(group, 0.585, 0.012, M.steel, 0.355, 0, 0, Math.PI / 2, 64);
  torus(group, 0.54, 0.007, M.steelDark, 0.357, 0, 0, Math.PI / 2, 64);
  for (let i = 0; i < 4; i += 1) {
    const a = (i / 4) * TAU + Math.PI / 4;
    const strut = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.035, 0.58), M.steelDark);
    strut.position.set(0.28, Math.sin(a) * 0.3, Math.cos(a) * 0.3);
    strut.rotation.set(Math.PI / 4 - a, 0, 0);
    finalize(strut);
    group.add(strut);
  }

  // Fan rotor. Its rotation is animated subtly by the page.
  const fan = new THREE.Group();
  fan.name = 'cooling-fan';
  fan.position.set(0.34, 0, 0);
  fan.userData.fan = true;
  group.add(fan);
  const fanMat = M.fan;
  const bladeGeometry = new THREE.BoxGeometry(0.035, 0.39, 0.12);
  for (let i = 0; i < 7; i += 1) {
    const pivot = new THREE.Group();
    pivot.rotation.x = (i / 7) * TAU;
    const blade = new THREE.Mesh(bladeGeometry, fanMat);
    blade.position.set(0, 0.27, 0);
    blade.rotation.y = 0.46;
    blade.castShadow = true;
    blade.receiveShadow = true;
    pivot.add(blade);
    fan.add(pivot);
  }
  cylinder(fan, 0.09, 0.1, 0.14, M.steelDark, [0, 0, 0], [0, 0, Math.PI / 2], 24);
  cylinder(fan, 0.035, 0.035, 0.16, M.steel, [0.04, 0, 0], [0, 0, Math.PI / 2], 16);
  cylinder(fan, 0.055, 0.07, 0.035, M.steel, [0.13, 0, 0], [0, 0, Math.PI / 2], 24);
  torus(group, 0.075, 0.009, M.brass, 0.43, 0, 0, Math.PI / 2, 32);
  tube(
    group,
    [
      [0.065, 0.0, 0.16],
      [0.2, 0.02, 0.3],
      [0.39, 0.03, 0.36],
      [0.48, 0.02, 0.31],
    ],
    0.018,
    M.harnessYellow,
    6,
    24,
  );

  // Mounting feet.
  for (const z of [-0.45, 0.45]) {
    box(group, 0.34, 0.1, 0.12, M.steelDark, 0, -0.79, z, { r: 0.02 });
    cylinder(group, 0.028, 0.028, 0.03, M.steel, [0, -0.84, z], [0, 0, 0], 12);
  }

  // Upper and lower radiator hoses, articulated toward the engine.
  tube(
    group,
    [
      [0.04, 0.76, 0.31],
      [0.25, 0.7, 0.28],
      [0.56, 0.55, 0.23],
      [0.88, 0.42, 0.2],
      [1.14, 0.39, 0.2],
    ],
    0.057,
    M.hose,
    12,
    44,
  );
  tube(
    group,
    [
      [0.04, -0.72, 0.31],
      [0.28, -0.63, 0.28],
      [0.64, -0.39, 0.24],
      [0.92, -0.19, 0.2],
      [1.12, -0.15, 0.18],
    ],
    0.045,
    M.hose,
    10,
    40,
  );
  for (const p of [
    [0.28, 0.69, 0.28],
    [1.02, 0.4, 0.2],
    [0.3, -0.62, 0.28],
    [1.03, -0.17, 0.19],
  ]) {
    const clamp = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.011, 6, 22), M.steelDark);
    clamp.position.set(...p);
    clamp.rotation.set(0, 0, 0);
    finalize(clamp);
    group.add(clamp);
  }

  // Header details and warning label.
  sticker(
    group,
    makeHazardTexture('HOT COOLANT', '高温冷却液 · 压力盖'),
    0.28,
    0.18,
    [-0.17, 0.42, 0.61],
    [0, -Math.PI / 2, 0],
  );
  sticker(
    group,
    makeTextTexture({
      text: 'RADIATOR  /  66 L',
      width: 700,
      height: 100,
      font: '500 34px "Arial", sans-serif',
      color: '#88948f',
      tracking: 4,
    }),
    0.38,
    0.055,
    [0.1, -0.73, 0.611],
  );
  for (let i = 0; i < 8; i += 1) {
    bolt(group, 0.05 + (i % 2) * 0.03, 0.82 + Math.floor(i / 2) * -0.1, 0.56, M.steel, 'x', 0.012);
  }

  // Fan drive shaft.
  cylinder(group, 0.035, 0.035, 0.35, M.steel, [0.47, 0, 0], [0, 0, Math.PI / 2], 16);
}

function buildAirCleaner(group, M) {
  // Horizontal cylindrical housing.
  cylinder(group, 0.17, 0.17, 0.72, M.airCleaner, [0, 0, 0], [0, 0, Math.PI / 2], 32);
  for (const x of [-0.36, 0.36]) {
    cylinder(group, 0.19, 0.19, 0.055, M.steelDark, [x, 0, 0], [0, 0, Math.PI / 2], 32);
    torus(group, 0.181, 0.015, M.steel, x, 0, 0, Math.PI / 2, 32);
    for (let i = 0; i < 8; i += 1) {
      const a = (i / 8) * TAU;
      bolt(group, x + 0.03, Math.sin(a) * 0.155, Math.cos(a) * 0.155, M.steel, 'x', 0.012);
    }
  }
  // End cap and pre-cleaner mushroom.
  cylinder(group, 0.17, 0.17, 0.08, M.airCleaner, [-0.43, 0, 0], [0, 0, Math.PI / 2], 32);
  cylinder(group, 0.24, 0.24, 0.05, M.steelDark, [-0.5, 0, 0], [0, 0, Math.PI / 2], 36);
  cylinder(group, 0.21, 0.24, 0.13, M.airCleanerDark, [-0.59, 0, 0], [0, 0, Math.PI / 2], 32);
  cylinder(group, 0.075, 0.075, 0.06, M.steel, [-0.68, 0, 0], [0, 0, Math.PI / 2], 20);
  // Mounting strap and bracket.
  for (const x of [-0.2, 0.2]) {
    torus(group, 0.178, 0.018, M.steelDark, x, 0, 0, Math.PI / 2, 36);
  }
  box(group, 0.06, 0.32, 0.08, M.steelDark, 0.24, -0.22, 0.05, { r: 0.015 });
  box(group, 0.3, 0.04, 0.14, M.steelDark, 0.24, -0.4, 0.05, { r: 0.015 });
  // Outlet duct turning down to the intake manifold.
  tube(
    group,
    [
      [0.39, -0.02, 0.01],
      [0.56, -0.04, 0.0],
      [0.72, -0.13, -0.02],
      [0.78, -0.34, -0.05],
      [0.73, -0.43, -0.08],
    ],
    0.075,
    M.intakeHose,
    12,
    36,
  );
  const clamp = new THREE.Mesh(new THREE.TorusGeometry(0.078, 0.012, 6, 24), M.steelDark);
  clamp.position.set(0.42, -0.03, 0.02);
  clamp.rotation.set(0, Math.PI / 2, 0);
  finalize(clamp);
  group.add(clamp);
  sticker(
    group,
    makeTextTexture({
      text: 'AIR CLEANER',
      width: 700,
      height: 100,
      font: '600 42px "Arial", sans-serif',
      color: '#c7d0cb',
      tracking: 6,
    }),
    0.3,
    0.048,
    [0.02, 0.02, 0.174],
  );
  sticker(
    group,
    makeHazardTexture('FILTER', '定期检查 · 进气阻力'),
    0.18,
    0.13,
    [0.23, 0.0, 0.173],
  );
}

function buildExhaust(group, M) {
  // Horizontal silencer body with rolled ends.
  cylinder(group, 0.165, 0.165, 0.8, M.exhaust, [0, 0, 0], [0, 0, Math.PI / 2], 40);
  for (const x of [-0.4, 0.4]) {
    cylinder(group, 0.175, 0.175, 0.035, M.exhaustDark, [x, 0, 0], [0, 0, Math.PI / 2], 40);
    torus(group, 0.166, 0.012, M.steel, x - 0.006, 0, 0, Math.PI / 2, 40);
  }
  for (const x of [-0.21, 0.2]) {
    torus(group, 0.17, 0.015, M.exhaustDark, x, 0, 0, Math.PI / 2, 40);
    box(group, 0.055, 0.18, 0.045, M.steelDark, x, -0.13, 0.3, { r: 0.012 });
  }
  // Heat shield shell over the top of the silencer.
  const shield = cylinder(group, 0.205, 0.205, 0.66, M.heatShield, [0, 0.015, 0], [0, 0, Math.PI / 2], 48, true);
  shield.material.side = THREE.DoubleSide;
  for (let i = 0; i < 9; i += 1) {
    torus(group, 0.205, 0.006, M.exhaustDark, -0.29 + i * 0.072, 0.015, 0, Math.PI / 2, 32);
  }
  // Inlet pipe from the turbo, heat-tinted.
  tube(
    group,
    [
      [-0.8, -0.17, -0.1],
      [-0.72, -0.02, -0.08],
      [-0.57, 0.04, -0.02],
      [-0.4, 0.03, 0.0],
    ],
    0.072,
    M.exhaustHeat,
    14,
    40,
  );
  torus(group, 0.076, 0.014, M.steelDark, -0.79, -0.15, -0.1, 0, 32);
  cylinder(group, 0.09, 0.08, 0.06, M.exhaustDark, [-0.84, -0.21, -0.1], [0, 0, Math.PI / 2], 24);
  // Vertical tailpipe and rain cap.
  tube(
    group,
    [
      [0.38, 0.03, 0.02],
      [0.53, 0.11, 0.0],
      [0.56, 0.33, 0.0],
      [0.56, 0.58, 0.0],
    ],
    0.045,
    M.exhaust,
    10,
    36,
  );
  cylinder(group, 0.07, 0.07, 0.035, M.exhaustDark, [0.56, 0.6, 0], [0, 0, 0], 24);
  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.07, 24, 1, true), M.exhaustDark);
  cap.position.set(0.56, 0.66, 0);
  cap.castShadow = true;
  group.add(cap);
  // Brackets.
  box(group, 0.05, 0.3, 0.05, M.steelDark, -0.28, -0.25, 0.38, { r: 0.012 });
  box(group, 0.4, 0.04, 0.18, M.steelDark, -0.11, -0.41, 0.38, { r: 0.012 });
  // Clamp band details.
  for (const x of [-0.68, 0.48]) {
    torus(group, 0.065, 0.012, M.steel, x, x < 0 ? -0.05 : 0.22, x < 0 ? -0.08 : 0, 0, 28);
  }
  sticker(
    group,
    makeHazardTexture('WARNING', '高温排气 · HOT EXHAUST'),
    0.29,
    0.18,
    [0.08, 0.055, 0.209],
    [0, 0, 0],
  );
  sticker(
    group,
    makeTextTexture({
      text: 'SILENCER  /  ≤ 10 kPa',
      width: 740,
      height: 90,
      font: '500 30px "Arial", sans-serif',
      color: '#98a29d',
      tracking: 2,
    }),
    0.4,
    0.052,
    [-0.02, -0.035, 0.211],
  );
}

function buildController(group, M) {
  // Bracket.
  box(group, 0.52, 0.05, 0.22, M.steelDark, 0.02, 0.02, 0.07, { r: 0.015 });
  box(group, 0.06, 0.22, 0.07, M.steelDark, -0.18, -0.09, 0.04, { r: 0.012 });
  box(group, 0.06, 0.22, 0.07, M.steelDark, 0.24, -0.09, 0.04, { r: 0.012 });
  // Enclosure, slightly tilted up for reading.
  const housing = new THREE.Group();
  housing.position.set(0.02, 0.2, 0.08);
  housing.rotation.x = -0.1;
  group.add(housing);
  box(housing, 0.62, 0.4, 0.16, M.controller, 0, 0, 0, { r: 0.05, seg: 4 });
  box(housing, 0.57, 0.35, 0.012, M.controllerFace, 0, 0, 0.083, { r: 0.032 });
  // Screen.
  const screenTexture = makeControllerScreenTexture();
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.4, 0.225),
    new THREE.MeshBasicMaterial({ map: screenTexture, toneMapped: false }),
  );
  screen.position.set(-0.045, 0.05, 0.097);
  screen.userData.noHighlight = true;
  housing.add(screen);
  box(housing, 0.43, 0.25, 0.012, M.screenBezel, -0.045, 0.05, 0.086, { r: 0.018, cast: false });
  // Buttons and LEDs.
  for (let i = 0; i < 6; i += 1) {
    const x = 0.17 + (i % 2) * 0.07;
    const y = 0.12 - Math.floor(i / 2) * 0.08;
    cylinder(housing, 0.018, 0.018, 0.012, M.controllerButton, [x, y, 0.094], [Math.PI / 2, 0, 0], 14);
  }
  for (let i = 0; i < 3; i += 1) {
    const material = i === 0 ? M.ledGreen : i === 1 ? M.ledAmber : M.ledRed;
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.009, 10, 10), material);
    led.position.set(-0.23, -0.16, 0.096);
    housing.add(led);
    cylinder(housing, 0.013, 0.013, 0.012, M.screenBezel, [-0.23, -0.16, 0.09], [Math.PI / 2, 0, 0], 12);
  }
  sticker(
    housing,
    makeTextTexture({
      text: 'POWER COMMAND',
      width: 700,
      height: 80,
      font: '600 29px "Arial", sans-serif',
      color: '#aeb8b3',
      tracking: 5,
    }),
    0.24,
    0.028,
    [0.08, 0.175, 0.092],
  );
  sticker(
    housing,
    makePlaqueTexture({
      eyebrow: 'GENSET CONTROLLER',
      value: '50 Hz',
      footnote: 'READY  ·  400 V  ·  1500 rpm',
      dark: true,
    }),
    0.17,
    0.12,
    [0.21, -0.1, 0.092],
  );
  for (let i = 0; i < 5; i += 1) {
    box(housing, 0.12, 0.012, 0.012, M.steelDark, -0.23, -0.02 + i * 0.022, 0.092, {
      r: 0.003,
      cast: false,
    });
  }
  // Door latch and small grab handle.
  box(group, 0.035, 0.09, 0.045, M.steel, 0.38, 0.19, 0.19, { r: 0.01 });
  tube(
    group,
    [
      [0.36, 0.16, 0.19],
      [0.45, 0.12, 0.19],
      [0.45, 0.01, 0.19],
      [0.39, -0.04, 0.19],
    ],
    0.012,
    M.steelDark,
    6,
    20,
  );
}

function buildBattery(group, M) {
  // Battery tray.
  box(group, 0.54, 0.035, 0.27, M.steelDark, 0, -0.1, 0, { r: 0.012 });
  box(group, 0.55, 0.08, 0.03, M.steelDark, 0, -0.06, 0.135, { r: 0.01 });
  box(group, 0.55, 0.08, 0.03, M.steelDark, 0, -0.06, -0.135, { r: 0.01 });

  // Two 12 V batteries side by side.
  for (let i = 0; i < 2; i += 1) {
    const x = -0.14 + i * 0.28;
    box(group, 0.25, 0.22, 0.23, M.battery, x, 0.06, 0, { r: 0.025, seg: 3 });
    box(group, 0.24, 0.015, 0.22, M.batteryTop, x, 0.177, 0, { r: 0.025 });
    // Terminals.
    cylinder(group, 0.026, 0.026, 0.035, M.batteryRed, [x - 0.08, 0.207, 0.065], [0, 0, 0], 16);
    cylinder(group, 0.026, 0.026, 0.035, M.steelDark, [x + 0.08, 0.207, 0.065], [0, 0, 0], 16);
    box(group, 0.18, 0.012, 0.018, M.steel, x, 0.213, -0.06, { r: 0.008, cast: false });
    sticker(
      group,
      makeTextTexture({
        text: '12V  ·  VRLA',
        width: 340,
        height: 90,
        font: '600 35px "Arial", sans-serif',
        color: '#252a29',
        tracking: 2,
      }),
      0.16,
      0.04,
      [x, 0.11, 0.117],
    );
  }
  // Interconnect and starter cables.
  tube(
    group,
    [
      [-0.06, 0.22, 0.065],
      [0.04, 0.29, 0.04],
      [0.12, 0.27, 0.0],
      [0.14, 0.22, 0.065],
    ],
    0.014,
    M.cableRed,
    6,
    24,
  );
  tube(
    group,
    [
      [0.22, 0.22, 0.065],
      [0.3, 0.32, 0.05],
      [0.34, 0.38, -0.02],
      [0.3, 0.45, -0.08],
    ],
    0.016,
    M.cableRed,
    6,
    24,
  );
  tube(
    group,
    [
      [-0.22, 0.21, 0.065],
      [-0.31, 0.27, 0.04],
      [-0.34, 0.24, -0.04],
      [-0.28, 0.18, -0.1],
    ],
    0.015,
    M.cableBlack,
    6,
    24,
  );
  box(group, 0.12, 0.08, 0.09, M.steelDark, 0.2, 0.05, -0.14, { r: 0.015 });
  sticker(
    group,
    makeHazardTexture('24 V DC', '启动电源 · 双电池串联'),
    0.24,
    0.16,
    [0, 0.02, 0.142],
  );
}

function buildCanopy(M) {
  const group = new THREE.Group();
  group.name = 'silent-canopy';
  group.visible = false;

  const panels = [];
  const materials = new Set();
  const shellMat = M.canopy;
  const trimMat = M.canopyTrim;
  const darkMat = M.canopyDark;

  const front = buildCanopyWall({
    name: 'front',
    size: [4.6, 2.2, 0.075],
    position: [0, 1.46, 0.965],
    M,
    louverSide: 'left',
    doorXs: [-1.12, 0.16],
    outward: 1,
  });
  group.add(front.group);
  panels.push(front);

  const rear = buildCanopyWall({
    name: 'rear',
    size: [4.6, 2.2, 0.075],
    position: [0, 1.46, -0.965],
    M,
    louverSide: 'right',
    doorXs: [],
    outward: -1,
  });
  group.add(rear.group);
  panels.push(rear);

  const left = buildCanopyWall({
    name: 'left',
    size: [1.93, 2.2, 0.075],
    position: [-2.3, 1.46, 0],
    M,
    louverSide: null,
    doorXs: [],
    outward: -1,
    rotationY: Math.PI / 2,
  });
  group.add(left.group);
  panels.push(left);

  const right = buildCanopyWall({
    name: 'right',
    size: [1.93, 2.2, 0.075],
    position: [2.3, 1.46, 0],
    M,
    louverSide: null,
    doorXs: [],
    outward: 1,
    rotationY: -Math.PI / 2,
  });
  group.add(right.group);
  panels.push(right);

  // Roof with a low crown and lifting eyes.
  const roof = new THREE.Group();
  roof.position.set(0, 2.59, 0);
  group.add(roof);
  box(roof, 4.72, 0.1, 2.02, shellMat, 0, 0, 0, { r: 0.06, seg: 4 });
  box(roof, 4.58, 0.035, 1.9, trimMat, 0, 0.06, 0, { r: 0.025 });
  for (const x of [-1.85, 1.85]) {
    for (const z of [-0.78, 0.78]) {
      cylinder(roof, 0.055, 0.055, 0.035, darkMat, [x, 0.075, z], [0, 0, 0], 20);
      const eye = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.015, 8, 22, Math.PI * 1.3), M.steelDark);
      eye.position.set(x, 0.12, z);
      eye.rotation.set(0, 0, -0.25);
      finalize(eye);
      roof.add(eye);
    }
  }
  // Roof exhaust vent and a small rain deflector.
  box(roof, 0.75, 0.1, 0.42, darkMat, -0.7, 0.09, 0.25, { r: 0.035 });
  for (let i = 0; i < 7; i += 1) {
    box(roof, 0.11, 0.018, 0.28, trimMat, -0.98 + i * 0.09, 0.15, 0.25, { r: 0.008 });
  }
  panels.push({
    name: 'roof',
    group: roof,
    closed: roof.position.clone(),
    open: roof.position.clone().add(new THREE.Vector3(0, 1.15, 0)),
    closedRot: new THREE.Euler(),
    openRot: new THREE.Euler(0.05, 0, 0),
    outward: 0,
  });

  // Panel explosions go outward from the machine. Rotation gives a more legible silhouette.
  front.open.copy(front.closed.clone().add(new THREE.Vector3(0, 0.1, 0.85)));
  rear.open.copy(rear.closed.clone().add(new THREE.Vector3(0, 0.14, -0.85)));
  left.open.copy(left.closed.clone().add(new THREE.Vector3(-0.95, 0.2, 0)));
  right.open.copy(right.closed.clone().add(new THREE.Vector3(0.95, 0.28, 0)));
  left.openRot = new THREE.Euler(0, Math.PI / 2 - 0.08, 0);
  right.openRot = new THREE.Euler(0, -Math.PI / 2 + 0.08, 0);

  // Side identity panels, mounted on the outward face of each side wall.
  for (const panel of [left, right]) {
    const outward = panel.name === 'left' ? -1 : 1;
    const text = panel.name === 'left' ? 'KTA19-G3' : 'SILENT';
    const sub = panel.name === 'left' ? 'CUMMINS × STAMFORD  /  500 kVA' : 'ACOUSTIC ENCLOSURE';
    const z = outward * 0.081;
    const rotation = outward < 0 ? [0, Math.PI, 0] : [0, 0, 0];
    sticker(
      panel.group,
      makeTextTexture({
        text,
        width: 900,
        height: 170,
        font: '700 103px "Arial Narrow", Arial, sans-serif',
        color: '#d6ded7',
        tracking: 8,
      }),
      1.25,
      0.24,
      [-0.12, 0.45, z],
      rotation,
    );
    sticker(
      panel.group,
      makeTextTexture({
        text: sub,
        width: 950,
        height: 90,
        font: '500 32px "Arial", sans-serif',
        color: '#7f9790',
        tracking: 4,
      }),
      1.12,
      0.1,
      [-0.12, 0.28, z + outward * 0.001],
      rotation,
    );
    // Three low-level vent slots so the side panel still reads as an acoustic enclosure.
    for (let i = 0; i < 3; i += 1) {
      box(panel.group, 0.52, 0.022, 0.008, darkMat, -0.45, -0.64 + i * 0.055, outward * 0.043, {
        r: 0.006,
        cast: false,
      });
    }
  }

  sticker(
    front.group,
    makePlaqueTexture({
      eyebrow: 'SILENT PACKAGE',
      value: 'KTA19-G3',
      footnote: 'CUMMINS  ·  500 kVA  ·  50 Hz',
      dark: true,
    }),
    0.5,
    0.2,
    [1.68, 0.18, 0.083],
  );
  sticker(
    front.group,
    makeHazardTexture('DANGER', '高压 · 请由专业人员操作'),
    0.26,
    0.17,
    [1.68, -0.18, 0.083],
  );
  sticker(
    front.group,
    makeTextTexture({
      text: 'SILENT',
      width: 1000,
      height: 220,
      font: '700 162px "Arial Narrow", Arial, sans-serif',
      color: '#9bb4ab',
      tracking: 22,
    }),
    1.05,
    0.23,
    [-0.55, -0.62, 0.083],
  );
  sticker(
    front.group,
    makeTextTexture({
      text: 'KTA19-G3  /  STAMFORD  /  500 kVA',
      width: 1000,
      height: 90,
      font: '500 30px "Arial", sans-serif',
      color: '#728a82',
      tracking: 4,
    }),
    0.94,
    0.085,
    [-0.55, -0.76, 0.083],
  );
  box(front.group, 1.05, 0.012, 0.012, M.canopyTrim, -0.55, -0.52, 0.084, { r: 0.004, cast: false });

  group.traverse((object) => {
    if (!object.isMesh) return;
    const mats = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of mats) {
      if (material) materials.add(material);
    }
    // Decals are printed on one side of the metal panel. Rendering them
    // single-sided keeps ghosted panels from showing mirrored artwork.
    if (object.material?.isMeshBasicMaterial && object.material.map) {
      object.material.side = THREE.FrontSide;
    }
  });

  function buildCanopyWall({ name, size, position, louverSide, doorXs = [], outward = 1, rotationY = 0 }) {
    const wall = new THREE.Group();
    wall.name = name;
    wall.position.fromArray(position);
    wall.rotation.y = rotationY;
    const surfaceZ = (offset = 0) => outward * (size[2] / 2 + offset);

    box(wall, size[0], size[1], size[2], shellMat, 0, 0, 0, { r: 0.035, seg: 3 });
    box(wall, size[0] - 0.12, 0.055, 0.028, trimMat, 0, size[1] / 2 - 0.08, surfaceZ(0.012), {
      r: 0.012,
    });
    box(wall, size[0] - 0.12, 0.055, 0.028, trimMat, 0, -size[1] / 2 + 0.08, surfaceZ(0.012), {
      r: 0.012,
    });
    // Corner posts.
    for (const x of [-size[0] / 2 + 0.045, size[0] / 2 - 0.045]) {
      box(wall, 0.075, size[1] - 0.02, 0.035, trimMat, x, 0, surfaceZ(0.02), { r: 0.012 });
    }
    // Vertical seams / handed access panels.
    for (const x of doorXs) {
      box(wall, 0.012, size[1] - 0.18, 0.018, darkMat, x, 0, surfaceZ(0.045), {
        r: 0.004,
        cast: false,
      });
      const handleX = x + 0.11;
      box(wall, 0.025, 0.16, 0.03, M.steel, handleX, -0.04, surfaceZ(0.06), { r: 0.008 });
      for (const hingeY of [-0.65, 0.6]) {
        box(wall, 0.055, 0.11, 0.022, M.steelDark, x - 0.08, hingeY, surfaceZ(0.055), {
          r: 0.008,
        });
      }
    }
    if (louverSide) {
      // Louver bank embedded in the panel.
      const louvX = louverSide === 'left' ? -size[0] / 2 + 0.48 : size[0] / 2 - 0.48;
      box(wall, 0.62, 0.55, 0.028, M.canopyVent, louvX, 0.42, surfaceZ(0.04), { r: 0.035 });
      for (let i = 0; i < 9; i += 1) {
        box(wall, 0.55, 0.026, 0.022, darkMat, louvX, 0.2 + i * 0.058, surfaceZ(0.058), {
          r: 0.007,
          cast: false,
        });
      }
      // Lower service hatch.
      box(wall, 0.7, 0.38, 0.025, M.canopyDark, louvX, -0.48, surfaceZ(0.04), { r: 0.03 });
    }
    // Subtle vertical rib lines.
    for (let i = 0; i < 5; i += 1) {
      box(
        wall,
        0.012,
        size[1] - 0.3,
        0.012,
        darkMat,
        -size[0] / 2 + 0.7 + (i * (size[0] - 1.4)) / 4,
        0,
        surfaceZ(0.03),
        { r: 0.004, cast: false },
      );
    }
    return {
      group: wall,
      name,
      outward,
      closed: wall.position.clone(),
      open: wall.position.clone(),
      closedRot: new THREE.Euler(0, rotationY, 0),
      openRot: new THREE.Euler(0, rotationY, 0),
    };
  }

  return { group, panels, materials };
}
function mergeStaticPartGeometry(part) {
  const group = part.group;
  group.updateMatrixWorld(true);
  const inverseGroup = new THREE.Matrix4().copy(group.matrixWorld).invert();
  const buckets = new Map();

  group.traverse((object) => {
    if (!object.isMesh || object.isInstancedMesh) return;
    if (!object.geometry || Array.isArray(object.material)) return;
    if (object.material?.transparent) return;
    if (object.geometry.morphAttributes && Object.keys(object.geometry.morphAttributes).length) return;
    if (isInsideAnimatedGroup(object, group)) return;
    const material = object.material;
    if (!buckets.has(material)) buckets.set(material, []);
    buckets.get(material).push(object);
  });

  const mergeLog = [];
  for (const [material, meshes] of buckets) {
    if (meshes.length < 2) continue;
    const geometries = [];
    for (const mesh of meshes) {
      let geometry = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone();
      const matrix = new THREE.Matrix4().multiplyMatrices(inverseGroup, mesh.matrixWorld);
      geometry.applyMatrix4(matrix);
      for (const attribute of Object.keys(geometry.attributes)) {
        if (!['position', 'normal', 'uv'].includes(attribute)) geometry.deleteAttribute(attribute);
      }
      if (!geometry.attributes.normal) geometry.computeVertexNormals();
      if (!geometry.attributes.uv) {
        geometry.setAttribute(
          'uv',
          new THREE.BufferAttribute(new Float32Array(geometry.attributes.position.count * 2), 2),
        );
      }
      geometry.clearGroups();
      geometries.push(geometry);
    }
    const merged = mergeGeometries(geometries, false);
    for (const geometry of geometries) geometry.dispose();
    if (!merged) continue;
    const mergedMesh = new THREE.Mesh(merged, material);
    mergedMesh.castShadow = true;
    mergedMesh.receiveShadow = true;
    mergedMesh.name = `merged-${material.name || material.type}`;
    group.add(mergedMesh);
    mergeLog.push([material, meshes.length]);
    for (const mesh of meshes) {
      if (mesh.parent) mesh.parent.remove(mesh);
    }
  }
  part.metadata = { mergedBatches: mergeLog.map(([material, count]) => [material.type, count]) };
}

function isInsideAnimatedGroup(object, root) {
  let current = object;
  while (current && current !== root) {
    if (current.userData?.fan || current.name === 'cooling-fan') return true;
    current = current.parent;
  }
  return false;
}

/* ------------------------------------------------------------------------- */
/* Material and texture helpers                                              */
/* ------------------------------------------------------------------------- */

function createSurfaceMaps() {
  const grain = makeNoiseTexture(192, 18, 140, 255);
  grain.wrapS = THREE.RepeatWrapping;
  grain.wrapT = THREE.RepeatWrapping;
  grain.repeat.set(5, 5);

  const cast = makeNoiseTexture(256, 24, 100, 230);
  cast.wrapS = THREE.RepeatWrapping;
  cast.wrapT = THREE.RepeatWrapping;
  cast.repeat.set(7, 7);

  const brushed = makeBrushedTexture();
  brushed.wrapS = THREE.RepeatWrapping;
  brushed.wrapT = THREE.RepeatWrapping;
  brushed.repeat.set(4, 1);

  const tread = makeTreadTexture();
  tread.wrapS = THREE.RepeatWrapping;
  tread.wrapT = THREE.RepeatWrapping;
  tread.repeat.set(10, 4);

  return { grain, cast, brushed, tread };
}

function createMaterials(surface) {
  const std = (params) => new THREE.MeshStandardMaterial({
    roughnessMap: surface.grain,
    ...params,
  });
  const painted = (params) => new THREE.MeshPhysicalMaterial({
    roughnessMap: surface.grain,
    clearcoat: 0.34,
    clearcoatRoughness: 0.62,
    ...params,
  });

  const M = {
    surface,
    engine: std({
      color: 0x424a4a,
      metalness: 0.4,
      roughness: 0.5,
      roughnessMap: surface.cast,
      bumpMap: surface.cast,
      bumpScale: 0.003,
    }),
    engineDark: std({ color: 0x262d2e, metalness: 0.42, roughness: 0.54 }),
    engineLight: std({ color: 0x555c5b, metalness: 0.38, roughness: 0.52, roughnessMap: surface.cast }),
    valveCover: painted({ color: 0xa63730, metalness: 0.3, roughness: 0.4 }),
    redDark: std({ color: 0x5d1615, metalness: 0.42, roughness: 0.42 }),
    oilPan: std({ color: 0x2a3233, metalness: 0.34, roughness: 0.62, bumpMap: surface.cast, bumpScale: 0.002 }),
    castIron: std({ color: 0x4d5250, metalness: 0.58, roughness: 0.6, roughnessMap: surface.cast }),
    turbo: std({ color: 0xa5a6a0, metalness: 0.92, roughness: 0.34 }),
    turboDark: std({ color: 0x514b45, metalness: 0.8, roughness: 0.5 }),
    steel: std({ color: 0xc3c4bd, metalness: 0.9, roughness: 0.28, roughnessMap: surface.brushed }),
    steelDark: std({ color: 0x5b6262, metalness: 0.72, roughness: 0.44, roughnessMap: surface.brushed }),
    aluminum: std({ color: 0xaeb5b2, metalness: 0.84, roughness: 0.34 }),
    brass: std({ color: 0xb18e58, metalness: 0.86, roughness: 0.33 }),
    rubber: std({ color: 0x121617, metalness: 0.08, roughness: 0.84, bumpMap: surface.grain, bumpScale: 0.001 }),
    hose: std({ color: 0x1a1f20, metalness: 0.15, roughness: 0.68, bumpMap: surface.grain, bumpScale: 0.002 }),
    hoseBlack: std({ color: 0x0f1213, metalness: 0.12, roughness: 0.76 }),
    intakeHose: std({ color: 0x242c2d, metalness: 0.2, roughness: 0.58 }),
    harness: std({ color: 0x242a2a, metalness: 0.1, roughness: 0.72 }),
    harnessYellow: std({ color: 0xb48d2d, metalness: 0.25, roughness: 0.55 }),
    filter: std({ color: 0x1b2020, metalness: 0.28, roughness: 0.55 }),
    warning: painted({ color: 0xd9a73e, metalness: 0.22, roughness: 0.48 }),
    basePaint: painted({
      color: 0x1c2122,
      metalness: 0.22,
      roughness: 0.54,
      clearcoat: 0.1,
      roughnessMap: surface.grain,
    }),
    baseDark: std({ color: 0x151a1b, metalness: 0.14, roughness: 0.68 }),
    baseInset: std({ color: 0x1b2122, metalness: 0.12, roughness: 0.7 }),
    deck: std({
      color: 0x282d2d,
      metalness: 0.24,
      roughness: 0.61,
      roughnessMap: surface.brushed,
      bumpMap: surface.tread,
      bumpScale: 0.0025,
    }),
    bell: std({ color: 0x3f4747, metalness: 0.58, roughness: 0.48, roughnessMap: surface.cast }),
    coupling: std({ color: 0x929993, metalness: 0.84, roughness: 0.36, roughnessMap: surface.brushed }),
    couplingDark: std({ color: 0x454d4c, metalness: 0.7, roughness: 0.46 }),
    alternator: painted({ color: 0x27443c, metalness: 0.34, roughness: 0.38 }),
    alternatorDark: std({ color: 0x192c27, metalness: 0.38, roughness: 0.48 }),
    radiatorCore: std({ color: 0x49352d, metalness: 0.48, roughness: 0.6, roughnessMap: surface.cast }),
    radiatorFin: std({ color: 0x795544, metalness: 0.7, roughness: 0.48 }),
    radiatorTank: std({ color: 0x232a2b, metalness: 0.45, roughness: 0.5 }),
    radiatorFrame: std({ color: 0x1c2224, metalness: 0.5, roughness: 0.44 }),
    fanShroud: std({ color: 0x333a3a, metalness: 0.4, roughness: 0.54 }),
    fan: std({ color: 0x59615f, metalness: 0.52, roughness: 0.46 }),
    airCleaner: std({ color: 0x232a2b, metalness: 0.35, roughness: 0.48 }),
    airCleanerDark: std({ color: 0x151b1c, metalness: 0.3, roughness: 0.55 }),
    exhaust: std({ color: 0x8d908a, metalness: 0.9, roughness: 0.36, roughnessMap: surface.brushed }),
    exhaustDark: std({ color: 0x555957, metalness: 0.8, roughness: 0.44 }),
    exhaustHeat: std({ color: 0x867670, metalness: 0.82, roughness: 0.42, roughnessMap: surface.brushed }),
    heatShield: std({
      color: 0x9a9d97,
      metalness: 0.92,
      roughness: 0.3,
      roughnessMap: surface.brushed,
      side: THREE.DoubleSide,
    }),
    controller: painted({ color: 0x202728, metalness: 0.45, roughness: 0.4 }),
    controllerFace: std({ color: 0x0d1415, metalness: 0.35, roughness: 0.3 }),
    screenBezel: std({ color: 0x080b0c, metalness: 0.3, roughness: 0.25 }),
    controllerButton: std({ color: 0x3d4442, metalness: 0.55, roughness: 0.35 }),
    ledGreen: new THREE.MeshBasicMaterial({ color: 0x74ffd0, toneMapped: false }),
    ledAmber: new THREE.MeshBasicMaterial({ color: 0xffba58, toneMapped: false }),
    ledRed: new THREE.MeshBasicMaterial({ color: 0xff5f47, toneMapped: false }),
    battery: std({ color: 0x202524, metalness: 0.18, roughness: 0.72 }),
    batteryTop: std({ color: 0x373b38, metalness: 0.15, roughness: 0.7 }),
    batteryRed: std({ color: 0x8f2921, metalness: 0.5, roughness: 0.38 }),
    cableRed: std({ color: 0x7c241e, metalness: 0.2, roughness: 0.68 }),
    cableBlack: std({ color: 0x141717, metalness: 0.15, roughness: 0.75 }),
    canopy: painted({ color: 0x223a34, metalness: 0.4, roughness: 0.38, clearcoat: 0.38 }),
    canopyTrim: std({ color: 0x334d45, metalness: 0.42, roughness: 0.43 }),
    canopyDark: std({ color: 0x111a18, metalness: 0.48, roughness: 0.5 }),
    canopyVent: std({ color: 0x0c1211, metalness: 0.4, roughness: 0.7 }),
  };
  for (const material of Object.values(M)) {
    if (material?.isMaterial) material.dithering = true;
  }
  return M;
}

function makeNoiseTexture(size, spread, min, max) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const image = ctx.createImageData(size, size);
  for (let i = 0; i < image.data.length; i += 4) {
    const value = Math.max(min, Math.min(max, 180 + (Math.random() - 0.5) * spread * 2));
    image.data[i] = value;
    image.data[i + 1] = value;
    image.data[i + 2] = value;
    image.data[i + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);
  // A few soft scratches / cast pores.
  ctx.globalAlpha = 0.22;
  for (let i = 0; i < 32; i += 1) {
    ctx.strokeStyle = i % 2 ? '#d8d8d8' : '#757575';
    ctx.lineWidth = Math.random() * 1.4 + 0.25;
    ctx.beginPath();
    const x = Math.random() * size;
    const y = Math.random() * size;
    ctx.moveTo(x, y);
    ctx.lineTo(x + (Math.random() - 0.5) * 22, y + (Math.random() - 0.5) * 4);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.NoColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

function makeTreadTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#8e8e8e';
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = 'rgba(50,50,50,0.42)';
  ctx.lineWidth = 2;
  for (let y = -16; y < 272; y += 32) {
    for (let x = -16; x < 272; x += 32) {
      const offset = ((y / 32) & 1) * 12;
      ctx.save();
      ctx.translate(x + offset, y);
      ctx.rotate(Math.PI / 4);
      ctx.strokeRect(-9, -2, 18, 4);
      ctx.restore();
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.NoColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function makeBrushedTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#b9b9b9';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < 900; i += 1) {
    const y = Math.random() * canvas.height;
    ctx.strokeStyle = `rgba(${Math.random() > 0.5 ? '235,235,235' : '80,80,80'}, ${Math.random() * 0.14})`;
    ctx.lineWidth = Math.random() * 1.1;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y + (Math.random() - 0.5) * 1.2);
    ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.NoColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function makeTextTexture({
  text,
  width = 900,
  height = 180,
  font = '700 100px Arial, sans-serif',
  color = '#f3efe6',
  tracking = 8,
  align = 'center',
  subtext = '',
  subColor = '#9aa5a3',
}) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, width, height);
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  drawTrackedText(ctx, text, align === 'center' ? width / 2 : width * 0.06, height * (subtext ? 0.43 : 0.52), tracking, align);
  if (subtext) {
    ctx.font = `500 ${Math.round(parseInt(font.match(/(\d+)px/)?.[1] || 32) * 0.3)}px Arial, sans-serif`;
    ctx.fillStyle = subColor;
    drawTrackedText(ctx, subtext, width / 2, height * 0.77, Math.max(2, tracking * 0.4), 'center');
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function makePlaqueTexture({ eyebrow = '', value = '', footnote = '', dark = false }) {
  const canvas = document.createElement('canvas');
  canvas.width = 900;
  canvas.height = 310;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = dark ? '#0d1314' : '#d6d2c6';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = dark ? '#495350' : '#666e69';
  ctx.lineWidth = 4;
  ctx.strokeRect(14, 14, canvas.width - 28, canvas.height - 28);
  ctx.fillStyle = dark ? '#d8d5ca' : '#14191a';
  ctx.font = '600 44px Arial, sans-serif';
  drawTrackedText(ctx, eyebrow, 54, 76, 5, 'left');
  ctx.fillStyle = dark ? '#f3eee3' : '#1e2524';
  ctx.font = '700 82px "Arial Narrow", Arial, sans-serif';
  drawTrackedText(ctx, value, 54, 170, 4, 'left');
  ctx.fillStyle = dark ? '#95a29d' : '#4e5a56';
  ctx.font = '500 32px Arial, sans-serif';
  drawTrackedText(ctx, footnote, 54, 246, 3, 'left');
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function makeHazardTexture(title, subtitle) {
  const canvas = document.createElement('canvas');
  canvas.width = 480;
  canvas.height = 310;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#d9a83d';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#202321';
  ctx.beginPath();
  ctx.moveTo(240, 30);
  ctx.lineTo(368, 232);
  ctx.lineTo(112, 232);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#d9a83d';
  ctx.font = '700 120px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('!', 240, 206);
  ctx.fillStyle = '#252826';
  ctx.font = '700 42px "Arial Narrow", Arial, sans-serif';
  ctx.textAlign = 'center';
  drawTrackedText(ctx, title, 240, 265, 4, 'center');
  ctx.font = '500 22px Arial, sans-serif';
  ctx.fillStyle = '#323632';
  drawTrackedText(ctx, subtitle, 240, 295, 1, 'center');
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function makeGaugeTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#0e1414';
  ctx.beginPath();
  ctx.arc(128, 128, 122, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#6d7874';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(128, 128, 112, 0, TAU);
  ctx.stroke();
  for (let i = 0; i < 13; i += 1) {
    const a = -Math.PI * 0.82 + (i / 12) * Math.PI * 1.64;
    const inner = 78;
    const outer = 66;
    ctx.strokeStyle = i > 9 ? '#d9a83d' : '#c5cbc5';
    ctx.lineWidth = i % 3 === 0 ? 6 : 3;
    ctx.beginPath();
    ctx.moveTo(128 + Math.cos(a) * inner, 128 + Math.sin(a) * inner);
    ctx.lineTo(128 + Math.cos(a) * outer, 128 + Math.sin(a) * outer);
    ctx.stroke();
  }
  ctx.fillStyle = '#e4e0d5';
  ctx.font = '600 25px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('FUEL', 128, 73);
  ctx.fillStyle = '#8b9691';
  ctx.font = '500 17px Arial, sans-serif';
  ctx.fillText('LEVEL', 128, 192);
  const a = -.35;
  ctx.strokeStyle = '#e6b958';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(128, 128);
  ctx.lineTo(128 + Math.cos(a) * 72, 128 + Math.sin(a) * 72);
  ctx.stroke();
  ctx.fillStyle = '#d9a83d';
  ctx.beginPath();
  ctx.arc(128, 128, 9, 0, TAU);
  ctx.fill();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function makeControllerScreenTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1000;
  canvas.height = 560;
  const ctx = canvas.getContext('2d');
  const bg = ctx.createLinearGradient(0, 0, 0, 560);
  bg.addColorStop(0, '#071718');
  bg.addColorStop(1, '#041010');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1000, 560);

  ctx.strokeStyle = 'rgba(111, 213, 190, 0.11)';
  ctx.lineWidth = 2;
  for (let x = 0; x < 1000; x += 50) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 560);
    ctx.stroke();
  }
  for (let y = 0; y < 560; y += 50) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1000, y);
    ctx.stroke();
  }
  ctx.fillStyle = '#9ce5d5';
  ctx.font = '600 32px "Arial", sans-serif';
  drawTrackedText(ctx, 'POWER COMMAND', 48, 63, 4, 'left');
  ctx.fillStyle = '#5f8078';
  ctx.font = '500 20px "Arial", sans-serif';
  drawTrackedText(ctx, 'GENSET CONTROLLER  /  UNIT 01', 48, 98, 2, 'left');
  ctx.textAlign = 'right';
  ctx.fillStyle = '#72e0c7';
  ctx.font = '600 22px "Arial", sans-serif';
  ctx.fillText('●  READY', 952, 68);
  ctx.textAlign = 'left';

  ctx.fillStyle = '#dcf4ec';
  ctx.font = '600 148px "Arial Narrow", Arial, sans-serif';
  ctx.fillText('400', 48, 284);
  ctx.font = '600 48px "Arial", sans-serif';
  ctx.fillStyle = '#8da9a0';
  ctx.fillText('V', 350, 275);
  ctx.font = '600 72px "Arial Narrow", Arial, sans-serif';
  ctx.fillStyle = '#dcf4ec';
  ctx.fillText('50.0', 510, 274);
  ctx.font = '600 40px "Arial", sans-serif';
  ctx.fillStyle = '#8da9a0';
  ctx.fillText('Hz', 705, 270);
  ctx.font = '500 29px "Arial", sans-serif';
  ctx.fillStyle = '#6d8c83';
  ctx.fillText('L-L VOLTAGE', 48, 324);
  ctx.fillText('FREQUENCY', 510, 324);

  const rows = [
    ['ENGINE', '1500 rpm'],
    ['OIL PRESS', '62 psi'],
    ['COOLANT', '84 °C'],
    ['POWER', '360 kW'],
  ];
  rows.forEach((row, i) => {
    const x = 48 + (i % 2) * 462;
    const y = 388 + Math.floor(i / 2) * 74;
    ctx.fillStyle = '#50716a';
    ctx.font = '500 20px "Arial", sans-serif';
    drawTrackedText(ctx, row[0], x, y, 2, 'left');
    ctx.fillStyle = i === 2 ? '#f1c569' : '#cfece3';
    ctx.font = '600 28px "Arial", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(row[1], x + 420, y + 1);
    ctx.textAlign = 'left';
    ctx.strokeStyle = 'rgba(120, 198, 180, 0.18)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y + 26);
    ctx.lineTo(x + 420, y + 26);
    ctx.stroke();
  });

  ctx.fillStyle = 'rgba(96, 220, 190, 0.15)';
  ctx.fillRect(0, 0, 1000, 7);
  ctx.fillStyle = '#d9a83d';
  ctx.fillRect(48, 520, 118, 8);
  ctx.fillStyle = '#2c4e47';
  ctx.fillRect(178, 520, 300, 8);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

/* ------------------------------------------------------------------------- */
/* Geometry helpers                                                          */
/* ------------------------------------------------------------------------- */

function box(parent, width, height, depth, material, x, y, z, opts = {}) {
  const radius = Math.min(opts.r ?? 0.015, width / 2 - 0.0005, height / 2 - 0.0005, depth / 2 - 0.0005);
  const geometry = radius > 0
    ? new RoundedBoxGeometry(width, height, depth, opts.seg ?? 2, radius)
    : new THREE.BoxGeometry(width, height, depth);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  if (opts.rot) mesh.rotation.set(...opts.rot);
  mesh.castShadow = opts.cast !== false;
  mesh.receiveShadow = opts.receive !== false;
  parent.add(mesh);
  return mesh;
}

function cylinder(parent, radiusTop, radiusBottom, height, material, position, rotation, segments = 24, open = false) {
  const geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments, 1, open);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  finalize(mesh);
  parent.add(mesh);
  return mesh;
}

function torus(parent, radius, tube, material, x, y, z, rotationY = Math.PI / 2, segments = 40) {
  const mesh = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 10, segments), material);
  mesh.position.set(x, y, z);
  mesh.rotation.y = rotationY;
  finalize(mesh);
  parent.add(mesh);
  return mesh;
}

function ringPlate(parent, outer, inner, depth, material, x, y, z, segments = 48) {
  const shape = new THREE.Shape();
  shape.absarc(0, 0, outer, 0, TAU, false);
  const hole = new THREE.Path();
  hole.absarc(0, 0, inner, 0, TAU, true);
  shape.holes.push(hole);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: Math.min(0.008, depth * 0.2),
    bevelThickness: Math.min(0.008, depth * 0.2),
    curveSegments: segments,
  });
  geometry.translate(0, 0, -depth / 2);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.rotation.y = Math.PI / 2;
  finalize(mesh);
  parent.add(mesh);
  return mesh;
}

function tube(parent, points, radius, material, radialSegments = 8, tubularSegments = 32, closed = false) {
  const vectors = points.map((point) => (point.isVector3 ? point : new THREE.Vector3(...point)));
  const curve = new THREE.CatmullRomCurve3(vectors, closed, 'centripetal');
  const geometry = new THREE.TubeGeometry(curve, tubularSegments, radius, radialSegments, closed);
  const mesh = new THREE.Mesh(geometry, material);
  finalize(mesh);
  parent.add(mesh);
  return mesh;
}

function bolt(parent, x, y, z, material, axis = 'x', size = 0.022) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(size, size, 0.018, 6), material);
  mesh.position.set(x, y, z);
  if (axis === 'x') mesh.rotation.z = Math.PI / 2;
  else if (axis === 'z') mesh.rotation.x = Math.PI / 2;
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  parent.add(mesh);
  return mesh;
}

function sticker(parent, texture, width, height, position, rotation = [0, 0, 0]) {
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -2,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  mesh.renderOrder = 3;
  mesh.userData.noHighlight = true;
  parent.add(mesh);
  return mesh;
}

function curvedSticker(parent, texture, width, height, radius, segments, offset = [0, 0, 0]) {
  const arc = height / radius;
  const geometry = new THREE.BufferGeometry();
  const positions = [];
  const uvs = [];
  const indices = [];
  for (let i = 0; i <= segments; i += 1) {
    const angle = -arc / 2 + (i / segments) * arc;
    for (let j = 0; j <= 1; j += 1) {
      const x = -width / 2 + j * width;
      positions.push(x, Math.sin(angle) * radius, Math.cos(angle) * radius);
      uvs.push(j, i / segments);
    }
  }
  for (let i = 0; i < segments; i += 1) {
    const a = i * 2;
    const b = a + 1;
    const c = a + 2;
    const d = a + 3;
    indices.push(a, b, c, c, b, d);
  }
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -2,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...offset);
  mesh.renderOrder = 3;
  mesh.userData.noHighlight = true;
  parent.add(mesh);
  return mesh;
}

function drawTrackedText(ctx, text, x, y, tracking, align = 'left') {
  const characters = [...text];
  const widths = characters.map((character) => ctx.measureText(character).width);
  const total = widths.reduce((sum, width) => sum + width, 0) + tracking * (characters.length - 1);
  let start = x;
  if (align === 'center') start = x - total / 2;
  else if (align === 'right') start = x - total;
  let cursor = start;
  for (let i = 0; i < characters.length; i += 1) {
    ctx.fillText(characters[i], cursor, y);
    cursor += widths[i] + tracking;
  }
}

function finalize(mesh) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function collectCanopyMaterials(canopy) {
  for (const material of canopy.materials) {
    material.userData.canopyBaseOpacity = material.opacity ?? 1;
    material.userData.canopyAlwaysTransparent = Boolean(material.transparent);
    material.userData.baseEmissive = material.emissive?.getHex?.() ?? 0;
    material.transparent = true;
    material.opacity = 0;
  }
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function smoothstep(value, min, max) {
  const t = THREE.MathUtils.clamp((value - min) / (max - min), 0, 1);
  return t * t * (3 - 2 * t);
}
