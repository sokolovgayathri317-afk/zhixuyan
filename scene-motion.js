// A living version of the supplied photograph. Architecture and framing stay fixed.
(() => {
  const scene = document.querySelector('.scene-pan');
  const image = scene?.querySelector('.scene-image');
  const control = document.querySelector('.motion-toggle');
  if (!scene || !image || !control) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let paused = reduced.matches;
  let elapsed = 0;
  let lastTime = 0;
  let frame = 0;
  let renderer;

  function updateControl() {
    document.documentElement.classList.toggle('motion-paused', paused);
    control.setAttribute('aria-pressed', String(paused));
    control.setAttribute('aria-label', paused ? '播放动态背景' : '暂停动态背景');
    control.querySelector('.motion-label').textContent = paused ? '播放背景' : '暂停背景';
    control.querySelector('.motion-symbol').textContent = paused ? '▷' : 'Ⅱ';
    control.disabled = false;
  }

  function tick(now) {
    frame = 0;
    if (document.hidden || paused || !renderer) return;
    if (lastTime && now - lastTime < 1000 / 30) {
      frame = requestAnimationFrame(tick);
      return;
    }
    if (lastTime) elapsed = (elapsed + Math.min((now - lastTime) / 1000, .12)) % (Math.PI * 200);
    lastTime = now;
    renderer.draw(elapsed);
    frame = requestAnimationFrame(tick);
  }

  function sync() {
    updateControl();
    document.documentElement.classList.toggle('page-away', document.hidden);
    cancelAnimationFrame(frame);
    lastTime = 0;
    if (!paused && !document.hidden && renderer) frame = requestAnimationFrame(tick);
  }
  control.addEventListener('click', () => { paused = !paused; sync(); });
  reduced.addEventListener('change', () => { paused = reduced.matches; sync(); });
  document.addEventListener('visibilitychange', sync);
  updateControl();

  function start() {
    const canvas = document.createElement('canvas');
    canvas.className = 'scene-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    const gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, powerPreference: 'low-power' });
    if (!gl) return; // The original image and flowing CSS reflections remain available.
    const vertexSource = `
      attribute vec2 position;
      varying vec2 screenUV;
      void main() {
        screenUV = vec2((position.x + 1.0) * 0.5, (1.0 - position.y) * 0.5);
        gl_Position = vec4(position, 0.0, 1.0);
      }`;
    const fragmentSource = `
      #ifdef GL_FRAGMENT_PRECISION_HIGH
      precision highp float;
      #else
      precision mediump float;
      #endif
      uniform sampler2D picture;
      uniform vec2 resolution;
      uniform float time;
      varying vec2 screenUV;
      void main() {
        float aspect = resolution.x / resolution.y;
        float originalAspect = 721.0 / 419.0;
        vec2 scale = vec2(min(aspect / originalAspect, 1.0), min(originalAspect / aspect, 1.0));
        vec2 uv = (screenUV - 0.5) * scale + 0.5;
        vec2 sourceUV = uv;
        // Only the interior of the arch moves; the rim and terrace remain still.
        float arch = 1.0 - smoothstep(.94, 1.0, length((uv - vec2(.578, .732)) / vec2(.351, .655)));
        float sky = arch * smoothstep(.08, .18, uv.y) * (1.0 - smoothstep(.60, .65, uv.y));
        uv.x += sky * (.006 * sin(uv.y * 15.0 + time * .35) + .003 * sin(uv.y * 31.0 - time * .21));
        uv.y += sky * .0018 * sin(uv.x * 19.0 + time * .4);
        float ocean = arch * smoothstep(.65, .69, sourceUV.y) * (1.0 - smoothstep(.75, .78, sourceUV.y));
        float leftBank = .57 - (sourceUV.y - .80) * 1.90;
        float rightBank = .96 - (sourceUV.y - .80) * .75;
        float pool = smoothstep(.807, .83, sourceUV.y) * (1.0 - smoothstep(.944, .96, sourceUV.y));
        pool *= smoothstep(leftBank, leftBank + .035, sourceUV.x) * (1.0 - smoothstep(rightBank - .035, rightBank, sourceUV.x));
        vec3 original = texture2D(picture, sourceUV).rgb;
        float waterColor = smoothstep(.045, .18, original.b - original.r) * smoothstep(.12, .32, original.b);
        float water = max(ocean * .45, pool) * waterColor;
        float waves = sin(sourceUV.y * 175.0 - time * 2.5 + sin(sourceUV.x * 17.0 + time * .45));
        float ripples = sin(sourceUV.y * 320.0 + sourceUV.x * 25.0 - time * 3.6);
        uv.x += water * (.0065 * waves + .003 * sin(sourceUV.y * 250.0 + time * 1.9));
        uv.y += water * (.0022 * ripples + .0015 * waves);
        vec3 color = texture2D(picture, clamp(uv, .001, .999)).rgb;
        float blueWater = smoothstep(.03, .23, color.b - color.r);
        float glint = pow(max(0.0, sin(sourceUV.y * 220.0 - time * 2.8 + sin(sourceUV.x * 32.0 + time * .55))), 9.0);
        color += vec3(.025, .12, .16) * glint * water * blueWater;
        color *= 1.0 + water * blueWater * .09 * waves;
        float horizon = exp(-pow((sourceUV.y - .637) * 65.0, 2.0)) * arch;
        color += vec3(.0, .025, .045) * horizon * (.5 + .5 * sin(sourceUV.x * 15.0 - time * .7));
        // A dark surface covers the screenshot's search control in the reference.
        float sourceControl = (1.0 - smoothstep(.292, .31, sourceUV.x)) * smoothstep(.065, .079, sourceUV.y) * (1.0 - smoothstep(.197, .213, sourceUV.y));
        color = mix(color, vec3(.012, .015, .022), sourceControl);
        gl_FragColor = vec4(color, 1.0);
      }`;
    const shaders = [];
    let program;
    function compile(type, source) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      shaders.push(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error('Scene shader unavailable');
      return shader;
    }
    try {
      program = gl.createProgram();
      gl.attachShader(program, compile(gl.VERTEX_SHADER, vertexSource));
      gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragmentSource));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('Scene renderer unavailable');
      gl.useProgram(program);
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
      const position = gl.getAttribLocation(program, 'position');
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
      const timeUniform = gl.getUniformLocation(program, 'time');
      const resolutionUniform = gl.getUniformLocation(program, 'resolution');
      function draw(time) {
        gl.uniform1f(timeUniform, time);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }
      function resize() {
        const box = scene.getBoundingClientRect();
        const ratio = Math.min(devicePixelRatio || 1, 1.5, 1500 / box.width);
        canvas.width = Math.max(1, Math.round(box.width * ratio));
        canvas.height = Math.max(1, Math.round(box.height * ratio));
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.uniform2f(resolutionUniform, canvas.width, canvas.height);
        draw(elapsed);
      }
      scene.append(canvas);
      renderer = { draw };
      resize();
      scene.classList.add('scene-ready');
      new ResizeObserver(resize).observe(scene);
      canvas.addEventListener('webglcontextlost', event => {
        event.preventDefault();
        cancelAnimationFrame(frame);
        renderer = null;
        scene.classList.remove('scene-ready');
        canvas.remove();
      });
      sync();
    } catch {
      shaders.forEach(shader => gl.deleteShader(shader));
      if (program) gl.deleteProgram(program);
      canvas.remove();
    }
  }
  if (image.complete && image.naturalWidth) start();
  else image.addEventListener('load', start, { once: true });
})();
