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
  