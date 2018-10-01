
/* this is a simple chunk of code for generating terrain types, which should
 * vary depending on circumstance.  For instance "dungeon" would be different
 * from "cave", "city", "castle", etc.  We'll start with dungeon. */
var roomClass = function(){
	this.x = this.y = 0;
	this.x1 = this.y1 = 0;
	this.x2 = this.y2 = 0;
}

roomClass.prototype.setArea = function(x, y, gridStep, zoom){
	gridStep = Math.abs(gridStep);
	zoom = Math.abs(zoom);
	x += .5;
	y += .5;

	this.x = Math.round(x * gridStep);
	this.y = Math.round(y * gridStep);
	this.x1 = Math.round(x * gridStep - gridStep * zoom);
	this.x2 = Math.round(x * gridStep + gridStep * zoom - 1);
	this.y1 = Math.round(y * gridStep - gridStep * zoom);
	this.y2 = Math.round(y * gridStep + gridStep * zoom - 1);

	var minSize = 3;
	var dx = this.x2 - this.x1;
	if(dx < minSize){
		this.x1 = this.x2 - minSize;
		if(this.x1 < 0){
			this.x2 -= this.x1;
			this.x1 = 0;
		}
	}

	var dy = this.y2 - this.y1;
	if(dy < minSize){
		this.y1 = this.y2 - minSize;
		if(this.y1 < 0){
			this.y2 -= this.y1;
			this.y1 = 0;
		}
	}
}

