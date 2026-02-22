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

function dessinerLingot(ctx, x, y, objLingot) {
  x += 32;
  ctx.drawImage(objLingot, x, y, 32, 32);
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
  ctx.textBaseLine = "middle";
  ctx.font = "bold 72px Arial";
  ctx.lineWidth = 10;
  ctx.strokeStyle = "white";
  ctx.strokeText(texte, 0, 0);
  ctx.fillStyle = "yellow";
  ctx.fillText(texte, 0, 0);

  ctx.restore();

  /*
  ctx.save()
  ctx.textAlign = "center";
  ctx.textBaseLine = "top";
  ctx.font = "bold 22px Arial";
  ctx.fillStyle = "white";
  ctx.fillText("Appuie sur R pour recommencer", centerX, centerY + 60);
  ctx.restore();
  */
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

  dessinerGameOver,
  dessinerVictoire,
};
