const canvas = document.getElementById("startup3dCanvas");
const sceneEl = document.getElementById("startupScene");
const shell = document.getElementById("shell");

const debug = {
  active: false,
  canvasHeight: 0,
  canvasWidth: 0,
  error: null,
  frame: 0,
  lastPixelEnergy: 0,
  pointerX: 0,
  pointerY: 0,
  ready: false,
  renderer: "startup-webgl-interactive-perspective"
};

window.__startup3dDebug = debug;

async function initStartupScene() {
  const gl =
    canvas.getContext("webgl", {
      alpha: false,
      antialias: true,
      depth: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: true,
      stencil: false
    }) ||
    canvas.getContext("experimental-webgl", {
      alpha: false,
      antialias: true,
      depth: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: true,
      stencil: false
    });

  if (!gl) {
    throw new Error("WebGL is not available for the startup background.");
  }

  canvas.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    debug.ready = false;
    sceneEl.classList.remove("is-webgl-ready");
  });

  const texturedProgram = createProgram(gl, TEXTURED_VERTEX, TEXTURED_FRAGMENT);
  const gridProgram = createProgram(gl, GRID_VERTEX, GRID_FRAGMENT);
  const quad = createTexturedQuad(gl);
  const floor = createFloor(gl);

  const textureRoot = new URL("../assets/2084/startup-3d/", import.meta.url);
  const textures = {
    emissive: await loadTexture(gl, new URL("startup-3d-emissive.webp", textureRoot)),
    far: await loadTexture(gl, new URL("startup-3d-far.webp", textureRoot)),
    fog: await loadTexture(gl, new URL("startup-3d-fog-bands.webp", textureRoot)),
    mid: await loadTexture(gl, new URL("startup-3d-mid.webp", textureRoot)),
    rails: await loadTexture(gl, new URL("startup-3d-near-rails.webp", textureRoot))
  };

  const uniforms = {
    grid: {
      colorA: gl.getUniformLocation(gridProgram, "u_colorA"),
      colorB: gl.getUniformLocation(gridProgram, "u_colorB"),
      interaction: gl.getUniformLocation(gridProgram, "u_interaction"),
      pointer: gl.getUniformLocation(gridProgram, "u_pointer"),
      ripples: gl.getUniformLocation(gridProgram, "u_ripples"),
      time: gl.getUniformLocation(gridProgram, "u_time"),
      viewProj: gl.getUniformLocation(gridProgram, "u_viewProj")
    },
    textured: {
      mvp: gl.getUniformLocation(texturedProgram, "u_mvp"),
      opacity: gl.getUniformLocation(texturedProgram, "u_opacity"),
      tex: gl.getUniformLocation(texturedProgram, "u_tex"),
      tint: gl.getUniformLocation(texturedProgram, "u_tint")
    }
  };

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const interaction = createInteraction();
  const state = {
    gl,
    gridProgram,
    interaction,
    lastTime: 0,
    quad,
    floor,
    reducedMotion,
    texturedProgram,
    textures,
    uniforms
  };

  gl.disable(gl.CULL_FACE);
  gl.disable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.clearColor(0.015, 0.02, 0.045, 1);

  attachInteraction(interaction);
  resize(gl);
  window.addEventListener("resize", () => resize(gl));
  if ("ResizeObserver" in window) {
    new ResizeObserver(() => resize(gl)).observe(canvas);
  }

  debug.ready = true;
  canvas.dataset.ready = "true";
  canvas.dataset.interactive = "true";
  sceneEl.dataset.renderer = debug.renderer;
  sceneEl.classList.add("is-webgl-ready");
  requestAnimationFrame((time) => render(state, time));
}

