import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createGenerator } from './model.js';

const TAU = Math.PI * 2;
const NS = 'http://www.w3.org/2000/svg';
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobileQuery = window.matchMedia('(max-width: 1200px)');

function boot() {
  const dom = {
    app: document.querySelector('#app'),
    canvas: document.querySelector('#scene'),
    loader: document.querySelector('#loader'),
    loaderBar: document.querySelector('#loaderBar'),
    loaderPercent: document.querySelector('#loaderPercent'),
    partsList: document.querySelector('#partsList'),
    sidePanel: document.querySelector('#sidePanel'),
    panelIndex: document.querySelector('#panelIndex'),
    panelDetail: document.querySelector('#panelDetail'),
    detailBack: document.querySelector('#detailBack'),
    detailCount: document.querySelector('#detailCount'),
    detailZh: document.querySelector('#detailZh'),
    detailEn: document.querySelector('#detailEn'),
    detailTitle: document.querySelector('#detailTitle'),
    detailDesc: document.querySelector('#detailDesc'),
    detailFacts: document.querySelector('#detailFacts'),
    detailPrev: document.querySelector('#detailPrev'),
    detailNext: document.querySelector('#detailNext'),
    canopyToggle: document.querySelector('#canopyToggle'),
    canopyTool: document.querySelector('#canopyTool'),
    labelsTool: document.querySelector('#labelsTool'),
    rotateTool: document.querySelector('#rotateTool'),
    resetTool: document.querySelector('#resetTool'),
    playButton: document.querySelector('#playButton'),
    explodeRange: document.querySelector('#explodeRange'),
    percent: document.querySelector('#percent'),
    labelsLayer: document.querySelector('#labelsLayer'),
    hero: document.querySelector('.hero'),
    bottomBar: document.querySelector('.bottom-bar'),
    leaderSvg: document.querySelector('#leaderSvg'),
    hoverTip: document.querySelector('#hoverTip'),
    sourcesButton: document.querySelector('#sourcesButton'),
    sourcesModal: document.querySelector('#sourcesModal'),
    modalClose: document.querySelector('#modalClose'),
    toast: document.querySelector('#toast'),
    panelScrim: document.querySelector('#panelScrim'),
    mobilePanelButton: document.querySelector('#mobilePanelButton'),
    mobileFocusPill: document.querySelector('#mobileFocusPill'),
    mobileFocusNum: document.querySelector('#mobileFocusNum'),
    mobileFocusName: document.querySelector('#mobileFocusName'),
  };

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas: dom.canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
  } catch (error) {
    failWebGL(error);
    return;
  }

  if (!renderer.capabilities.isWebGL2) {
    failWebGL(new Error('WebGL2 is required for this visualisation.'));
    return;
  }

  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.24;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x070a0a, 19, 36);

  const camera = new THREE.PerspectiveCamera(31, 1, 0.1, 70);
  const controls = new OrbitControls(camera, dom.canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.068;
  controls.enablePan = false;
  controls.minDistance = 2.2;
  controls.maxDistance = 34;
  controls.minPolarAngle = 0.23;
  controls.maxPolarAngle = 1.52;
  controls.rotateSpeed = 0.55;
  controls.zoomSpeed = 0.72;
  controls.autoRotateSpeed = 0.35;
  controls.target.set(0, 1.06, 0);

  const generator = createGenerator();
  scene.add(generator.root);

  const environment = createEnvironment(renderer);
  scene.environment = environment;
  scene.environmentIntensity = 0.7;

  addLighting(scene);
  const ground = addGround();
  scene.add(ground.group);
  const focusRing = addFocusRing();
  scene.add(focusRing);
  const fan = generator.root.getObjectByName('cooling-fan');

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const worldAnchor = new THREE.Vector3();
  const cameraDirection = new THREE.Vector3();
  const tempVector = new THREE.Vector3();
  const tempVector2 = new THREE.Vector3();

  const state = {
    explode: 0,
    targetExplode: 0,
    labels: true,
    canopy: false,
    canopyTarget: 0,
    canopyOpacity: 0,
    autoRotate: false,
    selected: null,
    hovered: null,
    hoverSource: null,
    isScrubbing: false,
    dragging: false,
    modalOpen: false,
    modalReturnFocus: null,
    drawerOpen: false,
    introPlayed: false,
    userInteracted: false,
    lastPercent: -1,
    flight: null,
    labelsReady: false,
    previousMode: getViewMode(),
    previousViewport: { width: window.innerWidth, height: window.innerHeight },
  };

  const partById = new Map(generator.parts.map((part) => [part.id, part]));
  const selectedIndex = () => (state.selected ? generator.parts.indexOf(state.selected) : -1);

  const labelViews = buildInterface();
  addLightingListeners();
  applyHighlight();
  resize();
  resetCameraImmediate();

  // Compile while the loading screen covers the first painting.
  camera.updateMatrixWorld();
  generator.root.updateMatrixWorld(true);
  renderer.compile(scene, camera);
  renderer.render(scene, camera);
  startLoader();

  const clock = new THREE.Clock();
  renderer.setAnimationLoop(animate);
  window.__GENSET__ = {
    scene,
    camera,
    controls,
    renderer,
    generator,
    state,
    parts: generator.parts,
    setExplode: setExplosionTarget,
    selectPart,
    resetView,
  };
  window.__READY__ = true;

  /* ------------------------------------------------------------------ */
  /* Scene construction                                                 */
  /* ------------------------------------------------------------------ */

  function createEnvironment(webglRenderer) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#040606');
    gradient.addColorStop(0.34, '#0b0f10');
    gradient.addColorStop(0.52, '#262724');
    gradient.addColorStop(0.68, '#0a0d0e');
    gradient.addColorStop(1, '#030404');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const glow = (x, y, radius, color, alpha) => {
      const radial = ctx.createRadialGradient(x, y, 0, x, y, radius);
      radial.addColorStop(0, color);
      radial.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalAlpha = alpha;
      ctx.fillStyle = radial;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = 1;
    };

    // Soft studio strips; these are what give the metals their long highlights.
    glow(175, 185, 210, 'rgba(238,242,236,0.9)', 0.95);
    glow(690, 145, 230, 'rgba(214,220,213,0.72)', 0.72);
    glow(510, 250, 330, 'rgba(203,128,90,0.46)', 0.34);
    glow(875, 305, 250, 'rgba(170,177,171,0.3)', 0.16);
    glow(420, 395, 420, 'rgba(9,13,13,0.82)', 0.72);

    // Hard-ish linear strip for a slightly sharper reflection.
    ctx.globalCompositeOperation = 'lighter';
    const strip = ctx.createLinearGradient(0, 90, 0, 190);
    strip.addColorStop(0, 'rgba(255,255,255,0)');
    strip.addColorStop(0.45, 'rgba(235,241,235,0.2)');
    strip.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = strip;
    ctx.fillRect(60, 70, 410, 130);
    ctx.globalCompositeOperation = 'source-over';

    const texture = new THREE.CanvasTexture(canvas);
    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    const pmrem = new THREE.PMREMGenerator(webglRenderer);
    const renderTarget = pmrem.fromEquirectangular(texture);
    texture.dispose();
    pmrem.dispose();
    return renderTarget.texture;
  }

  function addLighting(sceneRef) {
    const hemi = new THREE.HemisphereLight(0xbac8c3, 0x07090a, 0.52);
    sceneRef.add(hemi);

    const key = new THREE.DirectionalLight(0xfff1e0, 3.8);
    key.position.set(5.3, 8.2, 6.4);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left = -7.2;
    key.shadow.camera.right = 7.2;
    key.shadow.camera.top = 7.4;
    key.shadow.camera.bottom = -4.3;
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 25;
    key.shadow.bias = -0.0003;
    key.shadow.normalBias = 0.025;
    key.shadow.radius = 3;
    sceneRef.add(key);
    key.target.position.set(0, 0.8, 0);
    sceneRef.add(key.target);

    const fill = new THREE.DirectionalLight(0xdfe2dc, 0.66);
    fill.position.set(-6, 3.2, 4.4);
    sceneRef.add(fill);

    const frontFill = new THREE.DirectionalLight(0xf0f1ea, 0.48);
    frontFill.position.set(3.2, 2.0, 8.5);
    sceneRef.add(frontFill);

    const coolRim = new THREE.SpotLight(0xa9d8ce, 22, 24, Math.PI * 0.3, 0.95, 1.5);
    coolRim.position.set(-4.2, 6.4, -5.2);
    coolRim.target.position.set(0, 1.25, 0);
    sceneRef.add(coolRim);
    sceneRef.add(coolRim.target);

    const warmEdge = new THREE.PointLight(0xff7549, 1.8, 8, 2);
    warmEdge.position.set(-2.6, 1.4, 2.5);
    sceneRef.add(warmEdge);

    const topGlint = new THREE.PointLight(0xe1e9e3, 6.5, 8, 2);
    topGlint.position.set(2.8, 4.7, 1.4);
    sceneRef.add(topGlint);

    const backFill = new THREE.DirectionalLight(0xb3beb7, 0.4);
    backFill.position.set(4.5, 3.0, -5.5);
    sceneRef.add(backFill);
  }

  function addGround() {
    const group = new THREE.Group();
    group.name = 'stage';

    const floorTexture = makeFloorTexture();
    const floorMaterial = new THREE.MeshPhysicalMaterial({
      map: floorTexture,
      color: 0xc5c9c3,
      metalness: 0.045,
      roughness: 0.66,
      clearcoat: 0.1,
      clearcoatRoughness: 0.72,
      envMapIntensity: 0.14,
    });
    const floor = new THREE.Mesh(new THREE.CircleGeometry(18, 128), floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.004;
    floor.receiveShadow = true;
    group.add(floor);

    const shadowTexture = makeContactShadowTexture();
    const contactShadow = new THREE.Mesh(
      new THREE.PlaneGeometry(7.8, 3.15),
      new THREE.MeshBasicMaterial({
        map: shadowTexture,
        transparent: true,
        opacity: 0.72,
        depthWrite: false,
        blending: THREE.NormalBlending,
      }),
    );
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.y = 0.006;
    contactShadow.renderOrder = 1;
    group.add(contactShadow);

    const gridMaterial = new THREE.ShaderMaterial({
      uniforms: {},
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      vertexShader: `
        varying vec3 vWorld;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorld = worldPosition.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vWorld;
        float gridLine(vec2 p, float scale) {
          vec2 coord = p / scale;
          vec2 derivative = fwidth(coord);
          vec2 grid = abs(fract(coord - 0.5) - 0.5) / max(derivative, vec2(0.00001));
          vec2 line = vec2(1.0) - min(grid, vec2(1.0));
          return max(line.x, line.y);
        }
        void main() {
          vec2 p = vWorld.xz;
          float minor = gridLine(p, 0.5);
          float major = gridLine(p, 2.0);
          float distanceFromCenter = length(p);
          float fade = smoothstep(13.0, 1.2, distanceFromCenter);
          float alpha = (minor * 0.045 + major * 0.095) * fade;
          if (alpha < 0.002) discard;
          gl_FragColor = vec4(vec3(0.47, 0.62, 0.57), alpha);
        }
      `,
    });
    const grid = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), gridMaterial);
    grid.rotation.x = -Math.PI / 2;
    grid.position.y = 0.008;
    grid.renderOrder = 2;
    group.add(grid);

    const ring = new THREE.Group();
    const dashedPoints = [];
    const radius = 3.34;
    for (let i = 0; i < 170; i += 1) {
      if (i % 2 === 0) continue;
      const a0 = (i / 170) * TAU;
      const a1 = ((i + 1) / 170) * TAU;
      dashedPoints.push(
        new THREE.Vector3(Math.cos(a0) * radius, 0, Math.sin(a0) * radius),
        new THREE.Vector3(Math.cos(a1) * radius, 0, Math.sin(a1) * radius),
      );
    }
    const dashed = new THREE.LineSegments(
      new THREE.BufferGeometry().setFromPoints(dashedPoints),
      new THREE.LineBasicMaterial({ color: 0xa5b1aa, transparent: true, opacity: 0.18 }),
    );
    dashed.position.y = 0.012;
    ring.add(dashed);

    const innerPoints = [];
    for (let i = 0; i < 64; i += 1) {
      const a = (i / 64) * TAU;
      innerPoints.push(new THREE.Vector3(Math.cos(a) * 2.94, 0, Math.sin(a) * 2.94));
    }
    const inner = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(innerPoints),
      new THREE.LineBasicMaterial({ color: 0xa5b1aa, transparent: true, opacity: 0.085 }),
    );
    inner.position.y = 0.012;
    ring.add(inner);

    const accentPoints = [];
    for (let i = 0; i <= 18; i += 1) {
      const a = 0.42 + (i / 18) * 0.53;
      accentPoints.push(new THREE.Vector3(Math.cos(a) * 3.47, 0, Math.sin(a) * 3.47));
    }
    const accentArc = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(accentPoints),
      new THREE.LineBasicMaterial({ color: 0xef6b45, transparent: true, opacity: 0.52 }),
    );
    accentArc.position.y = 0.012;
    ring.add(accentArc);

    for (let i = 0; i < 24; i += 1) {
      const a = (i / 24) * TAU;
      const tick = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(Math.cos(a) * 3.34, 0, Math.sin(a) * 3.34),
          new THREE.Vector3(Math.cos(a) * (3.34 + (i % 6 === 0 ? 0.12 : 0.06)), 0, Math.sin(a) * (3.34 + (i % 6 === 0 ? 0.12 : 0.06))),
        ]),
        new THREE.LineBasicMaterial({ color: 0xa5b1aa, transparent: true, opacity: i % 6 === 0 ? 0.32 : 0.14 }),
      );
      tick.position.y = 0.012;
      ring.add(tick);
    }
    ring.position.y = 0.014;
    group.add(ring);
    return { group, floor };
  }

  function addFocusRing() {
    const material = new THREE.MeshBasicMaterial({
      color: 0xef6b45,
      transparent: true,
      opacity: 0.36,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.955, 1, 96), material);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.019;
    ring.visible = false;
    ring.renderOrder = 3;
    return ring;
  }

  function makeFloorTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#0c0e0e';
    ctx.fillRect(0, 0, 1024, 1024);
    const radial = ctx.createRadialGradient(512, 460, 10, 512, 512, 570);
    radial.addColorStop(0, 'rgba(73,77,73,0.28)');
    radial.addColorStop(0.35, 'rgba(39,42,40,0.12)');
    radial.addColorStop(0.7, 'rgba(11,14,14,0.035)');
    radial.addColorStop(1, 'rgba(5,7,7,0)');
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, 1024, 1024);

    // Fine aggregate / workshop floor texture.
    for (let i = 0; i < 4300; i += 1) {
      const x = Math.random() * 1024;
      const y = Math.random() * 1024;
      ctx.fillStyle = `rgba(196,199,194,${Math.random() * 0.035})`;
      ctx.fillRect(x, y, Math.random() * 1.8 + 0.25, Math.random() * 1.8 + 0.25);
    }
    // A few very faint reference arcs.
    ctx.strokeStyle = 'rgba(198,207,198,0.035)';
    ctx.lineWidth = 1;
    for (const r of [184, 320, 490]) {
      ctx.beginPath();
      ctx.arc(512, 512, r, 0, TAU);
      ctx.stroke();
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    return texture;
  }

  function makeContactShadowTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(256, 128, 8, 256, 128, 250);
    gradient.addColorStop(0, 'rgba(0,0,0,0.74)');
    gradient.addColorStop(0.35, 'rgba(0,0,0,0.48)');
    gradient.addColorStop(0.72, 'rgba(0,0,0,0.14)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  /* ------------------------------------------------------------------ */
  /* Interface                                                          */
  /* ------------------------------------------------------------------ */

  function buildInterface() {
    const views = new Map();
    dom.partsList.innerHTML = generator.parts.map((part) => `
      <li>
        <button class="part-row" type="button" data-part="${part.id}" aria-label="查看${part.zh}">
          <span class="num">${part.num}</span>
          <span class="copy">
            <span class="zh">${part.zh}</span>
            <span class="en">${part.en}</span>
          </span>
          <span class="arrow" aria-hidden="true">↗</span>
        </button>
      </li>
    `).join('');

    dom.partsList.querySelectorAll('[data-part]').forEach((row) => {
      const part = partById.get(row.dataset.part);
      row.addEventListener('click', () => selectPart(part));
      row.addEventListener('pointerenter', () => setHovered(part, 'list'));
      row.addEventListener('pointerleave', () => clearHovered());
    });

    const listRows = new Map(
      [...dom.partsList.querySelectorAll('[data-part]')].map((row) => [row.dataset.part, row]),
    );

    generator.parts.forEach((part) => {
      const label = document.createElement('button');
      label.type = 'button';
      label.className = `part-label${part.label?.minor ? ' minor' : ''}`;
      label.dataset.part = part.id;
      label.setAttribute('aria-label', `聚焦${part.zh}`);
      label.innerHTML = `
        <span class="pl-num">${part.num}</span>
        <span class="pl-copy">
          <b>${part.zh}</b>
          <i>${part.title}</i>
        </span>
      `;
      dom.labelsLayer.appendChild(label);

      const group = document.createElementNS(NS, 'g');
      const line = document.createElementNS(NS, 'line');
      line.setAttribute('class', 'leader-line');
      const dot = document.createElementNS(NS, 'circle');
      dot.setAttribute('class', 'leader-dot');
      dot.setAttribute('r', '1.7');
      const halo = document.createElementNS(NS, 'circle');
      halo.setAttribute('class', 'leader-ring');
      halo.setAttribute('r', '4.2');
      group.appendChild(line);
      group.appendChild(halo);
      group.appendChild(dot);
      dom.leaderSvg.appendChild(group);

      const view = {
        part,
        el: label,
        group,
        line,
        dot,
        halo,
        width: 120,
        height: 28,
        anchorX: 0,
        anchorY: 0,
        opacity: 0,
      };
      views.set(part.id, view);

      label.addEventListener('click', () => selectPart(part));
      label.addEventListener('pointerenter', () => setHovered(part, 'label'));
      label.addEventListener('pointerleave', () => clearHovered());
    });

    requestAnimationFrame(() => {
      for (const view of views.values()) {
        view.width = view.el.offsetWidth || 120;
        view.height = view.el.offsetHeight || 28;
      }
      state.labelsReady = true;
    });

    dom.labelsTool.addEventListener('click', () => {
      state.labels = !state.labels;
      state.userInteracted = true;
      dom.labelsTool.classList.toggle('active', state.labels);
      dom.labelsTool.setAttribute('aria-pressed', String(state.labels));
      dom.app.classList.toggle('labels-off', !state.labels);
      showToast(state.labels ? '部件标注已开启' : '部件标注已隐藏');
    });

    dom.canopyToggle.addEventListener('click', () => setCanopy(!state.canopy));
    dom.canopyTool.addEventListener('click', () => setCanopy(!state.canopy));
    dom.rotateTool.addEventListener('click', () => {
      state.autoRotate = !state.autoRotate;
      state.userInteracted = true;
      controls.autoRotate = state.autoRotate;
      dom.rotateTool.classList.toggle('active', state.autoRotate);
      dom.rotateTool.setAttribute('aria-pressed', String(state.autoRotate));
      showToast(state.autoRotate ? '自动旋转已开启' : '自动旋转已暂停');
    });

    dom.resetTool.addEventListener('click', () => {
      state.userInteracted = true;
      resetView();
      showToast('视角已重置');
    });

    dom.playButton.addEventListener('click', () => {
      state.userInteracted = true;
      openOrCloseAssembly();
    });

    dom.explodeRange.addEventListener('pointerdown', () => {
      state.isScrubbing = true;
      state.userInteracted = true;
      cancelCameraFlight();
    });
    window.addEventListener('pointerup', () => {
      state.isScrubbing = false;
    });
    dom.explodeRange.addEventListener('input', (event) => {
      state.userInteracted = true;
      setExplosionTarget(Number(event.target.value) / 100);
    });

    dom.detailBack.addEventListener('click', () => {
      closeDetailAndReturn({ resetCamera: true, closeDrawer: false });
    });
    dom.detailPrev.addEventListener('click', () => stepDetail(-1));
    dom.detailNext.addEventListener('click', () => stepDetail(1));

    dom.sourcesButton.addEventListener('click', openSources);
    dom.modalClose.addEventListener('click', closeSources);
    dom.sourcesModal.addEventListener('click', (event) => {
      if (event.target === dom.sourcesModal) closeSources();
    });

    dom.mobilePanelButton.addEventListener('click', () => {
      if (state.drawerOpen) closeMobilePanel();
      else openMobilePanel();
    });
    dom.mobileFocusPill.addEventListener('click', () => {
      if (!state.selected) return;
      showPartDetail(state.selected, { openDrawer: true });
    });
    dom.panelScrim.addEventListener('click', closeMobilePanel);
    document.querySelectorAll('.drawer-close').forEach((button) => {
      button.addEventListener('click', closeMobilePanel);
    });

    dom.canvas.addEventListener('pointerdown', onCanvasPointerDown);
    dom.canvas.addEventListener('pointerup', onCanvasPointerUp);
    dom.canvas.addEventListener('pointercancel', onCanvasPointerCancel);
    dom.canvas.addEventListener('pointermove', onCanvasPointerMove);
    dom.canvas.addEventListener('pointerleave', () => {
      clearHovered();
      dom.canvas.classList.remove('is-dragging');
    });

    controls.addEventListener('start', () => {
      cancelCameraFlight();
      state.dragging = true;
      dom.canvas.classList.add('is-dragging');
      hideHoverTip();
    });
    controls.addEventListener('end', () => {
      state.dragging = false;
      dom.canvas.classList.remove('is-dragging');
    });

    window.addEventListener('resize', onResize);
    document.addEventListener('keydown', onKeyDown);
    mobileQuery.addEventListener('change', onResize);

    dom.canvas.addEventListener('wheel', () => {
      state.userInteracted = true;
      cancelCameraFlight();
    }, { passive: true });

    return views;
  }

  function openMobilePanel() {
    if (!mobileQuery.matches) return;
    state.drawerOpen = true;
    dom.sidePanel.classList.add('is-open');
    dom.panelScrim.classList.add('is-open');
    dom.app.classList.add('drawer-open');
    dom.mobilePanelButton.setAttribute('aria-expanded', 'true');
  }

  function closeMobilePanel() {
    state.drawerOpen = false;
    dom.sidePanel.classList.remove('is-open');
    dom.panelScrim.classList.remove('is-open');
    dom.app.classList.remove('drawer-open');
    dom.mobilePanelButton.setAttribute('aria-expanded', 'false');
  }

  function showPartDetail(part, options = {}) {
    dom.panelIndex.hidden = true;
    dom.panelDetail.hidden = false;
    dom.sidePanel.classList.add('show-detail');
    dom.panelDetail.scrollTop = 0;
    dom.detailCount.textContent = `${part.num} / ${String(generator.parts.length).padStart(2, '0')}`;
    dom.detailZh.textContent = part.zh;
    dom.detailEn.textContent = part.en;
    dom.detailTitle.textContent = part.title;
    dom.detailDesc.textContent = part.summary;
    dom.detailFacts.innerHTML = part.facts
      .map(([key, value]) => `<div><dt>${key}</dt><dd>${value}</dd></div>`)
      .join('');
    const index = generator.parts.indexOf(part);
    dom.detailPrev.disabled = generator.parts.length < 2;
    dom.detailNext.disabled = generator.parts.length < 2;
    dom.detailCount.dataset.index = String(index);
    if (mobileQuery.matches && options.openDrawer !== false) openMobilePanel();
  }

  function showIndex() {
    dom.panelDetail.hidden = true;
    dom.panelIndex.hidden = false;
    dom.sidePanel.classList.remove('show-detail');
  }

  function stepDetail(direction) {
    if (!state.selected) return;
    const index = generator.parts.indexOf(state.selected);
    const next = (index + direction + generator.parts.length) % generator.parts.length;
    selectPart(generator.parts[next], { fromDetail: true });
  }

  function selectPart(part, options = {}) {
    if (!part) return;
    state.userInteracted = true;
    state.selected = part;
    clearHovered();
    syncSelectionUI();
    showPartDetail(part, { openDrawer: options.openDrawer !== false });
    if (!options.keepCamera) {
      focusOnPart(part);
    }
    if (state.targetExplode < 0.74) setExplosionTarget(0.78);
  }

  function syncSelectionUI() {
    const activeId = state.selected?.id;
    dom.partsList.querySelectorAll('[data-part]').forEach((row) => {
      const active = row.dataset.part === activeId;
      row.classList.toggle('active', active);
      if (active) row.setAttribute('aria-current', 'true');
      else row.removeAttribute('aria-current');
    });
    for (const view of labelViews.values()) {
      view.el.classList.toggle('is-active', view.part.id === activeId);
      view.el.classList.toggle('is-muted', Boolean(activeId) && view.part.id !== activeId);
      view.group.style.opacity = activeId && view.part.id !== activeId ? '0.34' : '';
    }
    dom.app.classList.toggle('inspecting', Boolean(activeId));
    dom.app.classList.toggle('has-selection', Boolean(activeId));
    if (state.selected) {
      dom.mobileFocusNum.textContent = state.selected.num;
      dom.mobileFocusName.textContent = state.selected.zh;
    }
    applyHighlight();
    if (state.selected) {
      const row = dom.partsList.querySelector(`[data-part="${state.selected.id}"]`);
      row?.scrollIntoView({ block: 'nearest' });
    }
    updateFocusRingVisibility();
  }

  function clearSelection(options = {}) {
    if (!state.selected) {
      if (options.closeDrawer) closeMobilePanel();
      return;
    }
    state.selected = null;
    showIndex();
    syncSelectionUI();
    updateFocusRingVisibility();
    if (options.resetCamera) flyHome();
    if (options.closeDrawer) closeMobilePanel();
  }

  function closeDetailAndReturn({ resetCamera = true, closeDrawer = false } = {}) {
    clearSelection({ resetCamera, closeDrawer });
  }

  function setHovered(part, source) {
    if (state.hovered === part) {
      state.hoverSource = source;
      return;
    }
    state.hovered = part;
    state.hoverSource = source;
    applyHighlight();
    if (part && source === 'canvas') {
      showHoverTip(part);
    } else {
      hideHoverTip();
    }
  }

  function clearHovered() {
    if (!state.hovered) return;
    state.hovered = null;
    state.hoverSource = null;
    applyHighlight();
    hideHoverTip();
    if (!state.dragging) dom.canvas.classList.remove('is-hovering');
  }

  function applyHighlight() {
    const accent = 0xff673c;
    for (const part of generator.parts) {
      const strength = part === state.selected ? 0.004 : part === state.hovered ? 0.002 : 0;
      for (const material of part.materials) {
        if (!material?.emissive) continue;
        if (material.emissiveMap) continue;
        if (strength > 0) {
          material.emissive.setHex(accent);
          material.emissiveIntensity = strength;
        } else {
          material.emissive.setHex(material.userData.baseEmissive ?? 0x000000);
          material.emissiveIntensity = material.userData.baseEmissiveIntensity ?? 1;
        }
      }
    }
  }

  function updateFocusRingVisibility() {
    focusRing.visible = Boolean(state.selected);
  }

  function showHoverTip(part) {
    dom.hoverTip.querySelector('b').textContent = part.zh;
    dom.hoverTip.querySelector('span').textContent = `${part.num}  /  ${part.title}`;
    dom.hoverTip.classList.add('is-visible');
  }

  function hideHoverTip() {
    dom.hoverTip.classList.remove('is-visible');
  }

  function moveHoverTip(clientX, clientY) {
    dom.hoverTip.style.transform = `translate3d(${clientX + 13}px, ${clientY + 12}px, 0)`;
  }

  /* ------------------------------------------------------------------ */
  /* Canvas interaction                                                 */
  /* ------------------------------------------------------------------ */

  let pointerDownInfo = null;

  function onCanvasPointerDown(event) {
    if (event.button !== 0) return;
    state.userInteracted = true;
    pointerDownInfo = { x: event.clientX, y: event.clientY, time: performance.now() };
    cancelCameraFlight();
    hideHoverTip();
    dom.canvas.classList.add('is-dragging');
  }

  function onCanvasPointerUp(event) {
    dom.canvas.classList.remove('is-dragging');
    if (!pointerDownInfo) return;
    const distance = Math.hypot(event.clientX - pointerDownInfo.x, event.clientY - pointerDownInfo.y);
    const held = performance.now() - pointerDownInfo.time;
    pointerDownInfo = null;
    if (distance > 6 || held > 680) return;
    const hit = pickPart(event.clientX, event.clientY);
    if (hit) {
      selectPart(hit, { openDrawer: false });
    } else {
      clearSelection({ resetCamera: true });
    }
  }

  function onCanvasPointerCancel() {
    pointerDownInfo = null;
    dom.canvas.classList.remove('is-dragging');
  }

  let lastHoverCheck = 0;

  function onCanvasPointerMove(event) {
    if (pointerDownInfo) {
      hideHoverTip();
      return;
    }
    const now = performance.now();
    if (now - lastHoverCheck < 45) return;
    lastHoverCheck = now;
    const hit = pickPart(event.clientX, event.clientY);
    setHovered(hit, 'canvas');
    dom.canvas.classList.toggle('is-hovering', Boolean(hit));
    if (hit) moveHoverTip(event.clientX, event.clientY);
  }

  function pickPart(clientX, clientY) {
    const rect = dom.canvas.getBoundingClientRect();
    pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    if (state.canopyOpacity > 0.5 && state.explode < 0.35) return null;
    const hits = raycaster.intersectObjects(generator.pickables, false);
    if (!hits.length) return null;
    const partId = hits[0].object.userData.partId;
    return partId ? partById.get(partId) || null : null;
  }

  /* ------------------------------------------------------------------ */
  /* Explosion, effects, animation                                      */
  /* ------------------------------------------------------------------ */

  function setExplosionTarget(value, options = {}) {
    const clamped = THREE.MathUtils.clamp(value, 0, 1);
    state.targetExplode = clamped;
    if (!options.keepIntent) state.userInteracted = true;
    syncPlayState();
  }

  function syncPlayState() {
    const expanded = state.targetExplode > 0.5;
    dom.playButton.classList.toggle('is-playing', expanded);
    dom.playButton.setAttribute('aria-label', expanded ? '合拢发电机组' : '分解发电机组');
    dom.playButton.title = expanded ? '合拢机组' : '展开分解';
  }

  function openOrCloseAssembly() {
    if (state.targetExplode > 0.5) {
      setExplosionTarget(0);
      showToast('正在合拢机组');
    } else {
      setExplosionTarget(1);
      showToast('正在展开全部分解层级');
    }
  }

  function setCanopy(enabled) {
    state.userInteracted = true;
    state.canopy = enabled;
    state.canopyTarget = enabled ? 1 : 0;
    dom.canopyToggle.setAttribute('aria-checked', String(enabled));
    dom.canopyTool.setAttribute('aria-pressed', String(enabled));
    dom.canopyTool.classList.toggle('active', enabled);
    if (enabled) {
      if (state.selected) clearSelection({ resetCamera: false, closeDrawer: false });
      if (state.targetExplode < 0.52) setExplosionTarget(0.74);
      flyHome();
      showToast('静音外罩已加入 · 可继续拖动爆炸滑块');
    } else {
      showToast('静音外罩已移除');
    }
  }

  function resetView() {
    state.userInteracted = true;
    cancelCameraFlight();
    clearSelection({ resetCamera: false, closeDrawer: false });
    flyHome();
  }

  function flyHome() {
    const home = getHomeView();
    flyCamera(home.position, home.target, home.fov, 900);
  }

  function resetCameraImmediate() {
    const home = getHomeView();
    camera.position.copy(home.position);
    camera.fov = home.fov;
    camera.updateProjectionMatrix();
    controls.target.copy(home.target);
    camera.lookAt(home.target);
    controls.update();
  }

  function getHomeView() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const aspect = width / height;
    let fov = 31;
    if (width <= 680) fov = 45;
    else if (width <= 1200) fov = 34;
    const compactLandscape = width > 680 && width <= 1200;
    const requiredWidth = width <= 680 ? 6.65 : width <= 1200 ? 7.45 : 7.9;
    const byWidth = requiredWidth / (2 * Math.tan(THREE.MathUtils.degToRad(fov) / 2) * Math.max(aspect, 0.32));
    const distance = Math.max(width <= 680 ? 16 : width <= 1200 ? 10.2 : 11.0, byWidth);
    const direction = new THREE.Vector3(0.54, 0.33, 0.77).normalize();
    const target = new THREE.Vector3(compactLandscape ? -0.8 : -0.12, width <= 680 ? 1.24 : 1.3, 0);
    const position = target.clone().addScaledVector(direction, distance);
    return { position, target, fov, distance };
  }

  function focusOnPart(part) {
    const target = part.explodePosition.clone().add(part.localCenter);
    const aspect = Math.max(camera.aspect, 0.42);
    const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
    const verticalDistance = (part.radius * 1.34) / tan + 0.7;
    const horizontalDistance = (part.radius * 1.4) / (tan * aspect) + 0.7;
    let distance = Math.max(verticalDistance, horizontalDistance, 2.7);
    distance = Math.min(distance, 9.2);
    const direction = camera.position.clone().sub(controls.target).normalize();
    if (direction.lengthSq() < 0.1) direction.set(0.54, 0.34, 0.77).normalize();
    direction.y = Math.max(direction.y, 0.25);
    direction.normalize();
    const position = target.clone().addScaledVector(direction, distance);
    if (position.y < 0.95) position.y = 0.95;
    flyCamera(position, target, camera.fov, 950);
  }

  function flyCamera(position, target, fov, duration = 850) {
    if (reducedMotion) {
      cancelCameraFlight();
      camera.position.copy(position);
      camera.fov = fov ?? camera.fov;
      camera.updateProjectionMatrix();
      controls.target.copy(target);
      camera.lookAt(target);
      controls.update();
      controls.enabled = true;
      return;
    }
    state.flight = {
      fromPosition: camera.position.clone(),
      toPosition: position.clone(),
      fromTarget: controls.target.clone(),
      toTarget: target.clone(),
      fromFov: camera.fov,
      toFov: fov ?? camera.fov,
      started: performance.now(),
      duration,
    };
    controls.enabled = false;
  }

  function cancelCameraFlight() {
    if (!state.flight) return;
    state.flight = null;
    controls.enabled = true;
  }

  function updateCameraFlight(now) {
    if (!state.flight) return;
    const flight = state.flight;
    const raw = Math.min(1, (now - flight.started) / flight.duration);
    const t = easeInOutCubic(raw);
    camera.position.lerpVectors(flight.fromPosition, flight.toPosition, t);
    controls.target.lerpVectors(flight.fromTarget, flight.toTarget, t);
    camera.fov = THREE.MathUtils.lerp(flight.fromFov, flight.toFov, t);
    camera.updateProjectionMatrix();
    camera.lookAt(controls.target);
    if (raw >= 1) {
      state.flight = null;
      controls.enabled = true;
    }
  }

  function animate() {
    const dt = Math.min(clock.getDelta(), 0.05);
    const now = performance.now();

    if (state.flight) updateCameraFlight(now);

    if (reducedMotion) {
      if (state.explode !== state.targetExplode) {
        state.explode = state.targetExplode;
        generator.setExplode(state.explode);
      }
      if (state.canopyOpacity !== state.canopyTarget) {
        state.canopyOpacity = state.canopyTarget;
        generator.setCanopyOpacity(state.canopyOpacity);
      }
    } else {
      const damping = 1 - Math.exp(-dt * 5.1);
      const difference = state.targetExplode - state.explode;
      if (Math.abs(difference) > 0.0004) {
        state.explode += difference * damping;
        generator.setExplode(state.explode);
      } else if (state.explode !== state.targetExplode) {
        state.explode = state.targetExplode;
        generator.setExplode(state.explode);
      }

      if (Math.abs(state.canopyOpacity - state.canopyTarget) > 0.002) {
        state.canopyOpacity += (state.canopyTarget - state.canopyOpacity) * (1 - Math.exp(-dt * 6.5));
        generator.setCanopyOpacity(state.canopyOpacity);
      } else if (state.canopyOpacity !== state.canopyTarget) {
        state.canopyOpacity = state.canopyTarget;
        generator.setCanopyOpacity(state.canopyOpacity);
      }
    }

    if (fan && !reducedMotion) {
      fan.rotation.x -= dt * (0.18 + (1 - state.explode) * 0.08);
    }

    if (focusRing.visible && state.selected) {
      const center = state.selected.group.localToWorld(state.selected.localCenter.clone());
      const pulse = 1 + Math.sin(now * 0.0024) * 0.02;
      focusRing.position.x = center.x;
      focusRing.position.z = center.z;
      focusRing.scale.setScalar(Math.max(0.35, state.selected.radius * 1.08 * pulse));
      focusRing.material.opacity = 0.25 + Math.sin(now * 0.0024) * 0.08;
    }

    controls.update(dt);

    // The DOM callouts read the same camera and part transforms as the renderer.
    camera.updateMatrixWorld(true);
    generator.root.updateMatrixWorld(true);
    updateInterface(now);
    renderer.render(scene, camera);
  }

  function updateInterface(now) {
    const percent = Math.round(state.explode * 100);
    if (percent !== state.lastPercent) {
      state.lastPercent = percent;
      dom.percent.textContent = `${String(percent).padStart(2, '0')}%`;
      dom.explodeRange.style.setProperty('--progress', `${percent}%`);
      if (!state.isScrubbing && document.activeElement !== dom.explodeRange) {
        dom.explodeRange.value = String(percent);
      }
    }
    syncPlayState();
    if (state.labelsReady) updateLabelVisibility(now);
  }

  function updateLabelVisibility(now) {
    const desktop = window.innerWidth > 1200;
    const available = desktop && state.labels && state.labelsReady;
    dom.app.classList.toggle('labels-off', !state.labels);
    if (!available) {
      for (const view of labelViews.values()) hideLabel(view);
      dom.leaderSvg.style.opacity = '0';
      return;
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    const panelRect = dom.sidePanel.getBoundingClientRect();
    const heroRect = dom.hero.getBoundingClientRect();
    const bottomRect = dom.bottomBar.getBoundingClientRect();
    const panelVisible = !mobileQuery.matches && panelRect.width > 0 && panelRect.right <= width + 4;
    const rightLimit = panelVisible ? panelRect.left - 14 : width - 14;
    const safeTop = 84;
    const safeBottom = height - 94;
    const reserved = [
      { x: -40, y: -40, w: width + 80, h: 78 },
      { x: heroRect.left - 12, y: heroRect.top - 12, w: heroRect.width + 24, h: heroRect.height + 22 },
      {
        x: bottomRect.left - 12,
        y: bottomRect.top - 16,
        w: bottomRect.width + 24,
        h: bottomRect.height + 32,
      },
    ];
    if (panelVisible) {
      reserved.push({
        x: panelRect.left - 12,
        y: panelRect.top - 10,
        w: panelRect.width + 24,
        h: panelRect.height + 20,
      });
    }

    const entries = [];
    for (const view of labelViews.values()) {
      const part = view.part;
      const threshold = part.label?.minor ? 0.56 : 0.2;
      const canopyHidden = state.canopyOpacity > 0.25 && state.explode < 0.3;
      if (state.explode <= threshold || canopyHidden) {
        hideLabel(view);
        continue;
      }

      worldAnchor.copy(part.anchorVector);
      part.group.localToWorld(worldAnchor);
      tempVector.copy(worldAnchor).sub(camera.position).normalize();
      camera.getWorldDirection(cameraDirection);
      if (tempVector.dot(cameraDirection) < 0.1) {
        hideLabel(view);
        continue;
      }
      const projected = tempVector2.copy(worldAnchor).project(camera);
      const anchorX = (projected.x * 0.5 + 0.5) * width;
      const anchorY = (-projected.y * 0.5 + 0.5) * height;
      if (
        anchorX < -28 ||
        anchorX > width + 28 ||
        anchorY < -28 ||
        anchorY > height + 28 ||
        !Number.isFinite(anchorX) ||
        !Number.isFinite(anchorY)
      ) {
        hideLabel(view);
        continue;
      }
      entries.push({
        view,
        anchorX,
        anchorY,
        width: Math.max(60, view.width),
        height: Math.max(22, view.height),
        minor: Boolean(part.label?.minor),
        configured: part.label || {},
      });
    }

    entries.sort((a, b) => {
      if (a.minor !== b.minor) return a.minor ? 1 : -1;
      return a.anchorX - b.anchorX;
    });

    const occupied = [];
    for (const entry of entries) {
      const candidates = labelCandidates(entry);
      let best = null;
      for (const candidate of candidates) {
        const w = entry.width;
        const h = entry.height;
        const maxX = Math.max(14, rightLimit - w);
        const x = THREE.MathUtils.clamp(candidate.x, 14, maxX);
        const y = THREE.MathUtils.clamp(candidate.y, safeTop, Math.max(safeTop, safeBottom - h));
        const rect = { x, y, w, h };
        let score = candidate.cost;
        for (const zone of reserved) {
          const overlap = overlapArea(rect, zone);
          if (overlap > 0) score += 140000000 + overlap * 4000;
        }
        for (const other of occupied) {
          const overlap = overlapArea(rect, other);
          if (overlap > 0) score += 90000000 + overlap * 3200;
        }
        score += Math.hypot(x - entry.anchorX, y + h / 2 - entry.anchorY) * 2.2;
        if (best === null || score < best.score) best = { x, y, score, candidate };
      }
      if (!best) {
        hideLabel(entry.view);
        continue;
      }
      occupied.push({ x: best.x, y: best.y, w: entry.width, h: entry.height });
      placeLabel(entry, best);
    }
    dom.leaderSvg.style.opacity = entries.length ? '1' : '0';
    void now;
  }

  function labelCandidates(entry) {
    const { anchorX: ax, anchorY: ay, width: w, height: h, configured } = entry;
    const list = [];
    const add = (x, y, cost) => {
      if (!Number.isFinite(x) || !Number.isFinite(y)) return;
      list.push({ x, y, cost });
    };

    // The hand-tuned offset remains the first choice where space permits.
    if (Number.isFinite(configured.dx) && Number.isFinite(configured.dy)) {
      add(ax + configured.dx, ay + configured.dy, -140);
    }

    const gaps = [20, 54, 94, 142];
    for (let i = 0; i < gaps.length; i += 1) {
      const gap = gaps[i];
      const rank = i * 7;
      add(ax + gap, ay - h / 2, 100 + rank); // right
      add(ax - w - gap, ay - h / 2, 110 + rank); // left
      add(ax - w / 2, ay - h - gap, 115 + rank); // above
      add(ax - w / 2, ay + gap, 120 + rank); // below
      const diag = gap * 0.78;
      add(ax + diag, ay - h - diag, 128 + rank); // upper right
      add(ax - w - diag, ay - h - diag, 132 + rank); // upper left
      add(ax + diag, ay + diag, 136 + rank); // lower right
      add(ax - w - diag, ay + diag, 140 + rank); // lower left
    }
    return list;
  }

  function placeLabel(entry, placed) {
    const { view } = entry;
    const x = Math.round(placed.x);
    const y = Math.round(placed.y);
    const w = entry.width;
    const h = entry.height;
    view.el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    view.el.classList.remove('is-hidden');
    view.el.classList.add('is-visible');
    view.group.style.display = '';
    view.anchorX = entry.anchorX;
    view.anchorY = entry.anchorY;

    const cx = x + w / 2;
    const cy = y + h / 2;
    let connectX;
    let connectY;
    if (entry.anchorY < y) {
      connectX = cx;
      connectY = y;
    } else if (entry.anchorY > y + h) {
      connectX = cx;
      connectY = y + h;
    } else if (entry.anchorX < x) {
      connectX = x;
      connectY = cy;
    } else {
      connectX = x + w;
      connectY = cy;
    }

    view.line.setAttribute('x1', String(entry.anchorX));
    view.line.setAttribute('y1', String(entry.anchorY));
    view.line.setAttribute('x2', String(connectX));
    view.line.setAttribute('y2', String(connectY));
    view.dot.setAttribute('cx', String(entry.anchorX));
    view.dot.setAttribute('cy', String(entry.anchorY));
    view.halo.setAttribute('cx', String(entry.anchorX));
    view.halo.setAttribute('cy', String(entry.anchorY));
  }

  function hideLabel(view) {
    view.el.classList.remove('is-visible');
    view.el.classList.add('is-hidden');
    view.group.style.display = 'none';
  }

  function overlapArea(a, b) {
    const width = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
    const height = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
    if (width <= 0 || height <= 0) return 0;
    return width * height;
  }

  function onResize() {
    resize();
    const mode = getViewMode();
    const width = window.innerWidth;
    const height = window.innerHeight;
    const previous = state.previousViewport;
    const significantResize = Math.abs(width - previous.width) > 90 || Math.abs(height - previous.height) > 90;
    const modeChanged = mode !== state.previousMode;
    state.previousViewport = { width, height };
    state.previousMode = mode;

    if (modeChanged || significantResize) {
      closeMobilePanel();
      if (state.selected) clearSelection({ resetCamera: false, closeDrawer: false });
      cancelCameraFlight();
      resetCameraImmediate();
    }
    requestAnimationFrame(() => {
      for (const view of labelViews.values()) {
        view.width = view.el.offsetWidth || view.width;
        view.height = view.el.offsetHeight || view.height;
      }
    });
  }

  function resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  function getViewMode() {
    if (window.innerWidth <= 1200) return 'drawer';
    return 'panel';
  }

  function addLightingListeners() {
    window.addEventListener('blur', () => {
      state.isScrubbing = false;
    });
  }

  function onKeyDown(event) {
    if (event.key === 'Escape') {
      if (state.modalOpen) {
        closeSources();
        return;
      }
      if (state.drawerOpen) {
        closeMobilePanel();
        return;
      }
      if (state.selected) {
        closeDetailAndReturn({ resetCamera: true, closeDrawer: false });
        return;
      }
    }
    if (event.code === 'Space' && !state.modalOpen) {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'BUTTON' || tag === 'A') return;
      event.preventDefault();
      openOrCloseAssembly();
    }
  }

  function openSources() {
    state.modalOpen = true;
    state.modalReturnFocus = document.activeElement;
    dom.sourcesModal.classList.add('is-open');
    dom.sourcesModal.setAttribute('aria-hidden', 'false');
    dom.modalClose.focus({ preventScroll: true });
  }

  function closeSources() {
    state.modalOpen = false;
    dom.sourcesModal.classList.remove('is-open');
    dom.sourcesModal.setAttribute('aria-hidden', 'true');
    const returnTarget = state.modalReturnFocus;
    state.modalReturnFocus = null;
    if (returnTarget && typeof returnTarget.focus === 'function' && document.contains(returnTarget)) {
      window.setTimeout(() => returnTarget.focus({ preventScroll: true }), 0);
    }
  }

  let toastTimer = null;
  function showToast(message) {
    window.clearTimeout(toastTimer);
    dom.toast.textContent = message;
    dom.toast.classList.add('is-visible');
    toastTimer = window.setTimeout(() => {
      dom.toast.classList.remove('is-visible');
    }, 2200);
  }

  function startLoader() {
    const start = performance.now();
    const duration = reducedMotion ? 260 : 780;
    const update = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      dom.loaderBar.style.transform = `scaleX(${easeOutCubic(progress)})`;
      dom.loaderPercent.textContent = String(Math.round(progress * 100)).padStart(2, '0');
      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        window.setTimeout(() => {
          dom.loader.classList.add('is-hidden');
          document.body.classList.add('ready');
          scheduleIntro();
        }, 120);
      }
    };
    requestAnimationFrame(update);
  }

  function scheduleIntro() {
    if (state.introPlayed) return;
    state.introPlayed = true;
    if (reducedMotion) {
      setExplosionTarget(window.innerWidth <= 680 ? 0.56 : 0.72, { keepIntent: true });
      return;
    }
    window.setTimeout(() => {
      if (state.userInteracted) return;
      setExplosionTarget(window.innerWidth <= 680 ? 0.55 : 0.8, { keepIntent: true });
    }, 520);
  }

  function failWebGL(error) {
    console.error(error);
    const loader = dom.loader;
    if (loader) {
      loader.innerHTML = `
        <div class="loader-inner">
          <div class="loader-symbol" aria-hidden="true">!</div>
          <div class="loader-title">WEBGL2 REQUIRED</div>
          <div class="loader-sub" style="line-height:1.9;text-align:center;">
            这个交互式三维场景需要支持 WebGL2 的浏览器。<br />请使用最新版 Chrome、Safari 或 Edge 打开。
          </div>
        </div>
      `;
    }
    window.__ERROR__ = String(error);
  }
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

try {
  boot();
} catch (error) {
  console.error(error);
  window.__ERROR__ = String(error?.stack || error);
  const loader = document.querySelector('#loader');
  if (loader) {
    loader.innerHTML = `
      <div class="loader-inner">
        <div class="loader-symbol" aria-hidden="true">!</div>
        <div class="loader-title">SCENE ERROR</div>
        <div class="loader-sub" style="line-height:1.9;text-align:center;">
          三维场景加载失败。请刷新页面或尝试最新版浏览器。
        </div>
      </div>
    `;
  }
}
