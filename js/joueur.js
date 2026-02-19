// js/joueur.js

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
    this.vitesse = 2;
    this.gravite = 0.8;
    this.lacheCorde = false;
    this.enChute = false;
    this.colEchelleSortie = null; // test

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
    // rangée sous les pieds
    const rowSous = Math.floor((this.y + this.h) / TAILLE_CELLULE);

    // Colonnes que le joueur chevauche (pieds)
    const colG = Math.floor((this.x + 1) / TAILLE_CELLULE);
    const colD = Math.floor((this.x + this.w - 2) / TAILLE_CELLULE);

    // Si au moins une des cellules sous les pieds est support -> supporté
    for (let c = colG; c <= colD; c++) {
      const t = cellule(this.niveau, c, rowSous);
      if (estSolide(t) || estEchelle(t)) return true;
    }

    return false;
  }

  // ---- Snaps ----
  snapXSurColonne(col) {
    // sprite fait 32px => x = col*32 aligne parfaitement
    this.x = col * TAILLE_CELLULE;
  }

  snapYSurRangee(row) {
    this.y = row * TAILLE_CELLULE;
  }

  peutControler() {
    return !this.enChute;
  }

  // retourne vrai si le rectangle du joueur chevauche la colonne "col"
  chevaucheColonne(col) {
    const joueurG = this.x;
    const joueurD = this.x + this.w;

    const colG = col * TAILLE_CELLULE;
    const colD = colG + TAILLE_CELLULE;

    // chevauchement strict
    return joueurD > colG && joueurG < colD;
  }

  // y (centre) -> tuile à la colonne d'échelle qu'on quitte
  tuileEchelleAColonne(col) {
    const cx = this.x + this.w / 2;
    const cy = this.y + this.h / 2;
    const row = Math.floor(cy / TAILLE_CELLULE);
    return cellule(this.niveau, col, row);
  }

  alignerSurCorde() {
    const row = this.row;
    const yCorde = row * TAILLE_CELLULE + CORDE_OFFSET;
    const AJUSTEMENT_SPRITE = 12;

    this.y = yCorde - AJUSTEMENT_SPRITE;
  }

  // ---- Mouvement horizontal ----
  deplacementHorizontal(direction) {
    if (this.enChute) return;

    // Avant le move : est-ce qu'on est dans une échelle ?
    const etaitDansEchelle = this.estDansEchelle();
    const colEchelleAvant = this.col; // colonne actuelle (si on est sur l'échelle)

    // Tentative de déplacement
    const nX = this.x + direction * this.vitesse;

    // Collision simple : on regarde la case où va se trouver "l'avant" du joueur
    const avantX = nX + this.w / 2 + direction * (this.w / 2); // bord avant (gauche/droite)
    const nCol = Math.floor(avantX / TAILLE_CELLULE);
    const nRow = this.row;
    const tDest = cellule(this.niveau, nCol, nRow);

    // On bouge si ce n'est pas un bloc solide
    if (!estSolide(tDest)) {
      this.x = nX;
    }

    // Après le move : est-ce qu'on est dans une échelle ?
    const estMaintenantDansEchelle = this.estDansEchelle();

    // Gestion "je quitte une échelle horizontalement"
    if (etaitDansEchelle && !estMaintenantDansEchelle) {
      // on mémorise la colonne de l'échelle qu'on vient de quitter
      this.colEchelleSortie = colEchelleAvant;
    }

    // Si on est (re)dans une échelle, on annule la sortie
    if (estMaintenantDansEchelle) {
      this.colEchelleSortie = null;
    }
  }

  // ---- Monter / Descendre échelle ----
  monterEchelle() {
    if (this.enChute) return;

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
    if (this.enChute) return;

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

  lacherCorde() {
    if (this.enChute) return;

    if (this.estSurCorde() && !this.estDansEchelle()) {
      this.lacheCorde = true;

      this.y += 2;
      this.vy = 0;
    }
  }

  // ---- Gravité / tomber ----
  appliquerGravite() {
    // --- CORDE ---
    // Sur corde: pas de gravité, sauf si on a "lâché"
    if (this.estSurCorde() && !this.lacheCorde) {
      this.vy = 0;
      this.enChute = false;

      this.alignerSurCorde();
      
      return;
    }

    // Dès qu'on n'est plus sur la corde, on reset le flag
    if (!this.estSurCorde()) {
      this.lacheCorde = false;
    }

    // --- ECHELLE ---
    // Dans une échelle: pas de gravité
    if (this.estDansEchelle()) {
      this.vy = 0;
      this.enChute = false;
      this.colEchelleSortie = null; // on annule toute sortie en cours
      return;
    }

    // --- SORTIE HORIZONTALE D'ECHELLE (tomber seulement quand complètement dehors) ---
    // Si on est en train de quitter une échelle, on bloque la chute tant qu'on chevauche encore la colonne
    if (this.colEchelleSortie !== null) {
      const t = this.tuileEchelleAColonne(this.colEchelleSortie);

      // Tant qu'il y a une échelle à cette colonne ET que le joueur la chevauche encore => pas de chute
      if (estEchelle(t) && this.chevaucheColonne(this.colEchelleSortie)) {
        this.vy = 0;
        this.enChute = false;
        return;
      }

      // Complètement sorti -> on laisse la gravité reprendre
      this.colEchelleSortie = null;
    }

    // --- SUPPORT (solide OU échelle sous les pieds) ---
    if (this.estSurSolide()) {
      const rowSous = Math.floor((this.y + this.h) / TAILLE_CELLULE);
      this.y = rowSous * TAILLE_CELLULE - this.h; // snap
      this.vy = 0;
      this.enChute = false;
      return;
    }

    // --- CHUTE ---
    this.enChute = true;
    this.vy += this.gravite;
    this.y += this.vy;

    // Collision avec support pendant la chute (solide OU échelle)
    const col = this.col;
    const rowSous = Math.floor((this.y + this.h) / TAILLE_CELLULE);
    const tSous = cellule(this.niveau, col, rowSous);

    if (estSolide(tSous) || estEchelle(tSous)) {
      this.y = rowSous * TAILLE_CELLULE - this.h;
      this.vy = 0;
      this.enChute = false;
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
