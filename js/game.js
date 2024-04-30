/*jslint browser this */
/*global _, player, computer, utils */
var boom = new Audio("mp3/boom.mp3");
var plop = new Audio("mp3/plop.mp3");

(function () {
        "use strict";

        var game = {
                PHASE_INIT_PLAYER: "PHASE_INIT_PLAYER",
                PHASE_INIT_OPPONENT: "PHASE_INIT_OPPONENT",
                PHASE_PLAY_PLAYER: "PHASE_PLAY_PLAYER",
                PHASE_PLAY_OPPONENT: "PHASE_PLAY_OPPONENT",
                PHASE_GAME_OVER: "PHASE_GAME_OVER",
                PHASE_WAITING: "waiting",

                currentPhase: "",
                phaseOrder: [],
                // garde une référence vers l'indice du tableau phaseOrder qui correspond à la phase de jeu pour le joueur humain
                playerTurnPhaseIndex: 2,

                // l'interface utilisateur doit-elle être bloquée ?
                waiting: false,

                // garde une référence vers les noeuds correspondant du dom
                grid: null,
                miniGrid: null,

                // liste des joueurs
                players: [],
                playerUseHint: false,

                // lancement du jeu
                init: function () {
                        // initialisation
                        this.grid = document.querySelector(".board .main-grid");
                        this.miniGrid = document.querySelector(".mini-grid");

                        // défini l'ordre des phase de jeu
                        this.phaseOrder = [
                                this.PHASE_INIT_PLAYER,
                                this.PHASE_INIT_OPPONENT,
                                this.PHASE_PLAY_PLAYER,
                                this.PHASE_PLAY_OPPONENT,
                                this.PHASE_GAME_OVER,
                        ];

                        // initialise les joueurs
                        this.setupPlayers();

                        // ajoute les écouteur d'événement sur la grille
                        this.addListeners();

                        // c'est parti !
                        this.goNextPhase();
                },
                setupPlayers: function () {
                        // donne aux objets player et computer une réference vers l'objet game
                        player.setGame(this);
                        computer.setGame(this);

                        // todo : implémenter le jeu en réseaux
                        this.players = [player, computer];

                        this.players[0].init();
                        this.players[1].init();
                },
                goNextPhase: function () {
                        // récupération du numéro d'index de la phase courante
                        var ci = this.phaseOrder.indexOf(this.currentPhase);
                        var self = this;

                        if (ci !== this.phaseOrder.length - 1) {
                                this.currentPhase = this.phaseOrder[ci + 1];
                        } else {
                                this.currentPhase = this.phaseOrder[0];
                        }

                        switch (this.currentPhase) {
                                case this.PHASE_GAME_OVER:
                                        // detection de la fin de partie
                                        if (!this.gameIsOver()) {
                                                // le jeu n'est pas terminé on recommence un tour de jeu
                                                this.currentPhase = this.phaseOrder[this.playerTurnPhaseIndex];
                                                utils.info("It's your turn, click on a cell !");
                                        } else {
                                                this.wait();
                                        }
                                        break;
                                case this.PHASE_INIT_PLAYER:
                                        utils.info("Place your ships on the board");
                                        break;
                                case this.PHASE_INIT_OPPONENT:
                                        this.wait();
                                        utils.info("Waiting opponent to place his ships...");
                                        setTimeout(function () {
                                                self.players[1].areShipsOk(function () {
                                                        self.stopWaiting();
                                                        self.goNextPhase();
                                                });
                                        }, 500);
                                        break;
                                case this.PHASE_PLAY_PLAYER:
                                        const hintContainer = document.querySelector("#hint-container");
                                        hintContainer.style.display = "block";
                                        utils.info("It's your turn, click on a cell !");
                                        break;
                                case this.PHASE_PLAY_OPPONENT:
                                        utils.info("Your opponent is playing...");
                                        setTimeout(function() {
                                                self.players[1].play();
                                        }, 500)
                                        break;
                        }
                },
                gameIsOver: function () {
                        for (let i = 0; i < 2; i++) {
                                var fleet = this.players[i].fleet;
                                var lossCondition = 0;
                                for (let j = 0; j < fleet.length; j++) {
                                        if (fleet[j].life === 0) {
                                                lossCondition++;
                                        }
                                }
                                if (lossCondition === fleet.length) {
                                        if(i === 0) {
                                                utils.info("You lost !");
                                        } else {
                                                utils.info("You won !");
                                        }
                                        return true;
                                }
                        }
                        return false;
                },
                getPhase: function () {
                        if (this.waiting) {
                                return this.PHASE_WAITING;
                        }
                        return this.currentPhase;
                },
                // met le jeu en mode "attente" (les actions joueurs ne doivent pas être pris en compte si le jeu est dans ce mode)
                wait: function () {
                        this.waiting = true;
                },
                // met fin au mode mode "attente"
                stopWaiting: function () {
                        this.waiting = false;
                },
                addListeners: function () {
                        // on ajoute des acouteur uniquement sur la grid (délégation d'événement)
                        this.grid.addEventListener(
                            "mousemove",
                            _.bind(this.handleMouseMove, this)
                        );
                        this.grid.addEventListener("click", _.bind(this.handleClick, this));
                        //Event pour tourner le vaisseau actuel
                        this.grid.addEventListener("contextmenu", (e) => {
                                e.preventDefault();
                                if (this.currentPhase === this.PHASE_INIT_PLAYER) {
                                        var ship = this.players[0].fleet[this.players[0].activeShip];
                                        ship.changeDirection();
                                        switch (ship.getDirection()) {
                                                case "horizontal":
                                                        ship.dom.style.height = "" + utils.CELL_SIZE + "px";
                                                        ship.dom.style.width =
                                                            "" + utils.CELL_SIZE * ship.getLife() + "px";
                                                        ship.dom.style.top =
                                                            "" +
                                                            utils.eq(e.target.parentNode) * utils.CELL_SIZE -
                                                            (600 + this.players[0].relativePosition) +
                                                            "px";
                                                        ship.dom.style.left =
                                                            "" +
                                                            utils.eq(e.target) * utils.CELL_SIZE -
                                                            Math.floor(ship.getLife() / 2) * utils.CELL_SIZE +
                                                            "px";
                                                        break;

                                                case "vertical":
                                                        ship.dom.style.width = "60px";
                                                        ship.dom.style.height = 60 * ship.getLife() + "px";
                                                        ship.dom.style.top =
                                                            utils.eq(e.target.parentNode) * utils.CELL_SIZE -
                                                            (600 +
                                                                Math.floor(ship.getLife() / 2) * utils.CELL_SIZE +
                                                                this.players[0].relativePosition) +
                                                            "px";
                                                        ship.dom.style.left = utils.eq(e.target) * utils.CELL_SIZE + "px";
                                                        break;

                                                default:
                                                        break;
                                        }
                                }
                        });
                        //Event pour déclancher la fonction d'aide
                        var hintButton = document.querySelector("#hint-button");
                        hintButton.addEventListener("click", _.bind(this.showHelp, this));
                },
                handleMouseMove: function (e) {
                        // on est dans la phase de placement des bateau
                        if (
                            this.getPhase() === this.PHASE_INIT_PLAYER &&
                            e.target.classList.contains("cell")
                        ) {
                                var ship = this.players[0].fleet[this.players[0].activeShip];

                                // si on a pas encore affiché (ajouté aux DOM) ce bateau
                                if (!ship.dom.parentNode) {
                                        this.grid.appendChild(ship.dom);
                                        // passage en arrière plan pour ne pas empêcher la capture des événements sur les cellules de la grille
                                        ship.dom.style.zIndex = '-1';
                                }

                                // décalage visuelle, le point d'ancrage du curseur est au milieu du bateau
                                switch (ship.getDirection()) {
                                        case "horizontal":
                                                ship.dom.style.top =
                                                    "" +
                                                    utils.eq(e.target.parentNode) * utils.CELL_SIZE -
                                                    (600 + this.players[0].relativePosition) +
                                                    "px";
                                                ship.dom.style.left =
                                                    "" +
                                                    utils.eq(e.target) * utils.CELL_SIZE -
                                                    Math.floor(ship.getLife() / 2) * utils.CELL_SIZE +
                                                    "px";
                                                break;

                                        case "vertical":
                                                ship.dom.style.top =
                                                    utils.eq(e.target.parentNode) * utils.CELL_SIZE -
                                                    (600 +
                                                        Math.floor(ship.getLife() / 2) * utils.CELL_SIZE +
                                                        this.players[0].relativePosition) +
                                                    "px";
                                                ship.dom.style.left = utils.eq(e.target) * utils.CELL_SIZE + "px";
                                                break;

                                        default:
                                                break;
                                }
                        }
                },
                handleClick: function (e) {
                        // si on a cliqué sur une cellule (délégation d'événement)
                        if (e.target.classList.contains("cell")) {
                                // si on est dans la phase de placement des bateau
                                if (this.getPhase() === this.PHASE_INIT_PLAYER) {
                                        var self = this;
                                        // on enregistre la position du bateau, si cela se passe bien (la fonction renvoie true) on continue
                                        if (
                                            this.players[0].setActiveShipPosition(
                                                utils.eq(e.target),
                                                utils.eq(e.target.parentNode)
                                            )
                                        ) {
                                                // et on passe au bateau suivant (si il n'y en plus la fonction retournera false)
                                                if (!this.players[0].activateNextShip()) {
                                                        this.wait();
                                                        utils.confirm(
                                                            "Confirm placement of your ships ?",
                                                            function () {
                                                                    // si le placement est confirmé
                                                                    self.stopWaiting();
                                                                    self.renderMiniMap();
                                                                    self.players[0].clearPreview();
                                                                    self.goNextPhase();
                                                            },
                                                            function () {
                                                                    self.stopWaiting();
                                                                    self.players[0].clearPreview();
                                                                    // sinon, on efface les bateaux (les positions enregistrées), et on recommence
                                                                    self.players[0].resetShipPlacement();
                                                            }
                                                        );
                                                } else {
                                                        utils.info("Continue to place next ship");
                                                }
                                        }
                                }
                                // si on est dans la phase de jeu (du joueur humain)
                                if (this.getPhase() === this.PHASE_PLAY_PLAYER) {
                                        this.players[0].play(
                                            utils.eq(e.target),
                                            utils.eq(e.target.parentNode)
                                        );
                                }
                        }
                },
                // fonction utlisée par les objets représentant les joueurs (ordinateur ou non)
                // pour placer un tir et obtenir de l'adversaire l'information de réusssite ou non du tir
                fire: function (from, col, line, callback) {
                        this.wait();
                        var self = this;
                        var msg = "";

                        // determine qui est l'attaquant et qui est attaqué
                        var target =
                            this.players.indexOf(from) === 0 ? this.players[1] : this.players[0];
                        // on demande à l'attaqué si il a un bateaux à la position visée
                        // le résultat devra être passé en paramètre à la fonction de callback (3e paramètre)
                        target.receiveAttack(from, col, line, function (hasSucceed) {
                                // Détecte si le joueur a déjà tiré sur cette case
                                if (from.tries[line][col] !== 0) {
                                        msg += "Encore ";
                                } else {
                                        from.tries[line][col] = hasSucceed;
                                }
                                if (self.currentPhase === self.PHASE_PLAY_OPPONENT) {
                                        from.renderTries(self.miniGrid);
                                } else {
                                        from.renderTries(self.grid);
                                }

                                if (from.tries[line][col]) {
                                        boom.play();
                                        if (self.currentPhase === self.PHASE_PLAY_PLAYER) {
                                                msg += "BOOM ! You hit your opponent !";
                                                var node = document
                                                    .querySelector(".main-grid")
                                                    .querySelector(
                                                        ".row:nth-child(" +
                                                        (line + 1) +
                                                        ") .cell:nth-child(" +
                                                        (col + 1) +
                                                        ")"
                                                    );
                                                // animate the cell
                                                node.setAttribute("id", "boom");
                                                // remove the animation
                                                setTimeout(function () {
                                                        node.removeAttribute("id");
                                                }, 1000);
                                        } else if (self.currentPhase === self.PHASE_PLAY_OPPONENT) {
                                                msg += "OUCH ! Your opponent hit you !";
                                                boom.play();
                                                if (self.currentPhase === self.PHASE_PLAY_PLAYER) {
                                                        msg += "BOOM ! You hit your opponent !";
                                                        var node = document
                                                            .querySelector(".mini-grid")
                                                            .querySelector(
                                                                ".row:nth-child(" +
                                                                (line + 1) +
                                                                ") .cell:nth-child(" +
                                                                (col + 1) +
                                                                ")"
                                                            );
                                                        node.setAttribute("id", "boom");
                                                        setTimeout(function () {
                                                                node.removeAttribute("id");
                                                        }, 1000);
                                                }
                                        }
                                } else if (self.currentPhase === self.PHASE_PLAY_PLAYER) {
                                        msg += "You missed !";
                                        plop.play();
                                        if (self.currentPhase === self.PHASE_PLAY_PLAYER) {
                                                var node = document
                                                    .querySelector(".main-grid")
                                                    .querySelector(
                                                        ".row:nth-child(" +
                                                        (line + 1) +
                                                        ") .cell:nth-child(" +
                                                        (col + 1) +
                                                        ")"
                                                    );
                                                node.setAttribute("id", "miss");
                                                setTimeout(function () {
                                                        node.removeAttribute("id");
                                                }, 1000);
                                        } else if (self.currentPhase === self.PHASE_PLAY_OPPONENT) {
                                                msg += "Your opponent missed !";
                                                plop.play();
                                                if (self.currentPhase === self.PHASE_PLAY_OPPONENT) {
                                                        var node = document
                                                            .querySelector(".mini-grid")
                                                            .querySelector(
                                                                ".row:nth-child(" +
                                                                (line + 1) +
                                                                ") .cell:nth-child(" +
                                                                (col + 1) +
                                                                ")"
                                                            );
                                                        node.setAttribute("id", "miss");
                                                        setTimeout(function () {
                                                                node.removeAttribute("id");
                                                        }, 1000);
                                                }
                                        }
                                }

                                utils.info(msg);

                                // on fait une petite pause avant de continuer...
                                // histoire de laisser le temps au joueur de lire les message affiché
                                setTimeout(function () {
                                        self.stopWaiting();
                                        self.goNextPhase();
                                }, 1000);
                        });
                },
                renderMiniMap: function () {
                        for (
                            let i = 0;
                            i < this.grid.querySelectorAll(":not(.row, .cell)").length;
                            i++
                        ) {
                                var div = this.grid.querySelectorAll(":not(.row, .cell)")[i];
                                var clone = div.cloneNode(true);
                                this.miniGrid.appendChild(clone);
                        }
                },
                showHint: function () {
                        var x = Math.floor(Math.random() * 10);
                        var y = Math.floor(Math.random() * 10);
                        var cell = document.querySelector(".main-grid .row:nth-child(" + (y + 1) + ") .cell:nth-child(" + (x + 1) + ")");
                        // check if the cell contain a background color rgb or red
                        // if not, add a class hint to the cell
                        if(cell && !cell.style.backgroundColor) {
                                cell.classList.add("hint");
                        } else {
                                console.error('Cell not found');
                        }
                },
                // a simple fonction for hint a cell to play
                showHelp: function() {
                        // player can only show hint once each player turn
                        if(this.getPhase() === this.PHASE_PLAY_PLAYER) {
                                if(!this.playerUseHint) {
                                        this.playerUseHint = true;
                                        this.showHint();
                                } else {
                                        utils.info("You can only use hint once per turn");
                                }
                        }
                }
        };

        // point d'entrée
        document.addEventListener("DOMContentLoaded", function () {
                game.init();
        });
})();