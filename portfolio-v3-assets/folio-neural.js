/* A decorative neural network, rendered locally and paused outside the viewport. */
(() => {
  const host = document.querySelector(".neural-visual");
  if (!host) return;
  const canvas = host.querySelector("canvas");
  const context = canvas.getContext("2d");
  if (!context) return;
  const toggle = host.querySelector("button");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const points = [];
  const paths = [];
  const nodes = [];
  const folds = [];
  let width = 0,
    height = 0,
    frame = 0,
    lastTime = 0,
    elapsed = 0;
  let visible = false,
    paused = reduced.matches,
    signalUntil = 0;

  // Two folded hemispheres with a central cleft; the image is conceptual.
  function point(side, latitude, longitude) {
    const wave = 1 + 0.065 * Math.sin(longitude * 7 + latitude * 5);
    const ring = Math.sin(latitude);
    return {
      x: side * 0.42 + 0.43 * ring * Math.cos(longitude) * wave,
      y: 0.62 * Math.cos(latitude),
      z: 0.51 * ring * Math.sin(longitude) * wave,
    };
  }
  for (const side of [-1, 1]) {
    // Smooth frontal folds make the two hemispheres readable at small sizes.
    const contours = [
      [
        [0.12, -0.49],
        [0.33, -0.58],
        [0.59, -0.46],
        [0.74, -0.24],
        [0.77, 0.03],
        [0.68, 0.32],
        [0.46, 0.52],
        [0.22, 0.43],
        [0.12, 0.24],
      ],
      [
        [0.13, -0.35],
        [0.3, -0.43],
        [0.51, -0.33],
        [0.59, -0.17],
        [0.49, -0.08],
        [0.3, -0.16],
        [0.14, -0.08],
      ],
      [
        [0.14, 0.07],
        [0.31, 0.01],
        [0.5, 0.12],
        [0.65, 0.05],
        [0.68, 0.17],
        [0.55, 0.34],
        [0.36, 0.27],
        [0.18, 0.35],
      ],
      [
        [0.21, -0.26],
        [0.35, -0.3],
        [0.45, -0.22],
      ],
      [
        [0.23, 0.16],
        [0.37, 0.18],
        [0.48, 0.13],
      ],
    ];
    for (const contour of contours) {
      const fold = [];
      for (let i = 0; i < contour.length - 1; i++) {
        const a = contour[Math.max(0, i - 1)],
          b = contour[i];
        const c = contour[i + 1],
          d = contour[Math.min(contour.length - 1, i + 2)];
        for (let step = 0; step <= 12; step++) {
          const t = step / 12;
          const xy = b.map(
            (value, axis) =>
              0.5 *
              (2 * value +
                (-a[axis] + c[axis]) * t +
                (2 * a[axis] - 5 * value + 4 * c[axis] - d[axis]) * t * t +
                (-a[axis] + 3 * value - 3 * c[axis] + d[axis]) * t * t * t),
          );
          fold.push({
            x: side * xy[0],
            y: xy[1],
            z: 0.37 + 0.06 * Math.cos(xy[1] * 4),
          });
        }
      }
      folds.push(fold);
    }
    for (let line = 1; line < 12; line++) {
      const path = [];
      for (let step = 0; step <= 72; step++) {
        const longitude = (step / 72) * Math.PI * 2;
        const latitude =
          (line / 12) * Math.PI + 0.06 * Math.sin(longitude * 4 + line);
        path.push(point(side, latitude, longitude));
      }
      paths.push(path);
    }
    for (let line = 0; line < 10; line++) {
      const path = [];
      for (let step = 1; step < 48; step++) {
        const latitude = (step / 48) * Math.PI;
        const longitude =
          (line / 10) * Math.PI * 2 + 0.1 * Math.sin(latitude * 8 + line);
        path.push(point(side, latitude, longitude));
      }
      paths.push(path);
    }
    for (let i = 0; i < 22; i++) {
      const latitude = Math.acos(1 - (2 * (i + 0.5)) / 22);
      const longitude = i * 2.399963;
      nodes.push(point(side, latitude, longitude));
    }
  }
  for (let a = 0; a < nodes.length; a++) {
    for (let b = a + 1; b < nodes.length; b++) {
      const p = nodes[a],
        q = nodes[b];
      const distance = Math.hypot(p.x - q.x, p.y - q.y, p.z - q.z);
      if (distance < 0.48) points.push([a, b]);
    }
  }
  function draw() {
    if (!width || !height) return;
    context.clearRect(0, 0, width, height);
    const angle = 0.1 + 0.14 * Math.sin(elapsed * 0.00018);
    const scale = Math.min(width / 2.3, height / 1.75);
    function project(p) {
      const x = p.x * Math.cos(angle) + p.z * Math.sin(angle);
      const depth = p.z * Math.cos(angle) - p.x * Math.sin(angle);
      const perspective = 3.8 / (3.8 - depth);
      return {
        x: width / 2 + x * scale * perspective,
        y: height / 2 + (p.y + depth * 0.08) * scale * perspective,
        z: depth,
      };
    }
    const glow = context.createRadialGradient(
      width / 2,
      height / 2,
      0,
      width / 2,
      height / 2,
      scale * 1.25,
    );
    glow.addColorStop(0, "rgba(158,112,182,.12)");
    glow.addColorStop(1, "rgba(158,112,182,0)");
    context.fillStyle = glow;
    context.fillRect(0, 0, width, height);
    // Layered translucent surfaces give the folds a shaded volume to sit on.
    for (const side of [-1, 1]) {
      context.beginPath();
      for (let step = 0; step <= 80; step++) {
        const t = (step / 80) * Math.PI * 2;
        const edge = project({
          x: side * 0.42 + 0.435 * Math.cos(t),
          y: 0.625 * Math.sin(t),
          z: 0,
        });
        if (step === 0) context.moveTo(edge.x, edge.y);
        else context.lineTo(edge.x, edge.y);
      }
      context.closePath();
      const center = project({ x: side * 0.42, y: 0, z: 0 });
      const material = context.createRadialGradient(
        center.x - scale * 0.2,
        center.y - scale * 0.3,
        0,
        center.x,
        center.y,
        scale * 0.8,
      );
      material.addColorStop(0, "rgba(79,116,113,.55)");
      material.addColorStop(0.45, "rgba(31,55,57,.7)");
      material.addColorStop(1, "rgba(11,22,30,.92)");
      context.fillStyle = material;
      context.shadowColor = "#050b12";
      context.shadowBlur = 18;
      context.fill();
      context.shadowBlur = 0;
      context.strokeStyle = "rgba(180,207,202,.24)";
      context.lineWidth = 0.8;
      context.stroke();
    }
    for (const [index, path] of paths.entries()) {
      context.beginPath();
      path.forEach((p, i) => {
        const v = project(p);
        if (i === 0) context.moveTo(v.x, v.y);
        else context.lineTo(v.x, v.y);
      });
      context.strokeStyle =
        index % 3 === 0 ? "rgba(165,225,216,.12)" : "rgba(184,149,211,.07)";
      context.lineWidth = 0.55;
      context.shadowColor = "#9be1d2";
      context.shadowBlur = 0;
      context.stroke();
      context.shadowBlur = 0;
    }
    const projected = nodes.map(project);
    context.lineWidth = 0.65;
    for (const [a, b] of points) {
      const p = projected[a],
        q = projected[b];
      context.beginPath();
      context.moveTo(p.x, p.y);
      context.lineTo(q.x, q.y);
      context.strokeStyle = "rgba(141,214,208,.12)";
      context.stroke();
    }
    for (const fold of folds) {
      context.beginPath();
      fold.forEach((point, i) => {
        const p = project(point);
        if (i === 0) context.moveTo(p.x, p.y);
        else context.lineTo(p.x, p.y);
      });
      context.strokeStyle = "rgba(10,27,32,.7)";
      context.lineWidth = 5;
      context.stroke();
      context.strokeStyle = "rgba(193,231,220,.82)";
      context.lineWidth = 1.5;
      context.lineCap = "round";
      context.shadowColor = "#72cdbb";
      context.shadowBlur = 4;
      context.stroke();
      context.shadowBlur = 0;
      if (elapsed < signalUntil && !paused) {
        const progress = 1 - (signalUntil - elapsed) / 1800;
        const point = project(
          fold[
            Math.min(fold.length - 1, Math.floor(progress * (fold.length - 1)))
          ],
        );
        context.beginPath();
        context.arc(point.x, point.y, 2.6, 0, Math.PI * 2);
        context.fillStyle = "#e0fff4";
        context.shadowColor = "#adf5dc";
        context.shadowBlur = 12;
        context.fill();
        context.shadowBlur = 0;
      }
    }
    const pulse = elapsed < signalUntil;
    projected
      .map((p, i) => ({ ...p, index: i }))
      .sort((a, b) => a.z - b.z)
      .forEach((p) => {
        const i = p.index;
        const lit = pulse && (elapsed * 0.004 + i * 0.44) % (Math.PI * 2) < 1.1;
        const radius = lit ? 2.2 : 1 + (p.z + 0.5) * 0.45;
        context.beginPath();
        context.arc(p.x, p.y, radius, 0, Math.PI * 2);
        context.shadowColor = lit ? "#bbf5e4" : "#b7a0d3";
        context.shadowBlur = lit ? 10 : 3;
        context.fillStyle = lit ? "#c8ffed" : p.z > 0 ? "#b8e4d9" : "#867a9c";
        context.fill();
        context.shadowBlur = 0;
      });
  }
  function tick(time) {
    frame = 0;
    if (!visible || paused || document.hidden) return;
    const delta = lastTime ? time - lastTime : 1000 / 30;
    if (delta >= 1000 / 30) {
      elapsed += Math.min(delta, 100);
      lastTime = time;
      draw();
    }
    frame = requestAnimationFrame(tick);
  }
  function sync() {
    cancelAnimationFrame(frame);
    frame = 0;
    lastTime = 0;
    toggle.textContent = paused ? "Play animation" : "Pause animation";
    toggle.setAttribute("aria-pressed", String(!paused));
    draw();
    if (visible && !paused && !document.hidden)
      frame = requestAnimationFrame(tick);
  }
  toggle.addEventListener("click", () => {
    paused = !paused;
    sync();
  });
  reduced.addEventListener("change", () => {
    paused = reduced.matches;
    sync();
  });
  document.addEventListener("visibilitychange", sync);
  document.querySelector("#folio-reader").addEventListener("change", () => {
    signalUntil = elapsed + 1800;
    sync();
  });
  new IntersectionObserver(
    (entries) => {
      visible = entries[0].isIntersecting;
      sync();
    },
    { threshold: 0.15 },
  ).observe(host);
  new ResizeObserver(() => {
    const bounds = host.getBoundingClientRect();
    width = bounds.width;
    height = canvas.getBoundingClientRect().height;
    const ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    draw();
  }).observe(host);
  host.hidden = false;
  sync();
})();
