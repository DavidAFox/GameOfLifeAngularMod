(function(){
angular.module('gameOfLifeModule', [])
	.directive('gameOfLife', ['game', function(game){
		var controller = ['$scope', 'game', function($scope, game){
			var lgame= game;
			$scope.rMessage = "Run";
			$scope.speedNumber = 3;
			lgame.setSpeed(3);
			$scope.$watch('speedNumber', function() {
				lgame.setSpeed($scope.speedNumber);
			})
			$scope.stepFunction = function() {
				lgame.step();
			}
			$scope.toggle = function() {
				if(!lgame.running()) {
					$scope.rMessage = "Stop";
				} else {
					$scope.rMessage = "Run";
				}
				lgame.run();
			}
		}]
		return {
			controller: controller,
			templateUrl: "game_of_life.html",
			restrict: 'E'
		}
	}])
	.directive('gameCanvas', ['$interval', 'game', function($interval, game){
		var link = function($scope, element, attrs, controller){
			var lgame=game;
			var getCursorPosition = function(canvas, event) {
				var rect = canvas.getBoundingClientRect();
				var x = event.clientX - rect.left;
				var y = event.clientY - rect.top;
				var result = {};
				result.x = x;
				result.y = y;
				return result;
			}
			element.on('click', function(event){
				var canvasCoords = getCursorPosition(element[0], event)
				var x =  Math.floor(canvasCoords.x *lgame.getWidth()/element[0].width);
				var y = Math.floor(canvasCoords.y *lgame.getHeight()/element[0].height);
				lgame.togglePoint(x,y);
			})
			lgame.setDrawPoint(function(x, y, value, gridWidth, gridHeight) {
				var width = element[0].width;
				var height = element[0].height;
				var ctx = element[0].getContext('2d');
				if(value === 1) {
					ctx.fillStyle = "green";
				} else {
					ctx.fillStyle = "white";
				}
				ctx.fillRect((x *(width/gridWidth)), (y * (height/gridHeight)), (width/gridWidth), (height/gridHeight));
			});
		};
		return {
			link: link,
			restrict: 'A'
		}
	}])
	.factory('game', ['$interval', function($interval) {
			var width = 100;
			var height = 100;
			console.log("in factory")
			var game = {}
			var inter;
			var running = false;
			var speed;
			var drawPoint = function() {
				return;
			};
			var updateCanvas = function(grid, nextGrid) {
				grid.forEach(function(current, y, array) {
					current.forEach(function(innerCurrent, x, innerArray){
						if(grid[y][x] !== nextGrid[y][x]) {
							drawPoint(x,y,array[y][x], width, height);	
						}
					});
				});
			};
			var setUpGrid = function(width, height) {
				var i;
				var grid;
				grid = new Array(height);
				for(i=0;i<grid.length;i++) {
					grid[i] = new Uint8Array(width);
				}
				return grid;
			};
			var grid = setUpGrid(width, height);
			var nextGrid = setUpGrid(width, height);
			var getTotalLive = function(y, x, grid) {
				var r;
				var i;
				var total = 0;
				for(r=1;r>-2;r--) {
					for(i=-1;i<2;i++) {
						total += getSafe(y+r, x+i, grid)
					}
				}
				return total
			}
			var getSafe = function(y, x, grid) {
				var newY= y;
				var newX = x;
				if(y >= grid.length) {
					newY = 0;
				}
				if(y < 0) {
					newY = grid.length - 1;
				}
				if(x >= grid[0].length) {
					newX = 0;
				}
				if(x < 0) {
					newX = grid[0].length -1;
				}
				return grid[newY][newX];
			}
			var switchGen = function() {
				calculateNextGeneration(grid, nextGrid)
				var temp = grid;
				grid = nextGrid;
				nextGrid = temp;
				updateCanvas(grid, nextGrid);
			}
			var calculateNextGeneration = function(grid, nextGrid) {
				var i;
				var r;
				var total;
				for(r=0;r<grid.length;r++) {
					for(i=0;i<grid[r].length;i++) {
						total = getTotalLive(r,i,grid);
						switch (true) {
							case total <= 2:
								nextGrid[r][i] = 0;
								break;
							case total === 3:
								nextGrid[r][i] = 1;
								break;
							case total === 4:
								nextGrid[r][i] = grid[r][i];
								break;
							case total >= 5:
								nextGrid[r][i] = 0;
								break;
						}
					}
				}
			}

			game.setDrawPoint = function(func) {
				if(typeof func === 'function') {
					drawPoint = func;
				}
			};
			game.getWidth= function() {
				return width;
			}
			game.getHeight= function() {
				return height;
			}
			game.setSpeed = function(newSpeed) {
				if(running) {
					$interval.cancel(inter);
					inter = $interval(switchGen, (100/(Math.pow(2,newSpeed-3))))
				}
				speed = newSpeed;
			}
			game.setPoint = function(x,y,value) {
				grid[y][x] = value;
				drawPoint(x,y,value, width, height);
			}
			game.togglePoint = function(x,y) {
				if(grid[y][x] === 1) {
					grid[y][x] = 0;
				} else {
					grid[y][x] = 1;
				}
				drawPoint(x,y,grid[y][x], width, height);
			}
			game.run = function() {
				if(running) {
					$interval.cancel(inter);
				} else {
					inter = $interval(switchGen, (100/(Math.pow(2,speed-3))));
				}
				running = !running;
			}
			game.step = function() {
				switchGen()
			}
			game.running = function() {
				return running;
			}
			return game;
	}])
})();