function buildDungeon(){
	
	var requiredParams = Array(
		'width',
		'height'
	);

	var optionalParams = {
		'stairup' : false,
		'stairdown' : false,
		'roomscale' : .6 + Math.random() * .4,
		'gridscale' : .75 + Math.random() * .5
	};
	
	var p, param, defaultval;

	if(arguments.length != 1){
		throw "buildDungeon: expecting one argument of type class";
	}

	for(p in requiredParams){
		param = requiredParams[p];
		if(arguments[0][param] == undefined){
			throw "buildDungeon required parameter \"" + param + "\" not provided.";
		}

		eval(param + ' = ' + arguments[0][param]); 
	}

	for(param in optionalParams){
		defaultval = optionalParams[param];
	
		if(arguments[0][param] != undefined){
			eval(param + ' = ' + arguments[0][param]); 
		}else{
			eval(param + ' = ' + defaultval); 
		}
	}

	width *= 1;
	if(width < 3){
		throw "buildDungeon: Invaid width parameter:" + width;
	}

	height *= 1;
	if(height < 3){
		throw "buildDungeon: Invaid height parameter" + height;
	}

	var area = width * height;

	var map = makeEmptyMap(width, height);
	
	// ok, we have our empty map, now let's do the dirty business!
	var zoom, room, dx, dy, numRooms, n, m, x, y;

	// first we build a few basic rooms
	var gridStep = Math.round(gridscale * Math.pow(area, 1/4));
	
	var xGrid = Math.floor(width / gridStep);
	var yGrid = Math.floor(height / gridStep);

	var rooms = Array();
	var hypsq = xGrid * xGrid + yGrid * yGrid;

	for(var attemptTally = 0; rooms.length < 3 && (attemptTally < 1000 || count(rooms) == 0); attemptTally++){
		for(x = 0; x < xGrid; x++){
			for(y = 0; y < yGrid; y++){

				dx = (width >> 1) - x * gridStep;
				dy = (height >> 1) - y * gridStep;
				if(dx * dx + dy * dy > hypsq * gridStep * .8) continue;
				
				// edit this zoom and the if condition to change the varying size of the rooms
				zoom =  roomscale * (Math.random() * 700 + 300) / 1000;
				if(Math.random() * gridStep < gridStep * zoom){
					room = new roomClass();
					room.setArea(x, y, gridStep, zoom);
					rooms[rooms.length] = room;

					for(dx = room.x1; dx <= room.x2; dx++){
						for(dy = room.y1; dy <= room.y2; dy++){
							if(dx >= 0 && dx < width && dy >= 0 && dy < height){
								map[dx][dy] = ".";
							}
							
						}
					}
				}
			}
		}
	}
	numRooms = rooms.length;
	// now connect them with hallways	
	var connectedRooms = Array();
	connectedRooms[0] = Math.floor(Math.random() * numRooms);
	for(n = 0; n < numRooms; n++){
		//if(connectedRooms[n]) continue;
		var doneThisRoom = 0;
		for(m = 0; m < connectedRooms.length && !doneThisRoom; m++){
			if(connectedRooms[m] == n){
				doneThisRoom = 1;
			}
		}
		if(doneThisRoom) continue;

		minDist = null;
		nearestIndex = null;
		for(m = 0; m < connectedRooms.length; m++){
			dist = Math.hypot(rooms[n].x - rooms[connectedRooms[m]].x, rooms[n].y - rooms[connectedRooms[m]].y);
			if(minDist === null || dist < minDist){
				minDist = dist;
				nearestIndex = connectedRooms[m];
			}
		}
		connectedRooms[connectedRooms.length] = n;
		dx = rooms[nearestIndex].x - rooms[n].x;
		dy = rooms[nearestIndex].y - rooms[n].y;

		ix = dx == 0 ? 0 : (dx < 0 ? -1 : 1);
		iy = dy == 0 ? 0 : (dy < 0 ? -1 : 1);
		
		if(Math.abs(dx) > Math.abs(dy)){
			for(x = rooms[n].x; x != rooms[nearestIndex].x; x += ix){
				map[x][rooms[n].y] = '.';
			}
			for(y = rooms[n].y; y != rooms[nearestIndex].y; y += iy){
				map[x][y] = '.';
			}
		}else{
			for(y = rooms[n].y; y != rooms[nearestIndex].y; y += iy){
				map[rooms[n].x][y] = '.';
			}
			for(x = rooms[n].x; x != rooms[nearestIndex].x; x += ix){
				map[x][y] = '.';
			}
		}
	}
	// now we surround the rooms with brick
	for(x = 1; x < width - 1; x++){
		for(y = 1; y < height - 1; y++){
			if(map[x][y] == "."){
				for(dx = -1; dx <= 1; dx++){
					for(dy = -1; dy <= 1; dy++){
						if(map[x + dx][y + dy] == ' '){
							map[x + dx][y + dy] = '#';
						}
					}
				}
			}
		}
	}
	// make sure the edge of the room is enclosed
	for(x = 0; x < width; x++){
		if(map[x][0] == '.'){
			map[x][0] = '#';
		}
		if(map[x][height - 1] == '.'){
			map[x][height - 1] = '#';
		}
	}
	for(y = 0; y < height; y++){
		if(map[0][y] == '.'){
			map[0][y] = '#';
		}
		if(map[width - 1][y] == '.'){
			map[width - 1][y] = '#';
		}
	}

	// scrub any trailing walls caused by the code above
	for(x = 0; x < width; x++){
		for(y = 0; y < height; y++){
			if(map[x][y] == '#'){
				tally = 0;
				for(dx = -1; dx <= 1; dx++){
					for(dy = -1; dy <= 1; dy++){
						if(dx == 0 && dy == 0) continue;
						if(x + dx >= 0 && x + dx < width && y + dy >= 0 && y + dy < height){
							if(map[x + dx][y + dy] != ' ') tally++;
						}
					}
				}
				if(tally <= 3){
					map[x][y] = ' ';
				}
			}
		}
	}
	// were stairs up/down requested?
	if(stairup){
		tally = Math.floor(Math.random() * width * height) + 100;
		while(tally > 0){
			for(x = 0; x < width && tally > 0; x += tally != 0){
				for(y = 0; y < height && tally > 0; y += tally != 0){
					if(map[x][y] == '.'){
						tally --;
					}
				}
			}
		}
		map[x][y] = '<';
	}
	if(stairdown){
		tally = Math.floor(Math.random() * width * height) + 100;
		while(tally > 0){
			for(x = 0; x < width && tally > 0; x += tally != 0){
				for(y = 0; y < height && tally > 0; y += tally != 0){
					if(map[x][y] == '.'){
						tally --;
					}
				}
			}
		}
		map[x][y] = '>';
	}
	return map;

}

// Render a forst terrain
function buildForest(){
	
	var requiredParams = Array(
		'width',
		'height'
	);
	
	var p, param;

	if(arguments.length != 1){
		throw "buildForest: expecting one argument of type class";
	}

	for(p in requiredParams){
		param = requiredParams[p];
		if(arguments[0][param] == undefined){
			throw "buildForest required parameter \"" + param + "\" not provided.";
		}

		eval(param + ' = ' + arguments[0][param]); 
	}

	width *= 1;
	if(width < 3){
		throw "buildForest: Invaid width parameter:" + width;
	}

	height *= 1;
	if(height < 3){
		throw "buildForest: Invaid height parameter" + height;
	}

	var area = width * height;
	var map = makeEmptyMap(width, height, '.');


	// ok, we have our empty map, now let's do the dirty business!
	var gridStep = Math.round(Math.pow(area, .125));
	
	var xGrid = Math.floor(width / gridStep);
	var yGrid = Math.floor(height / gridStep);
	var x, y, dx, dy;

	for(x = 0; x < xGrid; x++){
		for(y = 0; y < yGrid; y++){
			if(!Math.floor(Math.random() * gridStep)){
				for(dx = 0; dx < gridStep; dx++){
					for(dy = 0; dy < gridStep; dy++){
						map[x * gridStep + dx][y * gridStep + dy] = "T";
					}
				}
			}
		}
	}

	// let's run the game of life on it to give it a more chaotic look
	map = life(map, 5, 'T');
	return map;
}

