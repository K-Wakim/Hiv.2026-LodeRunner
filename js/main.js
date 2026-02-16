import { niv1 } from "./niveau.js";
import {
  dessinerBeton,
  dessinerBordure,
  dessinerBrique,
  dessinerEchelle,
  dessinerCorde,
  dessinerLingot,
} from "./dessiner.js";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const objLingot = new Image();
objLingot.src = "assets/lingotV2.png";
objLingot.onload = () => {
  dessinerBordure(canvas, ctx);

  niv1.forEach((ligne, y) => {
    ligne.forEach((caseType, x) => {
      if (caseType === "Be") {
        dessinerBeton(ctx, x * 32, y * 32);
      }

      if (caseType === "B") {
        dessinerBrique(ctx, x * 32, y * 32);
      }

      if (caseType === "E") {
        dessinerEchelle(ctx, x * 32, y * 32);
      }

      if (caseType === "C") {
        dessinerCorde(ctx, x * 32, y * 32);
      }

      if (caseType === "L") {
        if (objLingot.complete) dessinerLingot(ctx, x * 32, y * 32, objLingot);
      }
    });
  });
};