function render(state, timeMs) {
  const { gl } = state;
  const isMenu = shell.dataset.mode === "menu";
  const time = timeMs * 0.001;
  const dt = Math.min(0.05, Math.max(0.001, time - (state.lastTime || time)));
  state.lastTime = time;
  debug.active = isMenu;
  debug.frame += 1;
  canvas.dataset.active = String(isMenu);
  canvas.dataset.frame = String(debug.frame);

  if (isMenu) {
    resize(gl);
    updateInteraction(state.interaction, dt);
    renderScene(state, state.reducedMotion.matches ? 0 : time);
    if (debug.frame % 45 === 0) {
      sampleCanvasEnergy(gl);
    }
  }

  requestAnimationFrame((time) => render(state, time));
}

function renderScene(state, time) {
  const { gl, gridProgram, texturedProgram, uniforms } = state;
  const width = gl.drawingBufferWidth || 1;
  const height = gl.drawingBufferHeight || 1;
  const aspect = width / height;

  gl.viewport(0, 0, width, height);
  gl.clear(gl.COLOR_BUFFER_BIT);

  const pointer = state.interaction.pointer;
  const cameraDrift = Math.sin(time * 0.18) + pointer.x * 1.05;
  const cameraLift = Math.sin(time * 0.23) - pointer.y * 0.82;
  const boost = pointer.boost;
  const fov = (58 - boost * 2.5 + Math.abs(pointer.x) * 1.4) * Math.PI / 180;
  const eye = [
    cameraDrift * 0.44,
    1.22 + cameraLift * 0.12,
    4.55 + Math.sin(time * 0.12) * 0.18 - boost * 0.34
  ];
  const target = [
    cameraDrift * 0.22 + pointer.x * 0.34,
    -0.72 - pointer.y * 0.18,
    -9.2 + boost * 0.72
  ];
  const projection = perspective(fov, aspect, 0.1, 80);
  const view = lookAt(eye, target, [0, 1, 0]);
  const viewProj = multiply(projection, view);

  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  drawTextured(state, viewProj, state.textures.far, {
    opacity: 0.98,
    position: [cameraDrift * -0.28, 1.38 + pointer.y * 0.12, -16.5],
    rotation: [0, 0, 0],
    scale: [15.8, 8.9, 1],
    tint: [0.9, 0.98, 1.12, 1]
  });

  gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
  drawTextured(state, viewProj, state.textures.mid, {
    opacity: 0.24 + boost * 0.04,
    position: [-7.2 - pointer.x * 0.72, 0.96 + pointer.y * 0.12, -10.8 + boost * 0.18],
    rotation: [0, 0.34 + pointer.x * 0.04, 0],
    scale: [7.3, 8.1, 1],
    tint: [0.75, 1.08, 1.25, 1]
  });
  drawTextured(state, viewProj, state.textures.mid, {
    opacity: 0.22 + boost * 0.04,
    position: [7.2 - pointer.x * 0.72, 0.96 + pointer.y * 0.12, -10.8 + boost * 0.18],
    rotation: [0, -0.34 + pointer.x * 0.04, 0],
    scale: [7.3, 8.1, 1],
    tint: [1.18, 0.72, 1.08, 1]
  });

  gl.useProgram(gridProgram);
  gl.bindBuffer(gl.ARRAY_BUFFER, state.floor.positionBuffer);
  const gridPosition = gl.getAttribLocation(gridProgram, "a_position");
  gl.enableVertexAttribArray(gridPosition);
  gl.vertexAttribPointer(gridPosition, 3, gl.FLOAT, false, 0, 0);
  gl.uniformMatrix4fv(uniforms.grid.viewProj, false, viewProj);
  gl.uniform1f(uniforms.grid.time, time);
  gl.uniform2f(uniforms.grid.pointer, pointer.x, pointer.y);
  gl.uniform1f(uniforms.grid.interaction, pointer.activity);
  gl.uniform4fv(uniforms.grid.ripples, state.interaction.rippleUniforms);
  gl.uniform3f(uniforms.grid.colorA, 0.1, 0.94, 1.0);
  gl.uniform3f(uniforms.grid.colorB, 1.0, 0.16, 0.78);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
  gl.drawArrays(gl.TRIANGLES, 0, state.floor.count);

  drawTextured(state, viewProj, state.textures.fog, {
    opacity: 0.25 + Math.sin(time * 0.44) * 0.04 + pointer.activity * 0.04,
    position: [Math.sin(time * 0.16) * 0.2 - pointer.x * 0.48, 0.04 + pointer.y * 0.1, -10.6],
    rotation: [0, 0, 0],
    scale: [16.2, 9.2, 1],
    tint: [0.72, 1.05, 1.1, 1]
  });
  drawTextured(state, viewProj, state.textures.rails, {
    opacity: 0.47 + Math.sin(time * 0.9) * 0.05 + boost * 0.12,
    position: [pointer.x * 0.42, -1.08 + pointer.y * 0.08, -6.3 + boost * 0.42],
    rotation: [-0.17, pointer.x * 0.055, 0],
    scale: [13.8 + boost * 0.7, 7.8 + boost * 0.38, 1],
    tint: [1.05, 1.08, 1.15, 1]
  });
  drawTextured(state, viewProj, state.textures.emissive, {
    opacity: 0.22 + Math.sin(time * 1.35) * 0.07 + pointer.activity * 0.06,
    position: [pointer.x * -0.38, 0.08 + pointer.y * 0.1, -7.7 + boost * 0.28],
    rotation: [0, 0, 0],
    scale: [13.8 + boost * 0.44, 7.75 + boost * 0.24, 1],
    tint: [1.08, 1.02, 1.18, 1]
  });

  gl.useProgram(texturedProgram);
  gl.disableVertexAttribArray(gl.getAttribLocation(gridProgram, "a_position"));
}

