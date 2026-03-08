import { niv1 } from "./niveau.js";
import {
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
} from "./dessiner.js";

import {
  dessinerBordure,
  dessinerNoms,
  dessinerScore,
  dessinerTemps,
  dessinerTitre,
  dessinerNiveauCourant,
  dessinerVie,
  animerHorloge,
} from "./hud.js";

import { Joueur } from "./joueur.js";
import { input, keys } from "./input.js";
import { Sons } from "./sons.js";
import { Gardes } from "./gardes.js";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
canvas.focus(); // Pour que le canvas detecte les événements clavier

let etatJeu = "play";
let tempsFin = 0;

let niveauActuel = 1;

// Images
const objLingot = new Image();
objLingot.src = "assets/images/lingot.png";

const sons = new Sons();

// Joueur
const joueur = new Joueur(
  niv1,
  14,
  14,
  "assets/images/imgJoueur/BaseRunner.png",
  sons,
);

// cellules qu'un garde est deja spawn dans
const cellOccupees = new Set();
const gardes = [];
const tousLesGardes = []; // celui-là inclue les gardes morts pour éviter les respawns multiples

spawnGardes();

let tempsEcoule = "00:00";
let tempsInitial = null;

// Input
input(canvas, joueur);

// Dessiner le niveau
function dessinerNiveau() {
  dessinerBordure(canvas, ctx);
  dessinerTitre(ctx, canvas);
  dessinerNoms(ctx, canvas);
  dessinerScore(ctx, canvas, joueur.score);
  dessinerTemps(ctx, canvas, tempsEcoule);
  dessinerNiveauCourant(ctx, canvas, String(niveauActuel));
  dessinerVie(ctx, canvas, joueur.vie);

  joueur.niveau.forEach((ligne, y) => {
    ligne.forEach((caseType, x) => {
      if (caseType === "Be") dessinerBeton(ctx, x * 32, y * 32 + 32);
      if (caseType === "B") dessinerBrique(ctx, x * 32, y * 32 + 32);
      if (caseType === "T") dessinerTrou(ctx, x * 32, y * 32 + 32);
      if (caseType === "C") dessinerCorde(ctx, x * 32, y * 32 + 32);
      if (caseType === "L" && objLingot.complete)
        dessinerLingot(ctx, x * 32, y * 32 + 32, objLingot);
    });
  });

  joueur.niveau.forEach((ligne, y) => {
    ligne.forEach((caseType, x) => {
      if (caseType === "E") dessinerEchelle(ctx, x * 32, y * 32 + 32);
    });
  });
}

function redessiner() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  dessinerNiveau();

  joueur.animBriques.forEach((anim) => {
    const progress = anim.timer / anim.duree;
    dessinerAnimationBrique(
      ctx,
      anim.col * 32,
      anim.row * 32 + 32,
      progress,
      anim.type === "respawn",
    );
  });

  if (joueur.animTir) {
    dessinerLaserBrique(
      ctx,
      joueur.x,
      joueur.y + 32,
      joueur.animTir.col,
      joueur.animTir.row,
      joueur.animTir.gauche,
    );
  }

  joueur.dessiner(ctx);

  gardes.forEach((garde) => garde.dessiner(ctx));
}

function update() {
  if (etatJeu !== "play") {
    const t = performance.now() - tempsFin;
    redessiner();
    if (etatJeu === "gameover") dessinerGameOver(ctx, canvas, t);
    if (etatJeu === "win") dessinerVictoire(ctx, canvas, t);
    return;
  }

  if (joueur.vie <= 0) {
    etatJeu = "gameover";
    tempsFin = performance.now();
    return;
  }

  // Conditions pour passer au prochain niveau
  if (
    joueur.nbrLingots === 6 &&
    joueur.col === 18 &&
    joueur.row === -1 &&
    niveauActuel < 10
  ) {
    niveauActuel++;
    const score = joueur.score;
    joueur.reset(14, 14, score);
    `
    `;
    tempsInitial = null; // Reset timer for next level
    tempsEcoule = "00:00";
    spawnGardes(); // Spawn new guards for the next level

    keys.jouer = false;
    return;
  }

  // Conditions de victoire
  if (
    joueur.nbrLingots === 6 &&
    joueur.col === 18 &&
    joueur.row === -1 &&
    niveauActuel === 10
  ) {
    etatJeu = "win";
    tempsFin = performance.now();
    dessinerVictoire(ctx, canvas, 0);
    return;
  }

  if (keys.jouer) {
    if (keys.left) joueur.deplacementHorizontal(-1, keys);
    if (keys.right) joueur.deplacementHorizontal(1, keys);
    if (keys.up) joueur.monterEchelle();
    if (keys.down) joueur.lacherCorde();
    if (keys.down) joueur.descendreEchelle();

    // Gravité/tomber
    joueur.appliquerGravite(gardes);

    joueur.ramasserLingot();

    gardes.forEach((garde) => {
      garde.mettreAJour(gardes);
      garde.death(gardes);
      garde.dessiner(ctx);
    });

    tousLesGardes.forEach((garde) => {
      garde.respawn(gardes);
    });

    // échelle pour passer au prochaine niveau
    if (joueur.nbrLingots === 6) {
      joueur.niveau[0][18] = "E";
      joueur.niveau[1][18] = "E";
      joueur.niveau[2][18] = "E";
      joueur.niveau[3][18] = "E";
    }

    if (tempsInitial === null) tempsInitial = Date.now();

    tempsEcoule = animerHorloge(ctx, canvas, tempsInitial);
  }

  const vieAvant = joueur.vie;
  joueur.death(spawnGardes, gardes);

  if (joueur.vie < vieAvant) {
    keys.jouer = false;
    tempsInitial = null;
    tempsEcoule = "00:00";
  }

  joueur.mettreAJourAnimation(keys);
  joueur.mettreAJourAnimBriques();

  redessiner();
}

function spawnGardes() {
  if (gardes.length > 0 || tousLesGardes.length > 0) {
    gardes.length = 0; // Remove existing guards
    tousLesGardes.length = 0; // Clear all guards including dead ones
    cellOccupees.clear(); // Clear occupied cells
  }
  for (let i = 0; i < 2 + niveauActuel; i++) {
    const g = new Gardes(
      joueur.niveau,
      "assets/images/imgGardes/BaseGarde.png",
      sons,
      joueur,
      cellOccupees,
    );
    gardes.push(g);
    tousLesGardes.push(g);
    cellOccupees.add(`${g.row},${g.col}`);
  }
}

objLingot.onload = () => redessiner();
redessiner();

setInterval(update, 16);
