// js/joueeur.js

const TAILLE_CELLULE = 32;
const OFFSET_BORDURE = 32; // Pour la bordure

// Cellule
const SOLIDE = new Set(["B", "Be"]);
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
    constructor(niveau, colDepart = 1, rowDepart = 1, srcImage = "assets/images/imgJoueur/BaseRunner.png") {
        this.niveau = niveau;

        // Position en pixels (zone jouable)
        this.x = colDepart * TAILLE_CELLULE;
        this.y = rowDepart * TAILLE_CELLULE;

        this.w = TAILLE_CELLULE;
        this.h = TAILLE_CELLULE;

        // Physique
        this.vy = 0; // Vitesse verticale
        this.vx = 0; // Vitesse horizontale
        this.vitesse = 4 // Vitesse de déplacement
        this.gravite = 0.8;


        // Image du joueur
        this.img = new Image();
        this.imgOK = false;
        this.img.onload = () => (this.imgOK = true);
        this.img.src = srcImage;
    }

    get col() {
        return Math.floor((this.x + this.w / 2) / TAILLE_CELLULE);
    }

    get row() {
        return Math.floor((this.y + this.h / 2) / TAILLE_CELLULE);
    }

    getCellCourante() {
        return cellule(this.niveau, this.col, this.row);
    }

    getCellDessous() {
        const col = this.col;
        const rowSous = Math.floor((this.y + this.h) / TAILLE_CELLULE);
        return cellule(this.niveau, col, rowSous);
    }

    getCellDessus() {
        const col = this.col;
        const rowHaut = Math.floor(this.y / TAILLE_CELLULE);
        return cellule(this.niveau, col, rowHaut);
    }

    getCellGauche() {
        const colGauche = Math.floor(this.x / TAILLE_CELLULE);
        const row = this.row;
        return cellule(this.niveau, colGauche, row);
    }

    getCellDroite() {
        const colDroite = Math.floor((this.x + this.w) / TAILLE_CELLULE);
        const row = this.row;
        return cellule(this.niveau, colDroite, row);
    }

    estSurEchelle() {
        return estEchelle(this.getCellCourante());    
    }

    estSurCorde() {
        return estCorde(this.getCellCourante());
    }

    estSurSolide() {
        return estSolide(this.getCellDessous());
    }

    // Mouvement du joueur
    deplacementHorizontal(direction) {
        // direction: -1 pour gauche, 1 pour droite
        const nX = this.x + direction * this.vitesse;

        // Collision
        const nCol = Math.floor((nX + this.w / 2) / TAILLE_CELLULE);
        const nRow = this.row;
        const nCell = cellule(this.niveau, nCol, nRow);

        if (!estSolide(nCell)) {
            this.x = nX;
        }

    }

    monterEchelle() { // On peut monter si sur une échelle ou si la cellule au dessus est un échelle
        const col = this.col;
        const row = this.row;
        const cellCourante = cellule(this.niveau, col, row);
        const cellDessus = cellule(this.niveau, col, row - 1);

        if (estEchelle(cellCourante) || estEchelle(cellDessus)) {
            this.y -= this.vitesse;
            this.vy = 0; // Annule la gravité¸
        }
    }

    descendreEchelle() {
        const col = this.col;
        const row = this.row;
        const cellCourante = cellule(this.niveau, col, row);
        const cellDessous = cellule(this.niveau, col, row + 1);

        if (estEchelle(cellCourante) || estEchelle(cellDessous)) {
            this.y += this.vitesse;
            this.vy = 0; // Annule la gravité
        }
    }

    // Gravité / tomber
    appliquerGravite() {
        if (this.estSurCorde()) {
            this.vy = 0; // Pas de gravite
            return;
        }

        if (this.estSurEchelle()) {
            this.vy = 0; // Pas de gravite
            return;
        }

        if (!this.estSurSolide()) { // Gravite (pas de sol)
            this.vy += this.gravite;
            this.y += this.vy;

            // Collision avec le sol (brique / béton)
            const col = this.col;
            const rowSous = Math.floor((this.y + this.h) / TAILLE_CELLULE);
            const cellSous = cellule(this.niveau, col, rowSous);

            if (estSolide(cellSous)) {
                this.y = rowSous * TAILLE_CELLULE - this.h;
                this.vy = 0; 
            }
        } else {
            this.vy = 0; // Sur le sol, pas de gravité
        }
    }

    dessiner(ctx) {
        const dessineX = this.x + OFFSET_BORDURE;
        const dessineY = this.y;
    
        if (this.img.complete) {
            ctx.drawImage(this.img, dessineX, dessineY, this.w, this.h);
        }
    }
}

    