const canvas = document.getElementById('canvas');
  const ctx    = canvas.getContext('2d');

  let escenaActual = 0; // índice de la escena que se muestra

  const lineas = [
    {
      label: "Caso 1 — Aceptación trivial", // etiqueta para mostrar en la interfaz
      desc:  "Ambos puntos dentro → se dibuja completa.",
      p1: { x: 150, y: 160 },
      p2: { x: 320, y: 290 }
    },
    {
      label: "Caso 2 — Rechazo trivial",
      desc:  "Ambos puntos fuera del mismo lado → se descarta.",
      p1: { x: 20,  y: 20  },
      p2: { x: 90,  y: 70  }
    },
    {
      label: "Caso 3 — Recorte por un lado",
      desc:  "Un punto dentro, otro fuera por la derecha.",
      p1: { x: 200, y: 210 },
      p2: { x: 460, y: 250 }
    },
    {
      label: "Caso 4 — Recorte por dos lados",
      desc:  "La línea cruza dos bordes de la ventana.",
      p1: { x: 40,  y: 60  },
      p2: { x: 460, y: 430 }
    },
    {
      label: "Caso 5 — Línea vertical",
      desc:  "Línea casi vertical que cruza borde sup. e inf.",
      p1: { x: 240, y: 20  },
      p2: { x: 255, y: 480 }
    }
  ];

  //Función base: pinta exactamente 1 píxel en (x, y). Todo el trazado gráfico pasa por aquí.
  function drawPixel(x, y, color = '#ffffff') {
    ctx.fillStyle = color;
    // fillRect(x, y, 1, 1) → exactamente 1 píxel
    ctx.fillRect(Math.floor(x), Math.floor(y), 1, 1);
  }

   function assignCode(x, y, v) {
    let code = 0;                      // empezamos con 0000

    if (x < v.xmin) code |= 0b0001;   // LEFT   — fuera por la izquierda
    if (x > v.xmax) code |= 0b0010;   // RIGHT  — fuera por la derecha
    if (y > v.ymax) code |= 0b0100;   // BOTTOM — fuera por abajo (y↓)
    if (y < v.ymin) code |= 0b1000;   // TOP    — fuera por arriba

    return code; // retorna el código binario de 4 bits
  }

  function codeStr(code) {
    return code.toString(2).padStart(4, '0');
  }

  function cohenSutherland(x0, y0, x1, y1, v) {

    // Códigos de región iniciales de cada extremo
    let c0 = assignCode(x0, y0, v);
    let c1 = assignCode(x1, y1, v);

    // Guardamos los códigos originales para mostrar en el panel
    const c0orig = c0;
    const c1orig = c1;

    // Iteramos hasta aceptar o rechazar la línea
    while (true) {

      // ── Paso 2: Aceptación trivial ──
      // Si ambos códigos son 0000, la línea está completamente dentro
      if ((c0 | c1) === 0) {
        // Retornamos los puntos (posiblemente ya recortados)
        return { acepta: true, x0, y0, x1, y1, c0: c0orig, c1: c1orig };
      }

      // ── Paso 3: Rechazo trivial ──
      // Si el AND de ambos códigos != 0, ambos están del mismo lado
      if ((c0 & c1) !== 0) {
        return { acepta: false, x0, y0, x1, y1, c0: c0orig, c1: c1orig };
      }

      // ── Paso 4: Intersección ──
      // Elegimos el punto que está fuera (código != 0)
      // Usamos c0; si c0==0 usamos c1.
      let cOut = (c0 !== 0) ? c0 : c1;

      let xi, yi; // punto de intersección con el borde

      // Calculamos la pendiente para la fórmula de intersección
      // Evitamos división por cero con un pequeño delta
      let dx = x1 - x0;
      let dy = y1 - y0;

      // Determinamos con qué borde intersecta cOut
      // Orden: TOP → BOTTOM → RIGHT → LEFT

      if (cOut & 0b1000) {
        // Borde SUPERIOR (y < ymin): intersecta con y = ymin
        // x = x0 + dx * (ymin - y0) / dy
        yi = v.ymin;
        xi = x0 + dx * (v.ymin - y0) / dy;

      } else if (cOut & 0b0100) {
        // Borde INFERIOR (y > ymax): intersecta con y = ymax
        // x = x0 + dx * (ymax - y0) / dy
        yi = v.ymax;
        xi = x0 + dx * (v.ymax - y0) / dy;

      } else if (cOut & 0b0010) {
        // Borde DERECHO (x > xmax): intersecta con x = xmax
        // y = y0 + dy * (xmax - x0) / dx
        xi = v.xmax;
        yi = y0 + dy * (v.xmax - x0) / dx;

      } else {
        // Borde IZQUIERDO (x < xmin): intersecta con x = xmin
        // y = y0 + dy * (xmin - x0) / dx
        xi = v.xmin;
        yi = y0 + dy * (v.xmin - x0) / dx;
      }

      // Reemplazamos el punto externo por el punto de intersección
      if (cOut === c0) {
        // p0 estaba fuera → lo movemos a la intersección
        x0 = xi; y0 = yi;
        c0 = assignCode(x0, y0, v); // recalculamos su código
      } else {
        // p1 estaba fuera → lo movemos a la intersección
        x1 = xi; y1 = yi;
        c1 = assignCode(x1, y1, v); // recalculamos su código
      }
      // El while vuelve a evaluar con los nuevos puntos
    }
  }
  
  // traza el rectángulo de la ventana de recorte píxel a píxel.
  //  Internamente usa Bresenham para cada arista.
  //  Recibe la ventana y el contexto, no retorna nada visible
  //  pero pinta las 4 aristas del viewport en el canvas.

  function drawViewport(v, color = '#4ab8e8') {

    /**
     * Traza un segmento de (ax,ay) a (bx,by) pixel a pixel
     * usando Bresenham (interno a drawViewport).
     */
    function segmento(ax, ay, bx, by) {
      ax=Math.floor(ax); ay=Math.floor(ay);
      bx=Math.floor(bx); by=Math.floor(by);
      let dx=Math.abs(bx-ax), dy=Math.abs(by-ay);
      let sx=ax<bx?1:-1,      sy=ay<by?1:-1;
      let p=(dx>=dy)?(2*dy-dx):(2*dx-dy);
      let x=ax, y=ay;
      if (dx >= dy) {
        for (let i=0;i<=dx;i++) {
          drawPixel(x,y,color);
          if(p>=0){y+=sy;p+=2*dy-2*dx;}else{p+=2*dy;}
          x+=sx;
        }
      } else {
        for (let i=0;i<=dy;i++) {
          drawPixel(x,y,color);
          if(p>=0){x+=sx;p+=2*dx-2*dy;}else{p+=2*dx;}
          y+=sy;
        }
      }
    }

    // Las 4 aristas del rectángulo de recorte
    segmento(v.xmin, v.ymin, v.xmax, v.ymin); // arriba
    segmento(v.xmax, v.ymin, v.xmax, v.ymax); // derecha
    segmento(v.xmin, v.ymax, v.xmax, v.ymax); // abajo
    segmento(v.xmin, v.ymin, v.xmin, v.ymax); // izquierda
  }

  


