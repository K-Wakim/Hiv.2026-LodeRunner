// js/gardes.js

const TAILLE_CELLULE = 32;
const OFFSET_BORDURE = 32;
const CORDE_OFFSET = 4;

// Cellules
const SOLIDE = new Set(["B", "Be"]);
const ECHELLE = "E";
const CORDE = "C";

const RAYON_CHASSE = 4; // Distance (en cellules) à partir de laquelle le garde chasse
const VITESSE_GARDE = 1; // Pixels par frame
const DELAI_DECISION = 15; // Frames entre chaque décision de roaming
const TOLERANCE_VERTICALE = 1; // Écart de rangées minimum avant de chercher une échelle

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
function estVide(t) {
  return !estSolide(t) && !estEchelle(t) && t !== CORDE;
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
    this._grimpeEchelle = false;

    // IA
    this.dirH = 0; // -1 gauche, 0 rien, 1 droite
    this.dirV = 0; // -1 haut, 0 rien, 1 bas
    this.tuileBut = null; // { col, row } — tuile cible de l'algorithme de déplacement
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

  tuileAuPixel(px, py) {
    const c = Math.floor(px / TAILLE_CELLULE);
    const r = Math.floor(py / TAILLE_CELLULE);
    return cellule(this.niveau, c, r);
  }

  // ---- États ----
  estSurCorde() {
    const cx = this.x + this.w / 2;
    const cy = this.y + this.h / 2;
    return estCorde(this.tuileAuPixel(cx, cy));
  }

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
    const rowSous = Math.floor((this.y + this.h) / TAILLE_CELLULE);
    const colG = Math.floor((this.x + 1) / TAILLE_CELLULE);
    const colD = Math.floor((this.x + this.w - 2) / TAILLE_CELLULE);
    for (let c = colG; c <= colD; c++) {
      const t = cellule(this.niveau, c, rowSous);
      if (estSolide(t) || estEchelle(t)) return true;
    }
    return false;
  }

  // Comme estSurSolide, mais ignore les échelles — utilisé par la gravité
  // pour éviter que le garde se bloque en haut d'une cellule E.
  _estSurVraiSolide() {
    const rowSous = Math.floor((this.y + this.h) / TAILLE_CELLULE);
    const colG = Math.floor((this.x + 1) / TAILLE_CELLULE);
    const colD = Math.floor((this.x + this.w - 2) / TAILLE_CELLULE);
    for (let c = colG; c <= colD; c++) {
      if (estSolide(cellule(this.niveau, c, rowSous))) return true;
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

  lacherCorde() {
    if (this.enChute) return;

    if (this.estSurCorde() && !this.estDansEchelle()) {
      this.lacheCorde = true;
      this.y += 2;
      this.vy = 0;
    }
  }

  // chatgpt a cook sur ce code comment
  // A+ explication
  // ---- Mise à jour (IA + physique) ----

  /**
   * Point d'entrée appelé chaque frame depuis main.js.
   * Adapté de deplacerGarde() + graviteGardes() du projet de référence.
   */
  mettreAJour(joueur) {
    this._grimpeEchelle = false;
    this._deplacer(joueur);
    this._appliquerGravite();
  }

  /**
   * Gravité du garde.
   * - Sur corde  → snap vertical, vy = 0.
   * - Sur échelle → vy = 0 (la méthode _deplacer gère le mouvement).
   * - Sinon       → accélération vers le bas, correction de pénétration.
   */
  _appliquerGravite() {
    // --- CORDE ---
    // Sur corde: pas de gravité tant qu'on n'a pas lâché
    if (this.estSurCorde() && !this.lacheCorde) {
      this.vy = 0;
      this.enChute = false;
      this.alignerSurCorde(); // même alignement que le joueur
      return;
    }

    // Dès qu'on n'est plus sur la corde, on reset le flag
    if (!this.estSurCorde()) {
      this.lacheCorde = false;
    }

    // --- ECHELLE ---
    // IMPORTANT:
    // On coupe la gravité seulement si le garde "grimpe" réellement cette frame.
    // Sinon, il peut rester accroché à l'échelle quand il traverse horizontalement.
    if (this.estDansEchelle() && this._grimpeEchelle) {
      this.vy = 0;
      this.enChute = false;
      return;
    }

    // --- SUPPORT (solide OU échelle sous les pieds) ---
    // On garde les échelles comme support pour éviter qu'un garde tombe
    // juste parce qu'il marche au-dessus d'une échelle.
    if (this.estSurSolide()) {
      const rowSous = Math.floor((this.y + this.h) / TAILLE_CELLULE);
      this.y = rowSous * TAILLE_CELLULE - this.h; // snap sur le dessus
      this.vy = 0;
      this.enChute = false;
      return;
    }

    // --- CHUTE ---
    this.enChute = true;

    this.vy += this.gravite;
    if (this.vy > 8) this.vy = 8; // vitesse terminale
    this.y += this.vy;

    // Collision / correction si on retouche un support pendant la chute
    if (this.estSurSolide()) {
      const rowSous = Math.floor((this.y + this.h) / TAILLE_CELLULE);
      this.y = rowSous * TAILLE_CELLULE - this.h;
      this.vy = 0;
      this.enChute = false;
    }
  }

  alignerSurCorde() {
    const row = this.row;
    const yCorde = row * TAILLE_CELLULE + CORDE_OFFSET;
    const AJUSTEMENT_SPRITE = 8;

    this.y = yCorde - AJUSTEMENT_SPRITE;
  }

  // ---- Monter / Descendre échelle ----
  monterEchelle() {
    if (this.enChute) return;

    const col = this.col;
    const row = this.row;

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
      this.forceIdle = true;
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

      const r = Math.floor((this.y + this.h / 2) / TAILLE_CELLULE);
      this.snapYSurRangee(r);

      this.forceIdle = true;
    }
  }

  /**
   * IA de déplacement du garde vers le joueur.
   * Adapté de deplacerGarde() du projet de référence.
   *
   * Logique :
   *  1. Si le joueur est sur une rangée différente (> TOLERANCE_VERTICALE),
   *     chercher la colonne d'échelle la plus proche permettant la navigation
   *     verticale dans la bonne direction.
   *  2. Se déplacer horizontalement vers cette colonne d'échelle (tuileBut),
   *     puis grimper / descendre une fois aligné.
   *  3. Si on est à la même rangée que le joueur (ou sur corde), se déplacer
   *     directement vers lui en horizontal.
   *  4. Collisions horizontales contre les cellules solides.
   */
  _deplacer(joueur) {
    // Pas de déplacement volontaire pendant la chute
    if (this.enChute) return;

    const col = this.col;
    const row = this.row;

    // Centres en pixels (similaire à positionX/Y du projet de référence)
    const gardeCX = this.x + this.w / 2;
    const gardeCY = this.y + this.h / 2;
    const joueurCX = joueur.x + joueur.w / 2;
    const joueurCY = joueur.y + joueur.h / 2;

    // Directions préférées vers le joueur
    const dirX = joueurCX >= gardeCX ? 1 : -1;
    const dirY = joueurCY >= gardeCY ? 1 : -1;
    const diffRow = joueur.row - row; // positif = joueur plus bas

    // --- Recherche d'une tuile cible (échelle) pour la navigation verticale ---
    // Reproduit la boucle tabTuile du projet de référence, en parcourant
    // directement la grille niveau[][] à la place.
    if (Math.abs(diffRow) >= TOLERANCE_VERTICALE) {
      let minDist = Number.MAX_SAFE_INTEGER;
      let meilleurCol = null;
      const nCols = this.niveau[0].length;

      for (let c = 0; c < nCols; c++) {
        let possible = false;
        const typeCel = cellule(this.niveau, c, row);

        if (dirY === 1) {
          // Descendre : cellule vide ou échelle sur la rangée courante,
          // avec une échelle ou du vide juste en dessous.
          const typeBas = cellule(this.niveau, c, row + 1);
          possible =
            (estVide(typeCel) || estEchelle(typeCel)) &&
            (estEchelle(typeBas) || estVide(typeBas));
        } else {
          // Monter : être sur une échelle dont la case au-dessus est libre/échelle.
          const typeHaut = cellule(this.niveau, c, row - 1);
          possible =
            estEchelle(typeCel) && (estEchelle(typeHaut) || estVide(typeHaut));
        }

        if (possible) {
          const dist = Math.abs(c - col);
          if (dist < minDist) {
            minDist = dist;
            meilleurCol = c;
          }
        }
      }

      this.tuileBut = meilleurCol !== null ? { col: meilleurCol, row } : null;
    } else {
      this.tuileBut = null;
    }

    // --- Décision de mouvement ---
    let moveH = 0;
    let moveV = 0;

    const surCorde = this.estSurCorde();
    const dansEchelle = this.estDansEchelle();

    if (surCorde) {
      // Sur une corde : se déplacer uniquement en horizontal
      moveH = dirX;
    } else if (this.tuileBut) {
      // Il faut atteindre une échelle : d'abord s'aligner horizontalement
      const butCX = this.tuileBut.col * TAILLE_CELLULE + TAILLE_CELLULE / 2;
      const dxBut = butCX - gardeCX;

      if (Math.abs(dxBut) > this.vitesse * 2) {
        // Pas encore aligné → avancer vers la colonne cible
        moveH = dxBut >= 0 ? 1 : -1;
      } else if (dansEchelle) {
        // Aligné et sur l'échelle → snap X et grimper/descendre
        this.x = this.tuileBut.col * TAILLE_CELLULE;
        moveV = dirY;
      } else if (dirY === 1 && estEchelle(cellule(this.niveau, col, row + 1))) {
        // Aligné, pas encore sur l'échelle, mais une échelle est juste en dessous
        // → entrer dans l'échelle pour descendre
        this.x = this.tuileBut.col * TAILLE_CELLULE;
        moveV = 1;
      } else {
        // Aligné mais l'échelle est derrière (montée terminée) ou inexistante
        // → reprendre le déplacement horizontal
        this.tuileBut = null;
        moveH = dirX;
      }
    } else {
      // Même rangée (ou aucune échelle trouvée)
      if (dansEchelle && Math.abs(diffRow) > 0) {
        // Encore sur une échelle avec du chemin vertical restant
        moveV = dirY;
      } else {
        // Se déplacer directement vers le joueur en horizontal
        moveH = dirX;
      }
    }

    // --- Mouvement horizontal avec détection de collision ---
    if (moveH !== 0) {
      const nextX = this.x + moveH * this.vitesse;

      // Vérifier la colonne qui serait pénétrée (bord avant du garde)
      const checkCol =
        moveH === 1
          ? Math.floor((nextX + this.w - 1) / TAILLE_CELLULE)
          : Math.floor(nextX / TAILLE_CELLULE);

      // Tester à hauteur de la tête ET des pieds pour éviter les angles
      const rowPieds = Math.floor((this.y + this.h - 2) / TAILLE_CELLULE);
      const bloque =
        estSolide(cellule(this.niveau, checkCol, row)) ||
        estSolide(cellule(this.niveau, checkCol, rowPieds));

      if (!bloque) this.x = nextX;

      if (dansEchelle && !this._grimpeEchelle) {
        const r = Math.floor((this.y + this.h / 2) / TAILLE_CELLULE);
        this.snapYSurRangee(r);
      }

      this.dirH = moveH;
    }

    // --- Mouvement vertical (échelles uniquement) ---
    // Un garde peut bouger verticalement s'il est déjà dans une échelle,
    // OU s'il veut descendre et qu'une échelle se trouve immédiatement sous lui
    // (entrée intentionnelle dans l'échelle depuis le dessus).
    const peutBougerVertical =
      dansEchelle ||
      (moveV === 1 && estEchelle(cellule(this.niveau, col, row + 1)));

    if (moveV !== 0 && peutBougerVertical) {
      this._grimpeEchelle = true;
      const nextY = this.y + moveV * this.vitesse;

      if (moveV === -1) {
        // Monter : vérifier que la case du haut n'est pas solide
        this.monterEchelle();
      } else {
        // Descendre : vérifier que les pieds n'entrent pas dans un solide
        this.descendreEchelle();
      }

      this.dirV = moveV;
    } else {
      this.dirV = 0;
    }

    if (surCorde && joueur.row > this.row) {
      this.lacherCorde();
    }
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