function drawTextured(state, viewProj, texture, options) {
  const { gl, texturedProgram, quad, uniforms } = state;
  const model = compose(options.position, options.rotation, options.scale);
  const mvp = multiply(viewProj, model);

  gl.useProgram(texturedProgram);
  gl.bindBuffer(gl.ARRAY_BUFFER, quad.positionBuffer);
  const positionLocation = gl.getAttribLocation(texturedProgram, "a_position");
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, quad.uvBuffer);
  const uvLocation = gl.getAttribLocation(texturedProgram, "a_uv");
  gl.enableVertexAttribArray(uvLocation);
  gl.vertexAttribPointer(uvLocation, 2, gl.FLOAT, false, 0, 0);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.uniform1i(uniforms.textured.tex, 0);
  gl.uniformMatrix4fv(uniforms.textured.mvp, false, mvp);
  gl.uniform4fv(uniforms.textured.tint, options.tint);
  gl.uniform1f(uniforms.textured.opacity, options.opacity);
  gl.drawArrays(gl.TRIANGLES, 0, quad.count);
}

function createInteraction() {
  return {
    pointer: {
      activity: 0,
      boost: 0,
      lastInput: "idle",
      targetActivity: 0,
      targetBoost: 0,
      targetX: 0,
      targetY: 0,
      x: 0,
      y: 0
    },
    ripples: Array.from({ length: 4 }, () => ({
      age: 10,
      life: 1.45,
      strength: 0,
      x: 0,
      z: 0
    })),
    rippleCursor: 0,
    rippleUniforms: new Float32Array(16)
  };
}

