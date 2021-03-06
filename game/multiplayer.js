/* global require */
/* global module */

'use strict';

const FRAMETIME = 35;
const DEFAULT_W = 1920;

import User from '../modules/user';

import Dot from './dot';
import Opponent from './opponent';
import Net from './net';
import InputController from './input';
import WorldObjectsController from './world_objects_controller';

class MultiplayerController {

	constructor () {
		if(MultiplayerController._instance) {
			return MultiplayerController._instance;
		}
		MultiplayerController._instance = this;
        
        this.monsterSkinRun = [];
		for(let i = 0; i < 3; i++) {
			let monsterImg = new Image();
			monsterImg.src = '/img/m' + i + '.png';
			this.monsterSkinRun.push(monsterImg);
		}
        this.amount = 2;
		this.gameCanvas = document.getElementById('multiplayer');
		this.gameCtx = this.gameCanvas.getContext('2d');
		this.gameSettings = {
			'canvas' : this.gameCtx,
			'height' : this.gameCanvas.height,
			'width' : this.gameCanvas.width,
			'scale' : this.gameCanvas.width / DEFAULT_W,
			'defaultW' : DEFAULT_W
        };
        
        this.user = new User();
		
        this.Player = new Opponent();
        this.Opponent = new Opponent();

        this.WorldObjectsController = new WorldObjectsController();
        this.NetController = new Net(this.Player, this.Opponent, this.WorldObjectsController, this, this.user._proto.login);
        this.InputController = new InputController(this);

		this.NetController.connect('wss://api.lastunion.ml/websocket');
	}

	initGame(_started) {
		this.started = _started;
		this.game = null;
		this._over = false;
        this.Player.init();
        this.Opponent.init();
		this.WorldObjectsController.resetObjects();
		this.time = 0;
        this.skin = 0;
        this.time = 3;
	}

	redrawScene(prev) {
		if(!this.NetController.over) {
			this.gameSettings.height = this.gameCanvas.height;
			this.gameSettings.width = this.gameCanvas.width;
            this.gameSettings.scale = this.gameCanvas.width / DEFAULT_W;

			this.drawSurface();
			this.text('Your score: ' + this.NetController.PlayerScore + ' and Your opponent score is ' + this.NetController.OpponentScore, 60 + 80, 25, '#000000');
			//this.NetController.World.redrawAllObjects(this.gameSettings);
            this.NetController.Player.draw(this.gameSettings);
            this.NetController.Opponent.draw(this.gameSettings);

			requestAnimationFrame(() => this.redrawScene());
        } else {
            this.gameover();
        }
	}

	reset(_started) {
		this.initGame(_started);
		this.play();
	}

	drawSurface() {
        this.time++;
        if(this.time % 4 == 0) {
            this.skin == 2 ? this.skin = 0 : this.skin++;
        }
		// Reset canvas
		this.gameCtx.fillStyle = '#FFFFFF';
		this.gameCtx.strokeStyle = '#000000';
		this.gameCtx.clearRect(0, 0, this.gameSettings.width, this.gameSettings.height);

		// Draw background
		this.gameCtx.fillStyle = '#000000';
		this.gameCtx.fillRect(0, this.gameSettings.height / 2, this.gameSettings.width, this.gameSettings.height / 2);

		this.gameCtx.drawImage(
			this.monsterSkinRun[this.skin],
			0, 
			this.gameSettings.height / 2 - 130 * this.gameSettings.scale,
			130 * this.gameSettings.scale, 
			130 * this.gameSettings.scale
		);

		if( /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent) ) {
			this.gameCtx.strokeStyle = '#ffffff';
			this.gameCtx.strokeRect(100, this.gameSettings.height / 2 + 100 * this.gameSettings.scale, 200 * this.gameSettings.scale, 200 * this.gameSettings.scale);
			this.gameCtx.strokeRect(this.gameSettings.width - 100 - 200 * this.gameSettings.scale, this.gameSettings.height / 2 + 100 * this.gameSettings.scale, 200 * this.gameSettings.scale, 200 * this.gameSettings.scale);
			this.gameCtx.fillStyle = '#ffffff';
			this.gameCtx.font = 64 * this.gameSettings.scale + 'px Arial';
			this.gameCtx.fillText("W", 100 + 100 * this.gameSettings.scale, this.gameSettings.height / 2 + 200 * this.gameSettings.scale);
			this.gameCtx.fillText("S", this.gameSettings.width - 100 - 100 * this.gameSettings.scale, this.gameSettings.height / 2 + 200 * this.gameSettings.scale);
		}
	}

	play() {
		const _this = this;
		if(this.started) {
			requestAnimationFrame(() => this.redrawScene());
		} else {
			this.startOverlay();
		}
	}

	text(source, y, size, color) {
		this.gameCtx.fillStyle = color;
		this.gameCtx.font = size * this.gameSettings.scale + 'px Arial';
		this.gameCtx.textAlign='center';
		this.gameCtx.fillText(source, this.gameCanvas.width / 2, y * this.gameSettings.scale);
	}

	setOpacity() {
		this.gameCtx.globalAlpha = 0.8;
		this.gameCtx.fillStyle = '#FFFFFF';
		this.gameCtx.fillRect(0, 0, this.gameCanvas.width, this.gameCanvas.height);
		this.gameCtx.globalAlpha = 1.0;
    }
    
    ready() {
        this.gameCtx.fillStyle = '#FFFFFF';
		this.gameCtx.fillRect(0, 0, this.gameCanvas.width, this.gameCanvas.height);
		this.text('You are ready!', this.gameCanvas.height / 2, 60, '#000000');
        this.text('Waiting for opponent to start', this.gameCanvas.height / 2 + 30, 40, '#555555');
    }

    starting() {
        this.gameCtx.fillStyle = '#FFFFFF';
		this.gameCtx.fillRect(0, 0, this.gameCanvas.width, this.gameCanvas.height);
        this.text('Game is about to start!', this.gameCanvas.height / 2, 60, '#000000');
        
        const _this = this;
        this.text(this.time, this.gameCanvas.height / 2 + 50, 60, '#000000');
        if(this.time > 0) {
            this.time--;
            setTimeout(function() {
                _this.starting();
            }, 1000);
        } else {
            this.reset(true);
        }
        
    }

	startOverlay() {
		this.setOpacity();
		this.text('LASTUNION presents!', this.gameCanvas.height / 2, 60, '#000000');
		this.text('Press SPACE to start', this.gameCanvas.height / 2 + 30, 30, '#555555');
	}

	gameover() {
		this.gameoverOverlay();
	}

	gameoverOverlay(win) {
		this.setOpacity();

		const imgHeight = 200 * this.gameSettings.scale;
        const imgWidth = imgHeight
        
        let wl = "";

        wl = win ? "You won!" : "You lost :(";

		this.text(wl, 250, 60, '#000000');
		this.text('Press SPACE to run again!', 300, 30, '#555555');
		this.text('Your score: ' + this.ScoreController.scoreValue, imgHeight + 360, 60, '#000000');

		const nekro = new Image();
		nekro.src = '/img/nekro.png';
		const _this = this;
		nekro.onload = function() {
			_this.gameCtx.drawImage(nekro, _this.gameCanvas.width / 2 - 100 * _this.gameSettings.scale, 0, imgWidth, imgHeight);
		};
	}
	
}

export default MultiplayerController;