/*jslint browser this */
/*global _, player */

(function (global) {
    "use strict";
    var computer = _.assign({}, player, {
        grid: [],
        tries: [],
        fleet: [],
        game: null,
        play: function () {
            // IA random attack
            var self = this;
            var randomX = Math.floor(Math.random() * 10);
            var randomY = Math.floor(Math.random() * 10);
            setTimeout(function () {
                self.game.fire(self, randomX, randomY);
            }, 1);
        },

        areShipsOk: function (callback) {
            var i = 0;
            var j;
            while (i < this.fleet.length) {
                // Exercice 5
                // permet de placer les éléments de la flotte de manière aléatoire
                var randomX = Math.floor(Math.random() * 10);
                var randomY = Math.floor(Math.random() * 10);
                var randomDirection = Math.floor(Math.random() * 2);
                switch (randomDirection) {
                    case 0:
                        this.fleet[this.activeShip].direction = "horizontal";
                        if (this.setActiveShipPosition(randomX, randomY)) {
                            i++;
                            this.activateNextShip();
                        }
                        break;

                    case 1:
                        this.fleet[this.activeShip].direction = "vertical";
                        if (this.setActiveShipPosition(randomX, randomY)) {
                            i++;
                            this.activateNextShip();
                        }
                        break;

                    default:
                        console.error("How did you get here?");
                        break;
                }
            }
            console.info("Positions des bateaux ennemis :");
            console.table(this.grid);

            setTimeout(function () {
                callback();
            }, 500);
        },
    });

    global.computer = computer;
})(this);