function attachInteraction(interaction) {
  const handlePoint = (clientX, clientY, strength = 0.72) => {
    const width = window.innerWidth || 1;
    const height = window.innerHeight || 1;
    const x = clamp(clientX / width * 2 - 1, -1, 1);
    const y = clamp(clientY / height * 2 - 1, -1, 1);
    interaction.pointer.targetX = x;
    interaction.pointer.targetY = y;
    interaction.pointer.targetActivity = Math.max(interaction.pointer.targetActivity, strength);
    interaction.pointer.lastInput = "pointer";
    canvas.dataset.pointerTarget = `${x.toFixed(3)},${y.toFixed(3)}`;
  };

  const addRipple = (clientX, clientY) => {
    handlePoint(clientX, clientY, 1);
    const ripple = interaction.ripples[interaction.rippleCursor];
    interaction.rippleCursor = (interaction.rippleCursor + 1) % interaction.ripples.length;
    const world = screenToGrid(interaction.pointer.targetX, interaction.pointer.targetY);
    ripple.x = world[0];
    ripple.z = world[1];
    ripple.age = 0;
    ripple.life = 1.45;
    ripple.strength = 1;
    interaction.pointer.targetBoost = 1;
    canvas.dataset.lastRipple = `${ripple.x.toFixed(2)},${ripple.z.toFixed(2)}`;
  };

  window.addEventListener("pointermove", (event) => {
    handlePoint(event.clientX, event.clientY, 0.62);
  }, { passive: true });

  window.addEventListener("pointerdown", (event) => {
    addRipple(event.clientX, event.clientY);
  }, { capture: true, passive: true });

  window.addEventListener("pointerup", () => {
    interaction.pointer.targetBoost = 0;
  }, { passive: true });

  window.addEventListener("pointercancel", () => {
    interaction.pointer.targetBoost = 0;
  }, { passive: true });

  window.addEventListener("mouseleave", () => {
    interaction.pointer.targetX = 0;
    interaction.pointer.targetY = 0;
    interaction.pointer.targetActivity = 0;
    interaction.pointer.targetBoost = 0;
    interaction.pointer.lastInput = "idle";
  }, { passive: true });
}

function updateInteraction(interaction, dt) {
  const pointer = interaction.pointer;
  pointer.x += (pointer.targetX - pointer.x) * Math.min(1, dt * 5.8);
  pointer.y += (pointer.targetY - pointer.y) * Math.min(1, dt * 5.8);
  pointer.activity += (pointer.targetActivity - pointer.activity) * Math.min(1, dt * 4.8);
  pointer.boost += (pointer.targetBoost - pointer.boost) * Math.min(1, dt * 8.5);
  pointer.targetActivity *= Math.pow(0.18, dt);
  pointer.targetBoost *= Math.pow(0.08, dt);

  for (let index = 0; index < interaction.ripples.length; index += 1) {
    const ripple = interaction.ripples[index];
    ripple.age += dt;
    const t = clamp(ripple.age / ripple.life, 0, 1);
    interaction.rippleUniforms[index * 4 + 0] = ripple.x;
    interaction.rippleUniforms[index * 4 + 1] = ripple.z;
    interaction.rippleUniforms[index * 4 + 2] = 0.4 + t * 5.8;
    interaction.rippleUniforms[index * 4 + 3] = ripple.strength * (1 - t);
    if (ripple.age >= ripple.life) {
      ripple.strength = 0;
    }
  }

  debug.pointerX = pointer.x;
  debug.pointerY = pointer.y;
  canvas.dataset.pointer = `${pointer.x.toFixed(3)},${pointer.y.toFixed(3)}`;
  canvas.dataset.pointerActivity = pointer.activity.toFixed(3);
  canvas.dataset.pointerBoost = pointer.boost.toFixed(3);
  canvas.dataset.rippleCount = String(interaction.ripples.filter((ripple) => ripple.strength > 0).length);
}

function screenToGrid(x, y) {
  return [
    x * 8.2,
    -2.6 - clamp((y + 1) * 0.5, 0, 1) * 13.2
  ];
}

