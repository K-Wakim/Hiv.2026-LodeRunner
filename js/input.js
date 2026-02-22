// js/input.js

export const keys = {
  left: false,
  right: false,
  up: false,
  down: false,
};

export function input(canvas, joueur) {
  canvas.addEventListener("keydown", (e) => {
    if (e.code === "ArrowLeft") keys.left = true;
    if (e.code === "ArrowRight") keys.right = true;
    if (e.code === "ArrowUp") keys.up = true;
    if (e.code === "ArrowDown") keys.down = true;
    if (e.code === "KeyX") joueur.detruitBrique(true);
    if (e.code === "KeyC") joueur.detruitBrique(false);

    e.preventDefault(); // Empêche le scroll de la page avec les flèches
  });

  canvas.addEventListener("keyup", (e) => {
    if (e.code === "ArrowLeft") keys.left = false;
    if (e.code === "ArrowRight") keys.right = false;
    if (e.code === "ArrowUp") keys.up = false;
    if (e.code === "ArrowDown") keys.down = false;
    e.preventDefault(); // Empêche le scroll de la page avec les flèches
  });
}
