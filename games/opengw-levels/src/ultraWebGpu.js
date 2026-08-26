export class UltraWebGpuLayer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ready = false;
    this.failed = false;
    this.initializing = null;
  }

  static supported() {
    return Boolean(navigator.gpu);
  }

  async enable() {
    if (this.ready) return true;
    if (this.failed || !this.canvas || !UltraWebGpuLayer.supported()) return false;
    if (this.initializing) return this.initializing;
    this.initializing = this.initialize().catch((error) => {
      console.warn("Ultra WebGPU effects unavailable; using High WebGL2.", error);
      this.failed = true;
      return false;
    });
    return this.initializing;
  }

  async initialize() {
    const adapter = await navigator.gpu.requestAdapter({ powerPreference: "high-performance" });
    if (!adapter) return false;
    this.device = await adapter.requestDevice();
    this.context = this.canvas.getContext("webgpu");
    this.format = navigator.gpu.getPreferredCanvasFormat();
    this.context.configure({
      device: this.device,
      format: this.format,
      alphaMode: "premultiplied"
    });
    this.uniformBuffer = this.device.createBuffer({
      size: 256,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    const module = this.device.createShaderModule({ code: ULTRA_SHADER });
    this.pipeline = this.device.createRenderPipeline({
      layout: "auto",
      vertex: { module, entryPoint: "vs" },
      fragment: {
        module,
        entryPoint: "fs",
        targets: [{
          format: this.format,
          blend: {
            color: { srcFactor: "src-alpha", dstFactor: "one", operation: "add" },
            alpha: { srcFactor: "one", dstFactor: "one-minus-src-alpha", operation: "add" }
          }
        }]
      },
      primitive: { topology: "triangle-list" }
    });
    this.bindGroup = this.device.createBindGroup({
      layout: this.pipeline.getBindGroupLayout(0),
      entries: [{ binding: 0, resource: { buffer: this.uniformBuffer } }]
    });
    this.ready = true;
    return true;
  }

  resize(width, height) {
    if (!this.canvas) return;
    if (this.canvas.width !== width) this.canvas.width = width;
    if (this.canvas.height !== height) this.canvas.height = height;
  }

  render(frame) {
    if (!this.ready || !frame?.enabled || document.hidden) return;
    const data = new Float32Array(64);
    data[0] = this.canvas.width;
    data[1] = this.canvas.height;
    data[2] = frame.time || 0;
    data[3] = Math.min(4, frame.wells?.length || 0);
    for (let i = 0; i < 4; i += 1) {
      const well = frame.wells?.[i];
      if (!well) continue;
      const offset = 4 + i * 4;
      data[offset] = well.x;
      data[offset + 1] = well.y;
      data[offset + 2] = well.radius;
      data[offset + 3] = well.strength;
    }
    this.device.queue.writeBuffer(this.uniformBuffer, 0, data);
    const encoder = this.device.createCommandEncoder();
    const pass = encoder.beginRenderPass({
      colorAttachments: [{
        view: this.context.getCurrentTexture().createView(),
        clearValue: { r: 0, g: 0, b: 0, a: 0 },
        loadOp: "clear",
        storeOp: "store"
      }]
    });
    pass.setPipeline(this.pipeline);
    pass.setBindGroup(0, this.bindGroup);
    pass.draw(3);
    pass.end();
    this.device.queue.submit([encoder.finish()]);
  }
}

const ULTRA_SHADER = `
struct Uniforms {
  resolution: vec2f,
  time: f32,
  wellCount: f32,
  wells: array<vec4f, 4>,
};

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f,
};

@vertex
fn vs(@builtin(vertex_index) index: u32) -> VertexOutput {
  var positions = array<vec2f, 3>(vec2f(-1.0, -1.0), vec2f(3.0, -1.0), vec2f(-1.0, 3.0));
  var output: VertexOutput;
  output.position = vec4f(positions[index], 0.0, 1.0);
  output.uv = positions[index] * 0.5 + 0.5;
  return output;
}

fn wellField(point: vec2f, well: vec4f) -> f32 {
  let aspect = uniforms.resolution.x / max(uniforms.resolution.y, 1.0);
  let delta = vec2f((point.x - well.x) * aspect, point.y - well.y);
  let distanceToCore = length(delta);
  let ring = exp(-abs(distanceToCore - well.z) * 34.0);
  let volume = exp(-distanceToCore * 7.5) * well.w;
  return ring * 0.55 + volume;
}

@fragment
fn fs(input: VertexOutput) -> @location(0) vec4f {
  var field = 0.0;
  var rays = 0.0;
  for (var i = 0; i < 4; i = i + 1) {
    if (f32(i) >= uniforms.wellCount) { break; }
    let well = uniforms.wells[i];
    field += wellField(input.uv, well);
    let delta = input.uv - well.xy;
    let angle = atan2(delta.y, delta.x);
    rays += pow(max(0.0, sin(angle * 12.0 - uniforms.time * 1.8)), 18.0)
      * exp(-length(delta) * 8.0) * well.w;
  }
  let scan = 0.5 + 0.5 * sin((input.uv.y * uniforms.resolution.y + uniforms.time * 42.0) * 0.07);
  let energy = clamp(field * 0.33 + rays * 0.11 + scan * field * 0.025, 0.0, 0.42);
  let color = mix(vec3f(0.08, 0.75, 1.0), vec3f(0.78, 0.16, 1.0), clamp(field, 0.0, 1.0));
  return vec4f(color * energy, energy);
}`;
