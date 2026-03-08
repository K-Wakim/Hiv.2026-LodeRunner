/*
 * LIBRAIRIE DE FONCTIONS DE DESSIIN DU NIVEAU
 */

function dessinerBeton(ctx, x, y) {
  ctx.fillStyle = "#B0B0B0";
  ctx.fillRect(x + 32, y, 32, 32);
  ctx.strokeStyle = "#888888";
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 32, y, 32, 32);
}

function dessinerBrique(ctx, x, y) {
  const taillePatterne = 32;
  const hauteurBrique = 16;
  const ligneWidth = 3;

  x += 32; // Adjust x to account for the border

  // First row - full brick
  ctx.fillStyle = "#FF0000"; // Brick color
  ctx.fillRect(x, y, taillePatterne, hauteurBrique - ligneWidth);

  // Second row - two half bricks with offset
  ctx.fillRect(
    x,
    y + hauteurBrique,
    taillePatterne / 2 - ligneWidth,
    hauteurBrique - ligneWidth,
  );
  ctx.fillRect(
    x + taillePatterne / 2,
    y + hauteurBrique,
    taillePatterne / 2 - ligneWidth,
    hauteurBrique - ligneWidth,
  );

  // Draw mortar lines in gray
  ctx.fillStyle = "#808080"; // Mortar color

  // Horizontal mortar lines
  ctx.fillRect(x, y + hauteurBrique - ligneWidth, taillePatterne, ligneWidth); // Middle
  ctx.fillRect(x, y + taillePatterne - ligneWidth, taillePatterne, ligneWidth); // Bottom

  // Vertical mortar lines
  ctx.fillRect(x, y, ligneWidth, taillePatterne); // Left
  ctx.fillRect(x + taillePatterne - ligneWidth, y, ligneWidth, taillePatterne); // Right
  ctx.fillRect(
    x + taillePatterne / 2 - ligneWidth,
    y + hauteurBrique,
    ligneWidth,
    hauteurBrique,
  ); // Middle of second row
}

