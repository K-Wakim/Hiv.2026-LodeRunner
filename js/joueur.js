// js/joueur.js

const TAILLE_CELLULE = 32;
const OFFSET_BORDURE = 32; // Pour la bordure (lineWidth 64 => 32px dedans)

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

export class Joueur {
  constructor(
    niveau,
    colDepart = 1,
    rowDepart = 1,
    srcImage = "assets/images/imgJoueur/BaseRunner.png",
  ) {
    this.niveau = niveau;

    // Position en pixels (zone jouable)
    this.x = colDepart * TAILLE_CELLULE;
    this.y = rowDepart * TAILLE_CELLULE;

    this.w = TAILLE_CELLULE;
    this.h = TAILLE_CELLULE;

    // Physique
    this.vy = 0;
    this.vitesse = 2; // ajuste si tu veux
    this.gravite = 0.8;

    // Image du joueur
    this.img = new Image();
    this.imgOK = false;
    this.img.onload = () => (this.imgOK = true);
    this.img.onerror = () => (this.imgOK = false);
    this.img.src = srcImage;
  }

  // ---- Centre / grille ----
  get col() {
    return Math.floor((this.x + this.w / 2) / TAILLE_CELLULE);
  }

  get row() {
    return Math.floor((this.y + this.h / 2) / TAILLE_CELLULE);
  }

  // tuile à partir d'un pixel (zone jouable, sans OFFSET)
  tuileAuPixel(px, py) {
    const c = Math.floor(px / TAILLE_CELLULE);
    const r = Math.floor(py / TAILLE_CELLULE);
    return cellule(this.niveau, c, r);
  }

  getCellCourante() {
    return cellule(this.niveau, this.col, this.row);
  }

  getCellDessous() {
    const col = this.col;
    const rowSous = Math.floor((this.y + this.h) / TAILLE_CELLULE);
    return cellule(this.niveau, col, rowSous);
  }

  // ---- États ----
  estSurCorde() {
    const cx = this.x + this.w / 2;
    const cy = this.y + this.h / 2;
    return estCorde(this.tuileAuPixel(cx, cy));
  }

  // vrai si centre OU pieds dans une échelle
  estDansEchelle() {
    const cx = this.x + this.w / 2;
    const cy = this.y + this.h / 2;
    const fy = this.y + this.h - 1; // pieds

    return (
      estEchelle(this.tuileAuPixel(cx, cy)) ||
      estEchelle(this.tuileAuPixel(cx, fy))
    );
  }

  estSurSolide() {
    return estSolide(this.getCellDessous()) || estEchelle(this.getCellDessous());
  }

  // ---- Snaps ----
  snapXSurColonne(col) {
    // sprite fait 32px => x = col*32 aligne parfaitement
    this.x = col * TAILLE_CELLULE;
  }

  snapYSurRangee(row) {
    this.y = row * TAILLE_CELLULE;
  }

  // ---- Mouvement horizontal ----
  deplacementHorizontal(direction) {
    const nX = this.x + direction * this.vitesse;

    // On teste la tuile au niveau du centre (un test simple)
    const nCol =
      direction === -1
        ? Math.floor((nX + this.w / 2 - 16) / TAILLE_CELLULE)
        : Math.floor((nX + this.w / 2 + 16) / TAILLE_CELLULE);
    const nRow = this.row;
    const tDest = cellule(this.niveau, nCol, nRow);

    if (!estSolide(tDest)) {
      this.x = nX;
    }
  }

  // ---- Monter / Descendre échelle ----
  monterEchelle() {
    const col = this.col;
    const row = this.row;

    const ici = cellule(this.niveau, col, row);
    const haut = cellule(this.niveau, col, row - 1);

    // Monter si on est dans une échelle OU si celle du haut est une échelle
    if (!(this.estDansEchelle() || estEchelle(haut))) return;

    // Alignement obligatoire sur la colonne de l'échelle
    this.snapXSurColonne(col);

    // Monter
    this.y -= this.vitesse;
    this.vy = 0;

    // Sortie propre en haut: si plus d'échelle autour du centre/pieds
    const cx = this.x + this.w / 2;
    const cy = this.y + this.h / 2;
    const fy = this.y + this.h - 1;
    const tCentre = this.tuileAuPixel(cx, cy);
    const tPieds = this.tuileAuPixel(cx, fy);

    if (!estEchelle(tCentre) && !estEchelle(tPieds)) {
      // Snap sur la rangée la plus proche (évite rester entre 2 cases)
      const r = Math.floor((this.y + this.h / 2) / TAILLE_CELLULE);
      this.snapYSurRangee(r);
    }
  }

  descendreEchelle() {
    const col = this.col;
    const row = this.row;

    const ici = cellule(this.niveau, col, row);
    const bas = cellule(this.niveau, col, row + 1);

    // Descendre si on est dans l'échelle OU si la case du bas est une échelle (embarquer)
    if (!(this.estDansEchelle() || estEchelle(ici) || estEchelle(bas))) return;

    // Alignement obligatoire sur la colonne de l'échelle
    this.snapXSurColonne(col);

    // Descendre
    this.y += this.vitesse;
    this.vy = 0;

    // Si on arrive sur un sol solide sous les pieds (fin d'échelle), on se pose dessus
    const rowPieds = Math.floor((this.y + this.h) / TAILLE_CELLULE);
    const tSous = cellule(this.niveau, col, rowPieds);

    if (estSolide(tSous)) {
      this.y = rowPieds * TAILLE_CELLULE - this.h;
    }
  }

  // ---- Gravité / tomber ----
  appliquerGravite() {
    // Sur corde: pas de gravité
    if (this.estSurCorde()) {
      this.vy = 0;
      return;
    }

    // Dans une échelle: pas de gravité
    if (this.estDansEchelle()) {
      this.vy = 0;
      return;
    }

    // Si pas supporté => chute
    if (!this.estSurSolide()) {
      this.vy += this.gravite;
      this.y += this.vy;

      // collision avec sol
      const col = this.col;
      const rowSous = Math.floor((this.y + this.h) / TAILLE_CELLULE);
      const tSous = cellule(this.niveau, col, rowSous);

      if (estSolide(tSous)) {
        this.y = rowSous * TAILLE_CELLULE - this.h;
        this.vy = 0;
      }
    } else {
      this.vy = 0;
    }
  }

  // ---- Dessin ----
  dessiner(ctx) {
    const dessineX = this.x + OFFSET_BORDURE;
    const dessineY = this.y;

    if (this.imgOK && this.img.complete && this.img.naturalWidth > 0) {
      ctx.drawImage(this.img, dessineX, dessineY, this.w, this.h);
    } else {
      // fallback si l'image n'est pas prête
      ctx.fillStyle = "deepskyblue";
      ctx.fillRect(dessineX, dessineY, this.w, this.h);
      ctx.strokeStyle = "black";
      ctx.strokeRect(dessineX, dessineY, this.w, this.h);
    }
  }
}
