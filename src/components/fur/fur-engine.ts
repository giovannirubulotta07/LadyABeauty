/**
 * Interactive fur for the home hero (WebGL2).
 *
 * Thousands of short hairs, drawn by the GPU in one instanced call, lie in a
 * natural direction. Moving the pointer (or a finger) brushes them: a coarse
 * "brush field" on the CPU records where and in which direction the fur was
 * stroked, the vertex shader bends each hair accordingly, and the sheen
 * changes with the hair direction — the trail you see when you stroke velvet
 * or a fur coat. The field relaxes slowly, so the fur combs itself back.
 *
 * The coat (leopard rosettes or tiger stripes) is drawn by the shader from
 * the root of each hair, so the pattern is soft-edged like real fur.
 */

/** leopard: tawny with rosettes · tiger: tawny with stripes · rose: soft pink fur, no marks. */
export type FurPattern = "leopard" | "tiger" | "rose";

export type FurOptions = {
  pattern: FurPattern;
  /** No idle swaying; the fur still answers to the visitor's own gestures. */
  reducedMotion: boolean;
};

const VERT = `#version 300 es
layout(location = 0) in vec2 aVert;   // t along the hair (0 root → 1 tip), side (-1 / 1)
layout(location = 1) in vec4 aHair;   // root (0..1 of the canvas), seed, length (px)
uniform vec2 uSize;                   // canvas size in CSS px
uniform sampler2D uField;             // brush field, RG = direction (0.5 = at rest)
uniform float uTime;
uniform float uSway;
uniform float uWidth;
out float vT;
out vec2 vRoot;
out float vSeed;
out float vSheen;
out float vPress;

void main() {
  float t = aVert.x;
  float side = aVert.y;
  vec2 root = aHair.xy * uSize;
  float seed = aHair.z;
  float len = aHair.w;

  vec2 brush = texture(uField, aHair.xy).rg * 2.0 - 1.0;
  float press = clamp(length(brush), 0.0, 1.0);

  // Natural lay of the coat: mostly downward, with a slow organic drift.
  float a = 1.32 + (seed - 0.5) * 0.7
          + sin(aHair.x * 5.0 + aHair.y * 3.0) * 0.35
          + sin(aHair.y * 11.0 - aHair.x * 4.0) * 0.12;
  vec2 lay = vec2(cos(a), sin(a));
  vec2 dir = normalize(lay + brush * 3.6);
  vec2 perp = vec2(-dir.y, dir.x);

  float sway = uSway * sin(uTime * 0.9 + seed * 6.2831 + aHair.x * 3.0) * 0.06;
  float curl = (seed - 0.5) * 0.45 + sway;

  float L = len * (1.0 - 0.32 * press); // stroked fur lies flatter
  vec2 p = root + dir * L * t + perp * curl * L * t * t;
  p += perp * side * uWidth * (1.0 - t * 0.9) * 0.5;

  vec2 clip = p / uSize * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);

  vT = t;
  vRoot = root;
  vSeed = seed;
  vPress = press;
  // Sheen depends on how the hair faces the light: stroked fur catches it differently.
  vSheen = dot(dir, normalize(vec2(0.55, -0.83)));
}`;