// Render a swamp terrain
function buildSwamp(){
	
	var requiredParams = Array(
		'width',
		'height'
	);

	// no need for these to add up to 100 - chance is calculated from their sum
	var optionalParams = {
		'treeChance' : 10,
		'waterChance' : 15,
		'reedChance' : 85
	};
	
	var p, param;

	if(arguments.length != 1){
		throw "buildSwamp: expecting one argument of type class";
	}

	for(p in requiredParams){
		param = requiredParams[p];
		if(arguments[0][param] == undefined){
			throw "buildSwamp required parameter \"" + param + "\" not provided.";
		}

		eval(param + ' = ' + arguments[0][param]); 
	}

	for(param in optionalParams){
		defaultval = optionalParams[param];
	
		if(arguments[0][param] != undefined){
			eval(param + ' = ' + arguments[0][param]); 
		}else{
			eval(param + ' = ' + defaultval); 
		}
	}

	var totalChance = treeChance + waterChance + reedChance;

	width *= 1;
	if(width < 3){
		throw "buildSwamp: Invaid width parameter:" + width;
	}

	height *= 1;
	if(height < 3){
		throw "buildSwamp: Invaid height parameter" + height;
	}

	var area = width * height;
	var map = makeEmptyMap(width, height, '.');


	// ok, we have our empty map, now let's do the dirty business!
	var gridStep = Math.round(Math.pow(area, .125));
	
	var xGrid = Math.floor(width / gridStep);
	var yGrid = Math.floor(height / gridStep);
	var x, y, dx, dy, drawchar, chance;

	for(x = 0; x < xGrid; x++){
		for(y = 0; y < yGrid; y++){
			if(!Math.floor(Math.random() * gridStep / 2)){
				chance = Math.floor(Math.random() * totalChance);
				if(chance < treeChance){
					drawchar = 'T';
				}else if(chance < treeChance + waterChance){
					drawchar = '=';
				}else{
					drawchar = '"';
				}
				for(dx = 0; dx < gridStep; dx++){
					for(dy = 0; dy < gridStep; dy++){
						map[x * gridStep + dx][y * gridStep + dy] = drawchar;
					}
				}
			}
		}
	}

	// let's run the game of life on it to give it a more chaotic look
	map = life(map, 4, '.');
	return map;
}

// a competetive version of the game of life, which allows competing life forms
function life(map, iterations, deadchar){
	var newMap = makeEmptyMap(map.length, map[0].length);
	var x, y, dx, dy, tally, rx, ry, n, charval;
	for(n = 0; n < iterations; n++){
		for(x = 0; x < map.length; x++){
			for(y = 0; y < map[x].length; y++){
				tally = Array();
				for(dx = -1; dx <= 1; dx++){
					for(dy = -1; dy <= 1; dy++){
						if(dx == 0 && dy == 0) continue;
						rx = (x + dx + map.length) % map.length;
						ry = (y + dy + map[rx].length) % map[rx].length;

						charval = map[rx][ry];
						if(tally[charval] == undefined){
							tally[charval] = 1;
						}else{
							tally[charval]++;
						}

					}
				}
				bestTally = -1;
				for(m in tally){
					if(tally[m] > 1 && tally[m] < 4){
						if(bestTally == -1 || tally[bestTally] < tally[m]){
							bestTally = m;
						}
					}
				}
				if(bestTally != -1){
					newMap[x][y] = bestTally;
				}else{
					newMap[x][y] = deadchar;
				}
			}
		}

		for(x = 0; x < map.length; x++){
			for(y = 0; y < map[x].length; y++){
				map[x][y] = newMap[x][y];
			}
		}
	}
	return map;
}

// initialize a clean map of the specified dimensions.
function makeEmptyMap(width, height, fillchar){
	if(fillchar == undefined) fillchar = ' ';
	var map = Array();
	for(var n = 0; n < width; n++){
		map[n] = Array.apply(null, Array(height)).map(String.prototype.valueOf, fillchar);
	}
	return map;
}