function resize(gl) {
  const dpr = Math.min(window.devicePixelRatio || 1, 1.6);
  const width = Math.max(1, Math.floor((canvas.clientWidth || window.innerWidth) * dpr));
  const height = Math.max(1, Math.floor((canvas.clientHeight || window.innerHeight) * dpr));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  debug.canvasWidth = width;
  debug.canvasHeight = height;
  canvas.dataset.pixelSize = `${width}x${height}`;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function sampleCanvasEnergy(gl) {
  const width = gl.drawingBufferWidth;
  const height = gl.drawingBufferHeight;
  if (!width || !height) return;

  const pixels = new Uint8Array(4);
  let energy = 0;
  const points = [
    [0.5, 0.45],
    [0.28, 0.64],
    [0.72, 0.64],
    [0.5, 0.78]
  ];

  for (const [x, y] of points) {
    gl.readPixels(Math.floor(width * x), Math.floor(height * y), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    energy += pixels[0] + pixels[1] + pixels[2] + pixels[3];
  }

  debug.lastPixelEnergy = energy;
  canvas.dataset.pixelEnergy = String(energy);
}

function createTexturedQuad(gl) {
  const positions = new Float32Array([
    -1, -1, 0,
    1, -1, 0,
    -1, 1, 0,
    1, -1, 0,
    1, 1, 0,
    -1, 1, 0
  ]);
  const uvs = new Float32Array([
    0, 1,
    1, 1,
    0, 0,
    1, 1,
    1, 0,
    0, 0
  ]);
  return {
    count: 6,
    positionBuffer: bufferData(gl, positions),
    uvBuffer: bufferData(gl, uvs)
  };
}

function createFloor(gl) {
  const y = -2.45;
  const positions = new Float32Array([
    -14, y, 1.8,
    -14, y, -24,
    14, y, 1.8,
    -14, y, -24,
    14, y, -24,
    14, y, 1.8
  ]);
  return {
    count: 6,
    positionBuffer: bufferData(gl, positions)
  };
}

function bufferData(gl, data) {
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  return buffer;
}

function loadTexture(gl, url) {
  return new Promise((resolve, reject) => {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      1,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array([3, 6, 18, 255])
    );

    const image = new Image();
    image.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      resolve(texture);
    };
    image.onerror = () => reject(new Error(`Could not load startup texture: ${url}`));
    image.src = url.href;
  });
}

function createProgram(gl, vertexSource, fragmentSource) {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) || "Could not link startup shader.");
  }

  return program;
}

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader) || "Could not compile startup shader.");
  }

  return shader;
}

function compose(position, rotation, scale) {
  const t = translation(position[0], position[1], position[2]);
  const ry = rotateY(rotation[1] || 0);
  const rx = rotateX(rotation[0] || 0);
  const rz = rotateZ(rotation[2] || 0);
  const s = scaling(scale[0], scale[1], scale[2]);
  return multiply(multiply(multiply(multiply(t, ry), rx), rz), s);
}

function perspective(fovy, aspect, near, far) {
  const f = 1 / Math.tan(fovy / 2);
  const nf = 1 / (near - far);
  return new Float32Array([
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (far + near) * nf, -1,
    0, 0, 2 * far * near * nf, 0
  ]);
}

function lookAt(eye, target, up) {
  const z = normalize([eye[0] - target[0], eye[1] - target[1], eye[2] - target[2]]);
  const x = normalize(cross(up, z));
  const y = cross(z, x);
  return new Float32Array([
    x[0], y[0], z[0], 0,
    x[1], y[1], z[1], 0,
    x[2], y[2], z[2], 0,
    -dot(x, eye), -dot(y, eye), -dot(z, eye), 1
  ]);
}

function translation(x, y, z) {
  return new Float32Array([
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    x, y, z, 1
  ]);
}

function scaling(x, y, z) {
  return new Float32Array([
    x, 0, 0, 0,
    0, y, 0, 0,
    0, 0, z, 0,
    0, 0, 0, 1
  ]);
}

function rotateX(angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return new Float32Array([
    1, 0, 0, 0,
    0, c, s, 0,
    0, -s, c, 0,
    0, 0, 0, 1
  ]);
}

function rotateY(angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return new Float32Array([
    c, 0, -s, 0,
    0, 1, 0, 0,
    s, 0, c, 0,
    0, 0, 0, 1
  ]);
}

function rotateZ(angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return new Float32Array([
    c, s, 0, 0,
    -s, c, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1
  ]);
}

function multiply(a, b) {
  const out = new Float32Array(16);
  for (let column = 0; column < 4; column += 1) {
    for (let row = 0; row < 4; row += 1) {
      out[column * 4 + row] =
        a[0 * 4 + row] * b[column * 4 + 0] +
        a[1 * 4 + row] * b[column * 4 + 1] +
        a[2 * 4 + row] * b[column * 4 + 2] +
        a[3 * 4 + row] * b[column * 4 + 3];
    }
  }
  return out;
}

