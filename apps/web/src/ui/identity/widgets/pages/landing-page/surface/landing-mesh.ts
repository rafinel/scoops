const VERTEX_SHADER = `
  attribute vec2 position;
  void main() { gl_Position = vec4(position, 0.0, 1.0); }
`

const FRAGMENT_SHADER = `
  precision highp float;
  uniform vec2 resolution;
  uniform vec2 mouse;
  uniform float influence;
  uniform float time;
  uniform vec3 ink;
  uniform vec3 purple;
  uniform vec3 deep;

  float hash(vec2 point) {
    return fract(sin(dot(point, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 point) {
    vec2 cell = floor(point);
    vec2 fraction = fract(point);
    vec2 curve = fraction * fraction * (3.0 - 2.0 * fraction);
    return mix(mix(hash(cell), hash(cell + vec2(1.0, 0.0)), curve.x),
      mix(hash(cell + vec2(0.0, 1.0)), hash(cell + vec2(1.0)), curve.x), curve.y);
  }

  float field(vec2 point) {
    float value = 0.0;
    float weight = 0.5;
    for (int octave = 0; octave < 4; octave++) {
      value += weight * noise(point);
      point = mat2(1.6, 1.2, -1.2, 1.6) * point + 2.7;
      weight *= 0.5;
    }
    return value;
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / resolution;
    uv.y = 1.0 - uv.y;
    float phase = time * 0.055;
    vec2 pointerOffset = uv - mouse;
    float pointerReach = exp(-dot(pointerOffset, pointerOffset) * 8.0);
    vec2 meshUv = uv + (mouse - vec2(0.5, 0.3)) * influence * 1.6;
    meshUv += pointerOffset * pointerReach * influence * 1.1;
    vec2 flow = vec2(field(meshUv * 2.0 + phase), field(meshUv * 2.0 - phase + 4.3));
    float mesh = field(meshUv * vec2(2.4, 3.6) + flow * 2.2 + vec2(phase, -phase));
    float edges = smoothstep(0.08, 0.5, abs(uv.x - 0.5));
    float center = smoothstep(0.12, 0.5, length((uv - vec2(0.52, 0.3)) * vec2(1.0, 1.5)));
    float colorField = smoothstep(0.36, 0.58, mesh) * mix(0.3, 1.0, edges) * center;
    vec3 color = mix(ink, mix(deep, purple, smoothstep(0.34, 0.55, mesh)), colorField);
    float glow = exp(-dot(pointerOffset, pointerOffset) * 12.0) * influence;
    color = mix(color, purple, glow * 0.5 * mix(0.25, 1.0, center));
    float grain = (hash(gl_FragCoord.xy) - 0.5) * 0.018;
    gl_FragColor = vec4(color + grain, 1.0);
  }
`

export type LandingMeshFrame = { x: number; y: number; influence: number; time: number }

export function createLandingMesh(canvas: HTMLCanvasElement) {
  const context = canvas.getContext('webgl', { antialias: false, alpha: true })
  if (!context) return null
  const gl = context
  const program = createMeshProgram(gl)
  if (!program) return null
  const buffer = createMeshGeometry(gl, program)
  const uniforms = Object.fromEntries(
    ['resolution', 'mouse', 'influence', 'time', 'ink', 'purple', 'deep'].map((name) => [
      name,
      gl.getUniformLocation(program, name),
    ]),
  )
  const styles = getComputedStyle(canvas)
  for (const [name, token] of [
    ['ink', '--landing-ink'],
    ['purple', '--primary'],
    ['deep', '--landing-deep'],
  ]) {
    gl.uniform3fv(uniforms[name], parseMeshColor(styles.getPropertyValue(token)))
  }

  function render(frame: LandingMeshFrame) {
    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.uniform2f(uniforms.resolution, canvas.width, canvas.height)
    gl.uniform2f(uniforms.mouse, frame.x, frame.y)
    gl.uniform1f(uniforms.influence, frame.influence)
    gl.uniform1f(uniforms.time, frame.time)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
  }

  function dispose() {
    gl.deleteBuffer(buffer)
    gl.deleteProgram(program)
  }

  return { render, dispose }
}

function createMeshGeometry(gl: WebGLRenderingContext, program: WebGLProgram) {
  const buffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
    gl.STATIC_DRAW,
  )
  // biome-ignore lint/correctness/useHookAtTopLevel: WebGL API, not a React hook.
  gl.useProgram(program)
  const position = gl.getAttribLocation(program, 'position')
  gl.enableVertexAttribArray(position)
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)
  return buffer
}

function createMeshProgram(gl: WebGLRenderingContext) {
  const vertex = compileMeshShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER)
  const fragment = compileMeshShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER)
  const program = gl.createProgram()
  if (vertex && fragment && program) {
    gl.attachShader(program, vertex)
    gl.attachShader(program, fragment)
    gl.linkProgram(program)
  }
  if (vertex) gl.deleteShader(vertex)
  if (fragment) gl.deleteShader(fragment)
  if (!program) return null
  if (!vertex || !fragment || !gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program)
    return null
  }
  return program
}

function compileMeshShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader
  gl.deleteShader(shader)
  return null
}

function parseMeshColor(value: string) {
  const hex = value.trim().replace('#', '')
  return [0, 2, 4].map(
    (offset) => Number.parseInt(hex.slice(offset, offset + 2), 16) / 255,
  )
}
