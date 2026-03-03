// js/gardes.js

const TAILLE_CELLULE = 32;
const OFFSET_BORDURE = 32; // Pour la bordure (lineWidth 64 => 32px dedans)
const CORDE_OFFSET = 4;

// Cellules
const SOLIDE = new Set(["B", "Be"]); // Brique, Béton
const ECHELLE = "E";
const CORDE = "C";

function cellule(niveau, col, row) {
  if (row < 0 || row >= niveau.length) return "Be"; // Mur
  if (col < 0 || col >= niveau[0].length) return "Be";
  return niveau[row][col];
}

function estSolide(t) {
  return SOLIDE.has(t);
}
function estEchelle(t) {
  return t === ECHELLE;
}
function estCorde(t) {
  return t === CORDE;
}

function celluleAleatoire(niv, occupees = new Set()) {
  const candidates = [];

  for (let row = 1; row <= 12; row++) {
    for (let col = 0; col < niv[row].length; col++) {
      const keys = `${row},${col}`;
      if (
        niv[row][col] === "_" &&
        niv[row + 1][col] === "B" &&
        !occupees.has(keys)
      ) {
        candidates.push({ row, col });
      }
    }
  }

  if (candidates.length === 0) return null;

  return candidates[Math.floor(Math.random() * candidates.length)];
}

export class Gardes {
  constructor(niveau, srcImage, sons, occupees = new Set()) {
    const cell = celluleAleatoire(niveau, occupees);

    this.niveau = niveau;
    this.col = cell?.col;
    this.row = cell?.row;
    this.x = this.col * TAILLE_CELLULE;
    this.y = this.row * TAILLE_CELLULE;
    this.vx = 0;
    this.vy = 0;
    this.img = new Image();
    this.img.src = srcImage;
    this.imgOK = false;
    this.img.onload = () => {
      this.imgOK = true;
    };
    this.sons = sons;
  }

  dessiner(ctx) {
    const dessineX = this.x + OFFSET_BORDURE;
    const dessineY = this.y + OFFSET_BORDURE;

    if (this.imgOK && this.img.complete && this.img.naturalWidth > 0) {
      ctx.drawImage(
        this.img,
        dessineX,
        dessineY,
        TAILLE_CELLULE,
        TAILLE_CELLULE,
      );
    } else {
      // fallback si l'image n'est pas prête
      ctx.fillStyle = "deepskyblue";
      ctx.fillRect(dessineX, dessineY, TAILLE_CELLULE, TAILLE_CELLULE);
      ctx.strokeStyle = "black";
      ctx.strokeRect(dessineX, dessineY, TAILLE_CELLULE, TAILLE_CELLULE);
    }
  }
}
