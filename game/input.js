/* global require */
/* global module */

'use strict';

import Player from './player';

function copyTouch(touch) {
	return { identifier: touch.identifier, pageX: touch.pageX, pageY: touch.pageY };
  }

class InputController {

	constructor (Controller) {
		this.PlayerController = new Player();
		this.Controller = Controller;
		this.ongoingTouches = [];

		const _this = this;
		document.addEventListener('keydown', function(event) {
			switch(event.keyCode) {
			case 87:
				_this.PlayerController.jump();
				break;
			case 83:
				_this.PlayerController.duck();
				break;
			case 32:
				if(!_this.Controller._over && _this.Controller.started) {
					_this.Controller.pause();
				} else {
					_this.Controller.reset(true);
				}
				break;
			}
		});

		document.addEventListener('keyup', function(event) {
			switch(event.keyCode) {
			case 83:
				_this.PlayerController.run();
				break;
			case 87:
				_this.PlayerController.jumpFinish();
				break;
			}
		});

		this.Controller.gameCanvas.addEventListener("touchstart", function(event) {
			event.preventDefault();
			const ctx = _this.Controller.gameCtx;
			let touches = event.changedTouches;
			
			for (let i = 0; i < touches.length; i++) {
				_this.ongoingTouches.push(copyTouch(touches[i]))
				if(!_this.Controller._over && _this.Controller.started) {
					if(touches[i].pageY - 80 > _this.Controller.gameCanvas.height / 2) {
						if(touches[i].pageX < _this.Controller.gameCanvas.width / 2) {
							_this.PlayerController.jump();
						} else {
							_this.PlayerController.duck();
						}
					} else {
						if(!_this.Controller._over && _this.Controller.started) {
							_this.Controller.pause();
						} else {
							_this.Controller.reset(true);
						}
					}
				} else {
					_this.Controller.reset(true);
					break;
				}
				
				
			}
		}, false);
		this.Controller.gameCanvas.addEventListener("touchend", function(event) {
			event.preventDefault();
			const ctx = _this.Controller.gameCtx;
			let touches = event.changedTouches;
			
			for (let i = 0; i < touches.length; i++) {
				var idx = _this.ongoingTouchIndexById(touches[i].identifier);
				if(idx >= 0) {
					if(_this.ongoingTouches[idx].pageY - 80 > _this.Controller.gameCanvas.height / 2) {
						if(_this.ongoingTouches[idx].pageX < _this.Controller.gameCanvas.width / 2) {
							_this.PlayerController.jumpFinish();
						} else {
							_this.PlayerController.run();
						}
					}
					_this.ongoingTouches.splice(idx, 1);
				}				
			}
		}, false);
		this.Controller.gameCanvas.addEventListener("touchMOVE", this.handleHold, false);
	}

	ongoingTouchIndexById(idToFind) {
		for (let i = 0; i < this.ongoingTouches.length; i++) {
			let id = this.ongoingTouches[i].identifier;
			if (id == idToFind) {
			  return i;
			}
		  }
	  return -1;    // not found
	}

	
}

export default InputController;