function normalize(value) {
  const length = Math.hypot(value[0], value[1], value[2]) || 1;
  return [value[0] / length, value[1] / length, value[2] / length];
}

function cross(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0]
  ];
}

function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

const TEXTURED_VERTEX = `
attribute vec3 a_position;
attribute vec2 a_uv;
uniform mat4 u_mvp;
varying vec2 v_uv;

void main() {
  v_uv = a_uv;
  gl_Position = u_mvp * vec4(a_position, 1.0);
}`;

const TEXTURED_FRAGMENT = `
precision mediump float;

uniform sampler2D u_tex;
uniform vec4 u_tint;
uniform float u_opacity;
varying vec2 v_uv;

void main() {
  vec4 source = texture2D(u_tex, v_uv) * u_tint;
  gl_FragColor = vec4(source.rgb, source.a * u_opacity);
}`;

const GRID_VERTEX = `
attribute vec3 a_position;
uniform mat4 u_viewProj;
varying vec3 v_world;

void main() {
  v_world = a_position;
  gl_Position = u_viewProj * vec4(a_position, 1.0);
}`;

const GRID_FRAGMENT = `
precision mediump float;

uniform vec3 u_colorA;
uniform vec3 u_colorB;
uniform float u_interaction;
uniform vec2 u_pointer;
uniform vec4 u_ripples[4];
uniform float u_time;
varying vec3 v_world;

float gridLine(float value, float scale, float width) {
  float section = fract(value * scale);
  float edge = min(section, 1.0 - section);
  return 1.0 - smoothstep(0.0, width, edge);
}

void main() {
  float scrollZ = v_world.z + u_time * 1.4;
  float minor = max(gridLine(v_world.x, 0.56, 0.018), gridLine(scrollZ, 0.56, 0.018));
  float major = max(gridLine(v_world.x, 0.14, 0.024), gridLine(scrollZ, 0.14, 0.024));
  float center = gridLine(v_world.x, 0.02, 0.035);
  vec2 pointerWorld = vec2(u_pointer.x * 8.2, -2.6 - clamp((u_pointer.y + 1.0) * 0.5, 0.0, 1.0) * 13.2);
  float pointerGlow = (1.0 - smoothstep(0.4, 4.2, distance(v_world.xz, pointerWorld))) * u_interaction;
  float rippleGlow = 0.0;
  for (int i = 0; i < 4; i++) {
    vec4 ripple = u_ripples[i];
    float dist = distance(v_world.xz, ripple.xy);
    float ring = 1.0 - smoothstep(0.0, 0.2 + ripple.w * 0.16, abs(dist - ripple.z));
    rippleGlow += ring * ripple.w;
  }
  float sideFade = 1.0 - smoothstep(9.5, 13.7, abs(v_world.x));
  float farFade = smoothstep(-23.5, -8.0, v_world.z);
  float nearFade = 1.0 - smoothstep(1.2, 3.0, v_world.z);
  float horizonGlow = 1.0 - smoothstep(4.0, 18.0, abs(v_world.z + 15.0));
  float alpha = (minor * 0.17 + major * 0.36 + center * 0.42 + horizonGlow * 0.08 + pointerGlow * 0.22 + rippleGlow * 0.52) * sideFade * farFade * nearFade;
  vec3 color = mix(u_colorA, u_colorB, smoothstep(-12.0, 1.0, v_world.z));
  color += vec3(0.95, 0.78, 0.3) * major * 0.22;
  color += vec3(0.8, 0.95, 1.0) * pointerGlow * 0.3;
  color += vec3(1.0, 0.42, 0.95) * rippleGlow * 0.34;
  gl_FragColor = vec4(color, alpha);
}`;

if (canvas && sceneEl && shell) {
  initStartupScene().catch((error) => {
    debug.error = error?.message || String(error);
    sceneEl.classList.remove("is-webgl-ready");
    console.warn("Startup 3D scene fell back to layered images.", error);
  });
}