function dessinerEchelle(ctx, x, y) {
  x += 32; // Adjust x to account for the border
  ctx.save();
  ctx.translate(x, y);

  ctx.strokeStyle = "yellow";
  ctx.lineWidth = 5; // width des barres verticals
  ctx.beginPath();

  // barre vertical gauche
  ctx.moveTo(0, 0);
  ctx.lineTo(0, 32);
  // varre vertical droite
  ctx.moveTo(32, 0);
  ctx.lineTo(32, 32);

  ctx.stroke();

  ctx.beginPath();
  for (let i = 4; i < 32; i += 8) {
    ctx.moveTo(2, i);
    ctx.lineTo(30, i);
    ctx.strokeStyle = "#C04000";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  ctx.restore();
}

function dessinerCorde(ctx, x, y) {
  x += 32;
  ctx.beginPath();
  ctx.strokeStyle = "#C04000"; // brun pale
  ctx.lineWidth = 3;
  ctx.moveTo(x, y + 4);
  ctx.lineTo(x + 32, y + 4);
  ctx.stroke();
}

function dessinerTrou(ctx, x, y) {
  x += 32;

  // base du trou
  ctx.fillStyle = "#050505";
  ctx.fillRect(x, y, 32, 32);

  // dégradé principal beaucoup plus visible
  const degrade = ctx.createLinearGradient(x, y, x, y + 32);
  degrade.addColorStop(0, "rgba(170, 170, 170, 0.55)");
  degrade.addColorStop(0.18, "rgba(110, 110, 110, 0.35)");
  degrade.addColorStop(0.45, "rgba(45, 45, 45, 0.18)");
  degrade.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = degrade;
  ctx.fillRect(x, y, 32, 32);

  // petit reflet en haut
  ctx.fillStyle = "rgba(230, 230, 230, 0.22)";
  ctx.fillRect(x, y, 32, 2);

  // côtés plus sombres
  ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
  ctx.fillRect(x, y, 3, 32);
  ctx.fillRect(x + 29, y, 3, 32);

  // fond du trou plus noir
  const fond = ctx.createLinearGradient(x, y + 16, x, y + 32);
  fond.addColorStop(0, "rgba(0, 0, 0, 0)");
  fond.addColorStop(1, "rgba(0, 0, 0, 0.45)");
  ctx.fillStyle = fond;
  ctx.fillRect(x, y + 16, 32, 16);

  // légère teinte bleu-gris au centre pour casser le noir pur
  ctx.fillStyle = "rgba(70, 90, 110, 0.10)";
  ctx.fillRect(x + 4, y + 4, 24, 24);
}

function dessinerLingot(ctx, x, y, objLingot) {
  x += 32;
  ctx.drawImage(objLingot, x, y, 32, 32);
}

function dessinerLaserBrique(ctx, joueurX, joueurY, col, row, gauche) {
  const origineX = joueurX + 32 + (gauche ? 8 : 24);
  const origineY = joueurY + 18;

  // coins du haut de la brique
  const coinGaucheX = col * 32 + 32;
  const coinDroitX = col * 32 + 32 + 32;
  const coinHautY = row * 32 + 32;

  ctx.save();

  ctx.beginPath();
  ctx.moveTo(origineX, origineY);
  ctx.lineTo(coinGaucheX, coinHautY);
  ctx.lineTo(coinDroitX, coinHautY);
  ctx.closePath();

  const degrade = ctx.createLinearGradient(
    origineX,
    origineY,
    (coinGaucheX + coinDroitX) / 2,
    coinHautY
  );
  degrade.addColorStop(0, "rgba(255,255,255,0.85)");
  degrade.addColorStop(0.35, "rgba(210,210,210,0.45)");
  degrade.addColorStop(1, "rgba(120,120,120,0.08)");

  ctx.fillStyle = degrade;
  ctx.fill();

  ctx.restore();
}

function dessinerAnimationBrique(ctx, x, y, progress, reverse = false) {
  x += 32;

  const p = reverse ? 1 - progress : progress;

  // fond de brique partiellement visible
  ctx.save();
  ctx.globalAlpha = 1 - p * 0.9;

  const taillePatterne = 32;
  const hauteurBrique = 16;
  const ligneWidth = 3;

  ctx.fillStyle = "#FF0000";
  ctx.fillRect(x, y, taillePatterne, hauteurBrique - ligneWidth);
  ctx.fillRect(
    x,
    y + hauteurBrique,
    taillePatterne / 2 - ligneWidth,
    hauteurBrique - ligneWidth,
  );
  ctx.fillRect(
    x + taillePatterne / 2,
    y + hauteurBrique,
    taillePatterne / 2 - ligneWidth,
    hauteurBrique - ligneWidth,
  );

  ctx.fillStyle = "#808080";
  ctx.fillRect(x, y + hauteurBrique - ligneWidth, taillePatterne, ligneWidth);
  ctx.fillRect(x, y + taillePatterne - ligneWidth, taillePatterne, ligneWidth);
  ctx.fillRect(x, y, ligneWidth, taillePatterne);
  ctx.fillRect(x + taillePatterne - ligneWidth, y, ligneWidth, taillePatterne);
  ctx.fillRect(
    x + taillePatterne / 2 - ligneWidth,
    y + hauteurBrique,
    ligneWidth,
    hauteurBrique,
  );

  ctx.restore();

  // petits fragments style "Minecraft"
  const fragments = [
    [2, 2],
    [10, 3],
    [18, 2],
    [25, 4],
    [5, 12],
    [14, 11],
    [22, 10],
    [27, 14],
    [3, 22],
    [11, 20],
    [19, 23],
    [26, 21],
  ];

  const visibles = Math.floor((1 - p) * fragments.length);

  ctx.save();
  for (let i = 0; i < visibles; i++) {
    const fx = fragments[i][0];
    const fy = fragments[i][1];

    ctx.fillStyle = i % 2 === 0 ? "#FF0000" : "#808080";
    ctx.fillRect(x + fx, y + fy, 4, 4);
  }
  ctx.restore();
}

// --- GAME SCREENS ---
function spinTitre(ctx, canvas, texte, temps) {
  // Fond semi-transparent
  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const angle = (temps / 1000) * 2.5;

  ctx.translate(centerX, centerY);
  ctx.rotate(angle);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "bold 72px Arial";
  ctx.lineWidth = 10;
  ctx.strokeStyle = "black";
  ctx.strokeText(texte, 0, 0);
  ctx.fillStyle = "yellow";
  ctx.fillText(texte, 0, 0);

  ctx.restore();

  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.font = "bold 22px Arial";
  ctx.fillStyle = "white";
  ctx.fillText("Appuie sur R pour recommencer", centerX, centerY + 60);
  ctx.restore();
}

function dessinerGameOver(ctx, canvas, temps) {
  spinTitre(ctx, canvas, "GAME OVER", temps);
}

function dessinerVictoire(ctx, canvas, temps) {
  spinTitre(ctx, canvas, "VICTOIRE !", temps);
}

export {
  dessinerBeton,
  dessinerBrique,
  dessinerEchelle,
  dessinerCorde,
  dessinerLingot,
  dessinerTrou,
  dessinerLaserBrique,
  dessinerAnimationBrique,
  dessinerGameOver,
  dessinerVictoire,
};
