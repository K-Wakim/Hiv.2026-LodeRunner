/*
 * LIBRAIRIE DE FONCTIONS DE DESSIN POUR LE HUD
 */

function dessinerBordure(canvas, ctx) {
  ctx.strokeStyle = "yellow";
  ctx.lineWidth = 64;
  ctx.strokeRect(0, 0, canvas.width, canvas.height);
}

function dessinerTitre(ctx, canvas) {
  ctx.font = "40px Arial";
  ctx.strokeStyle = "black";
  ctx.lineWidth = 2;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.strokeText("Lode Runner", canvas.width / 2, 0 + 19);
}

function dessinerNoms(ctx, canvas) {
  ctx.font = "32px Arial";
  ctx.strokeStyle = "black";
  ctx.lineWidth = 2;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.strokeText(
    "Par Kamal Wakim et Samuel Filteau-Hubert",
    canvas.width / 2,
    canvas.height - 15,
  );
}

function dessinerScore(ctx, canvas, score = 0) {
  ctx.font = "42px Arial";
  ctx.strokeStyle = "black";
  ctx.fillStyle = "yellow";
  ctx.lineWidth = 2;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.strokeText(
    `Score: ${String(score).padStart(4, "0")}`,
    canvas.width / 4 - 50,
    canvas.height - 100,
  );
  ctx.fillText(
    `Score: ${String(score).padStart(4, "0")}`,
    canvas.width / 4 - 50,
    canvas.height - 100,
  );
}

function dessinerTemps(ctx, canvas, temps = "00:00") {
  ctx.font = "42px Arial";
  ctx.strokeStyle = "black";
  ctx.fillStyle = "yellow";
  ctx.lineWidth = 2;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.strokeText(
    `Temps: ${String(temps)}`,
    canvas.width / 2 - 50,
    canvas.height - 100,
  );
  ctx.fillText(
    `Temps: ${String(temps)}`,
    canvas.width / 2 - 50,
    canvas.height - 100,
  );
}

function dessinerNiveauCourant(ctx, canvas, niveau = 1) {
  ctx.font = "42px Arial";
  ctx.strokeStyle = "black";
  ctx.fillStyle = "yellow";
  ctx.lineWidth = 2;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.strokeText(
    `Niveau: ${String(niveau)}`,
    canvas.width / 2 + 175,
    canvas.height - 100,
  );
  ctx.fillText(
    `Niveau: ${String(niveau)}`,
    canvas.width / 2 + 175,
    canvas.height - 100,
  );
}

function dessinerVie(ctx, canvas, vie = 5) {
  ctx.font = "42px Arial";
  ctx.strokeStyle = "black";
  ctx.fillStyle = "yellow";
  ctx.lineWidth = 2;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.strokeText(
    `Vie: ${String(vie)}`,
    canvas.width / 2 + 325,
    canvas.height - 100,
  );
  ctx.fillText(
    `Vie: ${String(vie)}`,
    canvas.width / 2 + 325,
    canvas.height - 100,
  );
}

export {
  dessinerBordure,
  dessinerTitre,
  dessinerNoms,
  dessinerScore,
  dessinerTemps,
  dessinerNiveauCourant,
  dessinerVie,
};