const FRAG = `#version 300 es
precision highp float;
in float vT;
in vec2 vRoot;
in float vSeed;
in float vSheen;
in float vPress;
uniform float uPattern;   // 0 leopard, 1 tiger, 2 rose
uniform float uScale;     // pattern size in px
out vec4 outColor;

vec2 hash2(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return fract(sin(p) * 43758.5453);
}
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash2(i).x, b = hash2(i + vec2(1, 0)).x;
  float c = hash2(i + vec2(0, 1)).x, d = hash2(i + vec2(1, 1)).x;
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

// 0 = tawny coat, 1 = dark mark, -1 = warm centre of a rosette
float leopard(vec2 p) {
  p += vec2(noise(p * 1.7), noise(p * 1.7 + 9.1)) * 0.45;
  vec2 i = floor(p), f = fract(p);
  float best = 9.0; vec2 rel = vec2(0); vec2 cell = vec2(0);
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec2 g = vec2(x, y);
    vec2 o = hash2(i + g) * 0.7 + 0.15;
    vec2 r = g + o - f;
    float d = dot(r, r);
    if (d < best) { best = d; rel = r; cell = i + g; }
  }
  float d = sqrt(best);
  float size = 0.82 + hash2(cell + 3.7).x * 0.4;
  d /= size;
  float ang = atan(rel.y, rel.x);
  // A rosette is a broken ring of 3 to 5 dark spots around a warmer centre.
  float gaps = smoothstep(0.15, 0.55, abs(sin(ang * (1.5 + floor(hash2(cell).y * 2.0)) + hash2(cell).x * 6.2831)));
  float ring = smoothstep(0.16, 0.21, d) * (1.0 - smoothstep(0.31, 0.37, d)) * gaps;
  float centre = 1.0 - smoothstep(0.0, 0.17, d);
  // small solid spots between rosettes
  float speck = 1.0 - smoothstep(0.05, 0.09, length(f - hash2(i + 7.3)));
  return max(ring, speck * step(0.55, hash2(i + 1.3).x)) - centre * 0.6;
}

float tiger(vec2 p) {
  float w = noise(p * vec2(0.6, 2.2)) * 2.2 + noise(p * 3.0) * 0.4;
  float s = sin((p.x * 1.15 + w) * 3.1416);
  float stripe = smoothstep(0.55, 0.85, s) * smoothstep(0.15, 0.6, noise(p * vec2(0.4, 1.4) + 4.0) + 0.25);
  return stripe;
}

void main() {
  vec2 p = vRoot / uScale;
  vec3 col;
  vec3 tint = vec3(0.95, 0.78, 0.55);
  if (uPattern > 1.5) {
    // Soft pink faux fur: powder pink tips, deeper rose in the hollows, tonal waves.
    float tone = noise(p * 1.4) * 0.65 + noise(p * 4.0) * 0.2 + vSeed * 0.15;
    col = mix(vec3(0.86, 0.52, 0.60), vec3(1.0, 0.82, 0.86), tone);
    tint = vec3(1.0, 0.86, 0.88);
  } else {
    float m = uPattern < 0.5 ? leopard(p) : tiger(p);
    col = mix(vec3(0.56, 0.36, 0.19), vec3(0.62, 0.42, 0.22), vSeed);
    col = mix(col, vec3(0.05, 0.03, 0.02), clamp(m, 0.0, 1.0));
    col = mix(col, vec3(0.45, 0.24, 0.11), clamp(-m, 0.0, 1.0));
  }

  // Depth: roots in shadow, tips lit; fine strand-to-strand variation.
  // A pale pink coat keeps lighter hollows, or it would read as plum.
  float rootShade = uPattern > 1.5 ? 0.62 : 0.28;
  col *= mix(rootShade, 1.0, smoothstep(0.0, 1.0, vT)) * (0.86 + vSeed * 0.22);
  // Velvet sheen: changes with the hair direction, so strokes leave a trail.
  float sheen = pow(max(vSheen, 0.0), 2.5) * vT;
  col += sheen * tint * (0.2 + vPress * 0.45);
  // Stroked fur shows a lighter, glossier trail, like velvet brushed the wrong way.
  col *= 1.0 + vPress * 0.5 * vT;

  float alpha = 1.0 - smoothstep(0.82, 1.0, vT) * 0.75;
  outColor = vec4(col, alpha);
}`;

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
    throw new Error(gl.getShaderInfoLog(s) ?? "shader");
  return s;
}

