const canvas = document.getElementById("gl-canvas");
const gl = canvas.getContext("webgl");

if (!gl) {
  throw new Error("当前浏览器不支持 WebGL");
}

gl.clearColor(0.02, 0.04, 0.08, 1);

gl.enable(gl.DEPTH_TEST);

gl.viewport(0, 0, canvas.width, canvas.height);

const vertexShaderSource = `
  attribute vec3 position;
  attribute vec3 color;
  uniform mat4 u_model;
  varying vec3 v_color;

  void main() {
    gl_Position = u_model * vec4(position, 1.0);
    v_color = color;
  }
`;

const fragmentShaderSource = `
  precision mediump float;
  varying vec3 v_color;

  void main() {
    gl_FragColor = vec4(v_color, 1.0);
  }
`;

function compileShader(type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`着色器编译失败: ${info}`);
  }

  return shader;
}

const vertexShader = compileShader(gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource);

const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);

if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
  throw new Error(`Program link error: ${gl.getProgramInfoLog(program)}`);
}

gl.useProgram(program);

const vertices = new Float32Array([
  // position        // color
   0.0,  0.7, 0.0,    0.3, 0.8, 1.0,
  -0.6, -0.5, 0.0,    0.6, 0.2, 0.9,
   0.6, -0.5, 0.0,    1.0, 0.7, 0.3,
]);

const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

const stride = 6 * Float32Array.BYTES_PER_ELEMENT;
const positionLocation = gl.getAttribLocation(program, "position");
const colorLocation = gl.getAttribLocation(program, "color");

gl.enableVertexAttribArray(positionLocation);
gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, stride, 0);

gl.enableVertexAttribArray(colorLocation);
gl.vertexAttribPointer(
  colorLocation,
  3,
  gl.FLOAT,
  false,
  stride,
  3 * Float32Array.BYTES_PER_ELEMENT
);

const modelLocation = gl.getUniformLocation(program, "u_model");

let elapsed = 0;
let lastTime = performance.now();

function render(now) {
  const delta = (now - lastTime) / 1000;
  lastTime = now;
  elapsed += delta;

  const angle = elapsed;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  const modelMatrix = new Float32Array([
    cos,  sin, 0, 0,
   -sin,  cos, 0, 0,
      0,    0, 1, 0,
      0,    0, 0, 1,
  ]);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.uniformMatrix4fv(modelLocation, false, modelMatrix);
  gl.drawArrays(gl.TRIANGLES, 0, 3);

  requestAnimationFrame(render);
}

requestAnimationFrame((time) => {
  lastTime = time;
  render(time);
});
