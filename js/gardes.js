// js/gardes.js

const TAILLE_CELLULE = 32;
const OFFSET_BORDURE = 32;
const CORDE_OFFSET = 4;

// Cellules
const SOLIDE = new Set(["B", "Be"]);
const ECHELLE = "E";
const CORDE = "C";

const RAYON_CHASSE = 4; // Distance (en cellules) à partir de laquelle le garde chasse
const VITESSE_GARDE = 1.75; // Pixels par frame
const DELAI_DECISION = 15; // Frames entre chaque décision de roaming

function cellule(niveau, col, row) {
  if (row < 0 || row >= niveau.length) return "Be";
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
      const key = `${row},${col}`;
      if (
        niv[row][col] === "_" &&
        niv[row + 1]?.[col] === "B" &&
        !occupees.has(key)
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
    this._col = cell?.col ?? 1;
    this._row = cell?.row ?? 1;
    this.x = this._col * TAILLE_CELLULE;
    this.y = this._row * TAILLE_CELLULE;

    this.w = TAILLE_CELLULE;
    this.h = TAILLE_CELLULE;

    // Physique
    this.vy = 0;
    this.gravite = 0.3;
    this.vitesse = VITESSE_GARDE;
    this.enChute = false;
    this.lacheCorde = false;

    // IA
    this.dirH = 0; // -1 gauche, 0 rien, 1 droite
    this.dirV = 0; // -1 haut, 0 rien, 1 bas
    this.decisionTimer = 0; // frames avant prochaine décision de roaming

    this.img = new Image();
    this.img.src = srcImage;
    this.imgOK = false;
    this.img.onload = () => {
      this.imgOK = true;
    };

    this.sons = sons;
  }

  // ---- Centre / grille ----
  get col() {
    return Math.floor((this.x + this.w / 2) / TAILLE_CELLULE);
  }

  get row() {
    return Math.floor((this.y + this.h / 2) / TAILLE_CELLULE);
  }

  // ---- États ----
  estSurCorde() {
    return estCorde(cellule(this.niveau, this.col, this.row));
  }

  estDansEchelle() {
    const col = this.col;
    const rowCentre = Math.floor((this.y + this.h / 2) / TAILLE_CELLULE);
    const rowPieds = Math.floor((this.y + this.h - 1) / TAILLE_CELLULE);
    return (
      estEchelle(cellule(this.niveau, col, rowCentre)) ||
      estEchelle(cellule(this.niveau, col, rowPieds))
    );
  }

  estSurSolide() {
    const rowSous = Math.floor((this.y + this.h) / TAILLE_CELLULE);
    const colG = Math.floor((this.x + 1) / TAILLE_CELLULE);
    const colD = Math.floor((this.x + this.w - 2) / TAILLE_CELLULE);
    for (let c = colG; c <= colD; c++) {
      const t = cellule(this.niveau, c, rowSous);
      if (estSolide(t) || estEchelle(t)) return true;
    }
    return false;
  }

  // ---- Snaps ----
  snapXSurColonne(col) {
    this.x = col * TAILLE_CELLULE;
  }
  snapYSurRangee(row) {
    this.y = row * TAILLE_CELLULE;
  }

  // ---- Distance au joueur (Manhattan, en cellules) ----
  distanceAuJoueur(joueur) {
    return Math.abs(this.col - joueur.col) + Math.abs(this.row - joueur.row);
  }

  // ---- Décision IA ----
  decidierDirection(joueur) {
    const dist = this.distanceAuJoueur(joueur);

    if (dist <= RAYON_CHASSE) {
      // --- MODE CHASSE ---
      // Préférer l'axe avec le plus grand écart pour rejoindre le joueur
      const dc = joueur.col - this.col;
      const dr = joueur.row - this.row;

      if (Math.abs(dc) >= Math.abs(dr)) {
        this.dirH = dc !== 0 ? Math.sign(dc) : 0;
        this.dirV = 0;
      } else {
        this.dirH = 0;
        this.dirV = dr !== 0 ? Math.sign(dr) : 0;
      }
    } else {
      // --- MODE ROAMING ---
      this.decisionTimer--;
      if (this.decisionTimer > 0) return; // Conserver la direction actuelle
      this.decisionTimer = DELAI_DECISION + Math.floor(Math.random() * 20);

      const rand = Math.random();
      const peutMonter =
        this.estDansEchelle() ||
        estEchelle(cellule(this.niveau, this.col, this.row - 1));
      const peutDescendre = this.estDansEchelle();

      if (rand < 0.6) {
        // Déplacement horizontal (le plus fréquent)
        this.dirH = Math.random() < 0.5 ? -1 : 1;
        this.dirV = 0;
      } else if (rand < 0.8 && peutMonter) {
        // Monter une échelle si disponible
        this.dirH = 0;
        this.dirV = -1;
      } else if (rand < 0.95 && peutDescendre) {
        // Descendre une échelle si disponible
        this.dirH = 0;
        this.dirV = 1;
      } else {
        // Pause brève
        this.dirH = 0;
        this.dirV = 0;
      }
    }
  }

  // ---- Mouvement horizontal ----
  deplacementHorizontal() {
    if (this.enChute || this.dirH === 0) return;

    const nX = this.x + this.dirH * this.vitesse;
    const nCol =
      this.dirH === -1
        ? Math.floor((nX + this.w / 2 - 16) / TAILLE_CELLULE)
        : Math.floor((nX + this.w / 2 + 16) / TAILLE_CELLULE);
    const tDest = cellule(this.niveau, nCol, this.row);

    if (!estSolide(tDest)) {
      this.x = nX;
    } else {
      // Mur rencontré → inverser et re-décider immédiatement
      this.dirH *= -1;
      this.decisionTimer = 0;
    }
  }

  // ---- Monter l'échelle ----
  monterEchelle() {
    if (this.enChute || this.dirV !== -1) return;
    const haut = cellule(this.niveau, this.col, this.row - 1);
    if (!(this.estDansEchelle() || estEchelle(haut))) return;

    this.snapXSurColonne(this.col);
    this.y -= this.vitesse;
    this.vy = 0;
  }

  // ---- Descendre l'échelle ----
  descendreEchelle() {
    if (this.enChute || this.dirV !== 1) return;
    const bas = cellule(this.niveau, this.col, this.row + 1);
    if (!(this.estDansEchelle() || estEchelle(bas))) return;

    this.snapXSurColonne(this.col);
    this.y += this.vitesse;
    this.vy = 0;

    const rowPieds = Math.floor((this.y + this.h) / TAILLE_CELLULE);
    if (estSolide(cellule(this.niveau, this.col, rowPieds))) {
      this.y = rowPieds * TAILLE_CELLULE - this.h;
    }
  }

  // ---- Gravité / tomber ----
  appliquerGravite() {
    // Sur corde : pas de gravité
    if (this.estSurCorde() && !this.lacheCorde) {
      this.vy = 0;
      this.enChute = false;
      const yCorde = this.row * TAILLE_CELLULE + CORDE_OFFSET;
      this.y = yCorde - 8; // ajustement sprite comme le joueur
      return;
    }

    if (!this.estSurCorde()) this.lacheCorde = false;

    // Dans une échelle : pas de gravité
    if (this.estDansEchelle()) {
      this.vy = 0;
      this.enChute = false;
      return;
    }

    // Posé sur un sol solide
    if (this.estSurSolide()) {
      const rowSous = Math.floor((this.y + this.h) / TAILLE_CELLULE);
      this.y = rowSous * TAILLE_CELLULE - this.h;
      this.vy = 0;
      this.enChute = false;
      return;
    }

    // Chute libre
    this.enChute = true;
    this.vy += this.gravite;
    this.y += this.vy;

    // Collision avec le sol pendant la chute
    const rowSous = Math.floor((this.y + this.h) / TAILLE_CELLULE);
    const tSous = cellule(this.niveau, this.col, rowSous);
    if (estSolide(tSous) || estEchelle(tSous)) {
      this.y = rowSous * TAILLE_CELLULE - this.h;
      this.vy = 0;
      this.enChute = false;
    }
  }

  // ---- Mise à jour principale (à appeler chaque frame) ----
  mettreAJour(joueur) {
    this.decidierDirection(joueur);
    this.deplacementHorizontal();
    this.monterEchelle();
    this.descendreEchelle();
    this.appliquerGravite();
  }

  // ---- Dessin ----
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
      ctx.fillStyle = "deepskyblue";
      ctx.fillRect(dessineX, dessineY, TAILLE_CELLULE, TAILLE_CELLULE);
      ctx.strokeStyle = "black";
      ctx.strokeRect(dessineX, dessineY, TAILLE_CELLULE, TAILLE_CELLULE);
    }
  }
}
