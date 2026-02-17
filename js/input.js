// js/input.js

export const keys = {
    left: false,
    right: false,
    up: false,
    down: false,
};

export function input(canvas) {
    canvas.addEventListener("Keydown", (e) => {
        if (e.code === "ArrowLeft") keys.left = true;
        if (e.code === "ArrowRight") keys.right = true;
        if (e.code === "ArrowUp") keys.up = true;
        if (e.code === "ArrowDown") keys.down = true;
        e.preventDefault(); // Empêche le scroll de la page avec les flèches
    });

    canvas.addEventListener("Keyup", (e) => {
        if (e.code === "ArrowLeft") keys.left = false;
        if (e.code === "ArrowRight") keys.right = false;
        if (e.code === "ArrowUp") keys.up = false;
        if (e.code === "ArrowDown") keys.down = false;
        e.preventDefault(); // Empêche le scroll de la page avec les flèches
    });
}