/** Starts the fur on `canvas`, sized to `host`. Returns a cleanup, or null without WebGL2. */
export function startFur(
  canvas: HTMLCanvasElement,
  host: HTMLElement,
  { pattern, reducedMotion }: FurOptions,
): (() => void) | null {
  const gl = canvas.getContext("webgl2", {
    antialias: true,
    alpha: false,
    powerPreference: "low-power",
  });
  if (!gl) return null;

  // Without a real GPU (software rendering: old machines, some VMs, page-speed
  // robots) thousands of hairs would freeze the page: keep the solid hero.
  const info = gl.getExtension("WEBGL_debug_renderer_info");
  const renderer = String(
    info
      ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL)
      : gl.getParameter(gl.RENDERER),
  );
  const forced = new URLSearchParams(location.search).has("fourrure");
  if (!forced && /swiftshader|llvmpipe|software|basic render/i.test(renderer)) {
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return null;
  }

  const program = gl.createProgram()!;
  try {
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  } catch {
    return null;
  }
  gl.useProgram(program);
  const u = (name: string) => gl.getUniformLocation(program, name);
  const uSize = u("uSize");
  const uTime = u("uTime");
  const uSway = u("uSway");
  const uWidth = u("uWidth");
  gl.uniform1f(
    u("uPattern"),
    pattern === "tiger" ? 1 : pattern === "rose" ? 2 : 0,
  );
  gl.uniform1i(u("uField"), 0);

  // One hair = a tapered strip of 5 rows (10 vertices).
  const ROWS = 5;
  const strip = new Float32Array(ROWS * 2 * 2);
  for (let i = 0; i < ROWS; i++) {
    const t = i / (ROWS - 1);
    strip.set([t, -1, t, 1], i * 4);
  }
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const stripBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, stripBuf);
  gl.bufferData(gl.ARRAY_BUFFER, strip, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const hairBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, hairBuf);
  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 0, 0);
  gl.vertexAttribDivisor(1, 1);

  // Brush field (coarse grid, interpolated by the GPU).
  const field = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, field);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  if (pattern === "rose") gl.clearColor(0.55, 0.3, 0.36, 1);
  else gl.clearColor(0.09, 0.055, 0.035, 1);

  let width = 0;
  let height = 0;
  let hairs = 0;
  let gw = 0;
  let gh = 0;
  let fx = new Float32Array(0);
  let fy = new Float32Array(0);
  let bytes = new Uint8Array(0);
  const fine = window.matchMedia("(pointer: fine)").matches;

  function layout() {
    const rect = host.getBoundingClientRect();
    width = Math.max(1, Math.round(rect.width));
    height = Math.max(1, Math.round(rect.height));
    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    gl!.viewport(0, 0, canvas.width, canvas.height);

    // Hair density: denser on large screens, lighter on phones.
    const spacing = (fine ? 5.2 : 4.4) * 1.35 ** lighter;
    const cols = Math.ceil(width / spacing);
    const rows = Math.ceil(height / spacing) + 6;
    const data = new Float32Array(cols * rows * 4);
    let k = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const jx = Math.random() - 0.5;
        const jy = Math.random() - 0.5;
        data[k++] = ((c + 0.5 + jx) * spacing) / width;
        data[k++] = ((r - 4 + jy) * spacing) / height; // start above the top edge
        data[k++] = Math.random();
        data[k++] = fine ? 28 + Math.random() * 14 : 15 + Math.random() * 8;
      }
    }
    hairs = cols * rows;
    gl!.bindBuffer(gl!.ARRAY_BUFFER, hairBuf);
    gl!.bufferData(gl!.ARRAY_BUFFER, data, gl!.STATIC_DRAW);

    gw = 72;
    gh = Math.max(8, Math.round((gw * height) / width));
    fx = new Float32Array(gw * gh);
    fy = new Float32Array(gw * gh);
    bytes = new Uint8Array(gw * gh * 2);

    gl!.uniform2f(uSize, width, height);
    gl!.uniform1f(uWidth, fine ? 1.6 : 2.1);
    gl!.uniform1f(
      u("uScale"),
      fine ? Math.max(90, Math.min(width, height) / 5.5) : 64,
    );
    wake();
  }

  // --- Brushing ------------------------------------------------------------
  let last: { x: number; y: number; t: number } | null = null;
  let lastInput = 0;
  function brush(clientX: number, clientY: number) {
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const now = performance.now();
    if (x < -40 || y < -40 || x > rect.width + 40 || y > rect.height + 40) {
      last = null;
      return;
    }
    if (last && now - last.t < 400) {
      // Frame-rate independent: the stroke is measured in pixels, not in time.
      const mx = x - last.x;
      const my = y - last.y;
      const dist = Math.hypot(mx, my);
      if (dist < 0.5) return;
      const amount = Math.min(1, dist / 14) * 0.9;
      const ux = mx / dist;
      const uy = my / dist;
      const radius = fine ? 120 : 80;
      const cx = (x / width) * gw;
      const cy = (y / height) * gh;
      const rx = (radius / width) * gw;
      const ry = (radius / height) * gh;
      for (
        let j = Math.max(0, Math.floor(cy - ry));
        j <= Math.min(gh - 1, Math.ceil(cy + ry));
        j++
      ) {
        for (
          let i = Math.max(0, Math.floor(cx - rx));
          i <= Math.min(gw - 1, Math.ceil(cx + rx));
          i++
        ) {
          const dx = (i + 0.5 - cx) / rx;
          const dy = (j + 0.5 - cy) / ry;
          const d = dx * dx + dy * dy;
          if (d >= 1) continue;
          const w = (1 - d) * (1 - d);
          const n = j * gw + i;
          // Combed along the stroke, and parted a little around the fingertip.
          fx[n] = fx[n]! + (ux * amount + dx * 0.22) * w;
          fy[n] = fy[n]! + (uy * amount + dy * 0.22) * w;
          const m = Math.hypot(fx[n]!, fy[n]!);
          if (m > 1) {
            fx[n] = fx[n]! / m;
            fy[n] = fy[n]! / m;
          }
        }
      }
      lastInput = now;
      wake();
    }
    last = { x, y, t: now };
  }
  const onPointer = (e: PointerEvent) => brush(e.clientX, e.clientY);
  const onTouch = (e: TouchEvent) => {
    const t = e.touches[0];
    if (t) brush(t.clientX, t.clientY);
  };
  window.addEventListener("pointermove", onPointer, { passive: true });
  window.addEventListener("touchmove", onTouch, { passive: true });

  // --- Rendering -------------------------------------------------------------
  let frame = 0;
  let running = false;
  let visible = true;
  const start = performance.now();

  function step() {
    // The fur combs itself back, slowly.
    let energy = 0;
    for (let n = 0; n < fx.length; n++) {
      fx[n] = fx[n]! * 0.991;
      fy[n] = fy[n]! * 0.991;
      energy += Math.abs(fx[n]!) + Math.abs(fy[n]!);
      bytes[n * 2] = Math.round((fx[n]! * 0.5 + 0.5) * 255);
      bytes[n * 2 + 1] = Math.round((fy[n]! * 0.5 + 0.5) * 255);
    }
    gl!.texImage2D(
      gl!.TEXTURE_2D,
      0,
      gl!.RG8,
      gw,
      gh,
      0,
      gl!.RG,
      gl!.UNSIGNED_BYTE,
      bytes,
    );
    return energy;
  }

  // Adaptive quality: on a slow device the coat gets fewer, wider hairs.
  let lastFrame = 0;
  let slowFrames = 0;
  let lighter = 0;

  function render(now: number) {
    frame = 0;
    if (lastFrame && now - lastFrame > 45) slowFrames++;
    else slowFrames = Math.max(0, slowFrames - 1);
    lastFrame = now;
    if (slowFrames > 12 && lighter < 2) {
      lighter++;
      slowFrames = 0;
      layout();
      return;
    }

    const energy = step();
    gl!.uniform1f(uTime, (performance.now() - start) / 1000);
    // The hairs only stir while the coat is being touched (never on their own).
    gl!.uniform1f(uSway, reducedMotion ? 0 : Math.min(1, energy / 40));
    gl!.clear(gl!.COLOR_BUFFER_BIT);
    gl!.bindVertexArray(vao);
    gl!.drawArraysInstanced(gl!.TRIANGLE_STRIP, 0, ROWS * 2, hairs);

    // At rest the GPU sleeps: one still frame until the next touch.
    const settled = energy < 0.5 && performance.now() - lastInput > 400;
    if (visible && !settled) frame = requestAnimationFrame(render);
    else {
      running = false;
      lastFrame = 0;
    }
  }

  function wake() {
    if (running || !visible) return;
    running = true;
    frame = requestAnimationFrame(render);
  }

  const resize = new ResizeObserver(() => layout());
  resize.observe(host);
  const seen = new IntersectionObserver(([entry]) => {
    visible = Boolean(entry?.isIntersecting) && !document.hidden;
    if (visible) wake();
  });
  seen.observe(host);
  const onVisibility = () => {
    visible = !document.hidden;
    if (visible) wake();
  };
  document.addEventListener("visibilitychange", onVisibility);

  layout(); // schedules the first frame

  return () => {
    cancelAnimationFrame(frame);
    resize.disconnect();
    seen.disconnect();
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("pointermove", onPointer);
    window.removeEventListener("touchmove", onTouch);
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  };
}
