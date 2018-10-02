
/* this is a simple chunk of code for generating terrain types, which should
 * vary depending on circumstance.  For instance "dungeon" would be different
 * from "cave", "city", "castle", etc.  We'll start with dungeon. */
var roomClass = function(){
	this.map = null;
	this.x = this.y = 0;
	this.x1 = this.y1 = 0;
	this.x2 = this.y2 = 0;
}

roomClass.prototype.setArea = function(x, y, gridStep, zoom){
	gridStep = Math.abs(gridStep);
	zoom = Math.abs(zoom);

	this.x = Math.round(x * gridStep);
	this.y = Math.round(y * gridStep);
	this.x1 = Math.round(x * gridStep - gridStep * zoom);
	this.x2 = Math.round(x * gridStep + gridStep * zoom);
	this.y1 = Math.round(y * gridStep - gridStep * zoom);
	this.y2 = Math.round(y * gridStep + gridStep * zoom);

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

var mapBuilder = function(){
	this.width = this.height = 0;

	this.defaultParams = {
		'width' : 60,
		'height' : 25,
		'stairup' : false,
		'stairdown' : false,
		'roomscale' : .6 + Math.random() * .4,
		'gridscale' : .75 + Math.random() * .5,
		'treeChance' : 10,
		'waterChance' : 15,
		'reedChance' : 85
	}
};

mapBuilder.prototype.readParams = function(){
	for(param in this.defaultParams){
		defaultval = this.defaultParams[param];

		if(arguments[0][param] != undefined){
			eval('this.' + param + ' = ' + arguments[0][param]); 
		}else{
			eval('this.' + param + ' = ' + defaultval); 
		}
	}

	this.width *= 1;
	if(this.width < 3){
		throw "mapBuilder: Invaid width parameter:" + this.width;
	}

	this.height *= 1;
	if(this.height < 3){
		throw "mapBuilder: Invaid height parameter" + this.height;
	}
}

mapBuilder.prototype.buildDungeon = function(){

	this.readParams.apply(this, arguments);


	var area = this.width * this.height;

	this.map = this.makeEmptyMap();

	// ok, we have our empty map, now let's do the dirty business!
	var zoom, room, dx, dy, numRooms, n, m, x, y;

	// first we build a few basic rooms
	var gridStep = Math.round(this.gridscale * Math.pow(area, 1/4));

	var xGrid = Math.floor(this.width / gridStep);
	var yGrid = Math.floor(this.height / gridStep);

	var rooms = Array();
	var hypsq = xGrid * xGrid + yGrid * yGrid;

	for(var attemptTally = 0; rooms.length < 3 && (attemptTally < 1000 || count(rooms) == 0); attemptTally++){
		for(x = 0; x < xGrid; x++){
			for(y = 0; y < yGrid; y++){

				dx = (this.width >> 1) - x * gridStep;
				dy = (this.height >> 1) - y * gridStep;
				if(dx * dx + dy * dy > hypsq * gridStep * ( 0.1 + Math.random())) continue;

				// edit this zoom and the if condition to change the varying size of the rooms
				zoom = this.roomscale * (Math.random() * 700 + 300) / 1000;
				if(Math.random() * gridStep < gridStep * zoom){
					room = new roomClass();
					room.setArea(x, y, gridStep, zoom);
					rooms[rooms.length] = room;

					for(dx = room.x1; dx <= room.x2; dx++){
						for(dy = room.y1; dy <= room.y2; dy++){
							if(dx >= 0 && dx < this.width && dy >= 0 && dy < this.height){
								this.map[dx][dy] = ".";
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
				this.map[x][rooms[n].y] = '.';
			}
			for(y = rooms[n].y; y != rooms[nearestIndex].y; y += iy){
				this.map[x][y] = '.';
			}
		}else{
			for(y = rooms[n].y; y != rooms[nearestIndex].y; y += iy){
				this.map[rooms[n].x][y] = '.';
			}
			for(x = rooms[n].x; x != rooms[nearestIndex].x; x += ix){
				this.map[x][y] = '.';
			}
		}
	}

	this.encloseWithBricks();

	// scrub any trailing walls caused by the code above
	for(x = 0; x < this.width; x++){
		for(y = 0; y < this.height; y++){
			if(this.map[x][y] == '#'){
				tally = 0;
				for(dx = -1; dx <= 1; dx++){
					for(dy = -1; dy <= 1; dy++){
						if(dx == 0 && dy == 0) continue;
						if(x + dx >= 0 && x + dx < this.width && y + dy >= 0 && y + dy < this.height){
							if(this.map[x + dx][y + dy] != ' ') tally++;
						}
					}
				}
				if(tally <= 3){
					this.map[x][y] = ' ';
				}
			}
		}
	}

	upRoom = -1; // <-- affects logic in stairdown below.

	// were stairs up/down requested?
	if(this.stairup){
		// first see if we can find a middle-of-room that fits
		offset = Math.floor(Math.random() * rooms.length);
		for(uR = 0; uR < rooms.length; uR++){
			upRoom = (uR + offset) % rooms.length;
			goodSpot = 1;
			// check to see if it's got a one-block clearance from other objects 
			for(x = rooms[upRoom].x - 1; y <= rooms[upRoom].x + 1 && goodSpot; x++){
				for(y = rooms[upRoom].y - 1; y <= rooms[upRoom].y + 1 && goodSpot; y++){
					if(this.map[x][y] != '.'){
						goodSpot = 0;
					}
				}
			}
			if(goodSpot){
				// found one!
				break;
			}
		}

		if(goodSpot){
			this.map[rooms[upRoom].x][rooms[upRoom].y] = '<';
		}else{
			// fuck it then, go for any existing floor cell
			this.changeRandomCellFrom('.', '<', this.map);
		}
	}



	if(this.stairdown){
		// first see if we can find a middle-of-room that fits and isn't taken for the stair up
		offset = Math.floor(Math.random() * rooms.length);
		for(dR = 0; dR < rooms.length; dR++){
			downRoom = (dR + offset) % rooms.length;
			if(downRoom == upRoom) continue;
			goodSpot = 1;
			// check to see if it's got a one-block clearance from other objects 
			for(x = rooms[downRoom].x - 1; y <= rooms[downRoom].x + 1 && goodSpot; x++){
				for(y = rooms[downRoom].y - 1; y <= rooms[downRoom].y + 1 && goodSpot; y++){
					if(this.map[x][y] != '.'){
						goodSpot = 0;
					}
				}
			}
			if(goodSpot){
				// found one!
				break;
			}
		}

		if(goodSpot){
			this.map[rooms[downRoom].x][rooms[downRoom].y] = '>';
		}else{
			// fuck it then, go for any existing floor cell
			this.changeRandomCellFrom('.', '>', this.map);
		}

	}
	return this.map;

}

mapBuilder.prototype.encloseWithBricks = function(){
	// now we surround the rooms with brick
	for(x = 1; x < this.width - 1; x++){
		for(y = 1; y < this.height - 1; y++){
			if(this.map[x][y] == "."){
				for(dx = -1; dx <= 1; dx++){
					for(dy = -1; dy <= 1; dy++){
						if(this.map[x + dx][y + dy] == ' '){
							this.map[x + dx][y + dy] = '#';
						}
					}
				}
			}
		}
	}

	// make sure the edge of the room is enclosed
	for(x = 0; x < this.width; x++){
		if(this.map[x][0] == '.'){
			this.map[x][0] = '#';
		}
		if(this.map[x][this.height - 1] == '.'){
			this.map[x][this.height - 1] = '#';
		}
	}
	for(y = 0; y < this.height; y++){
		if(this.map[0][y] == '.'){
			this.map[0][y] = '#';
		}
		if(this.map[this.width - 1][y] == '.'){
			this.map[this.width - 1][y] = '#';
		}
	}
}

// changes a random character on the map of the value from, to the value to.
// Returns true if successful, false otherwise
mapBuilder.prototype.changeRandomCellFrom = function(from, to, map){
	var width = this.map.length;
	var height = this.map[0].length;
	var rval = false;

	var x = Math.round(Math.random() * width);
	var y = Math.round(Math.random() * height);
	for(var tally = 0; tally < width * height; tally++){
		if(this.map[x][y] == from) break;
		x = (x + 1) % width;
		if(!x) y = (y + 1) % height;
	}

	if(this.map[x][y] == from){
		this.map[x][y] = to;
		rval = true;
	}
	return rval;
};

// Render a forst terrain
mapBuilder.prototype.buildForest = function(){

	this.readParams.apply(this, arguments);

	var area = this.width * this.height;
	this.map = this.makeEmptyMap();


	// ok, we have our empty map, now let's do the dirty business!
	var gridStep = Math.round(Math.pow(area, .125));

	var xGrid = Math.floor(this.width / gridStep);
	var yGrid = Math.floor(this.height / gridStep);
	var x, y, dx, dy;

	for(x = 0; x < xGrid; x++){
		for(y = 0; y < yGrid; y++){
			if(!Math.floor(Math.random() * gridStep)){
				for(dx = 0; dx < gridStep; dx++){
					for(dy = 0; dy < gridStep; dy++){
						this.map[x * gridStep + dx][y * gridStep + dy] = "T";
					}
				}
			}
		}
	}

	// let's run the game of life on it to give it a more chaotic look
	this.life(5, 'T');
	return this.map;
}

// Render a swamp terrain
mapBuilder.prototype.buildSwamp = function(){

	this.readParams.apply(this, arguments);

	var area = this.width * this.height;
	this.map = this.makeEmptyMap();


	// ok, we have our empty map, now let's do the dirty business!
	var gridStep = Math.round(Math.pow(area, .125));

	var xGrid = Math.floor(this.width / gridStep);
	var yGrid = Math.floor(this.height / gridStep);
	var x, y, dx, dy, drawchar, chance;
	
	var totalChance = this.treeChance + this.waterChance + this.reedChance;

	for(x = 0; x < xGrid; x++){
		for(y = 0; y < yGrid; y++){
			if(!Math.floor(Math.random() * gridStep / 2)){
				chance = Math.floor(Math.random() * totalChance);
				if(chance < this.treeChance){
					drawchar = 'T';
				}else if(chance < this.treeChance + this.waterChance){
					drawchar = '=';
				}else{
					drawchar = '"';
				}
				for(dx = 0; dx < gridStep; dx++){
					for(dy = 0; dy < gridStep; dy++){
						this.map[x * gridStep + dx][y * gridStep + dy] = drawchar;
					}
				}
			}
		}
	}

	// let's run the game of life on it to give it a more chaotic look
	this.life(4, '.');
	return this.map;
}

// a competetive version of the game of life, which allows competing life forms
mapBuilder.prototype.life = function(iterations, deadchar){
	var newMap = this.makeEmptyMap(this.map.length, this.map[0].length);
	var x, y, dx, dy, tally, rx, ry, n, charval;
	for(n = 0; n < iterations; n++){
		for(x = 0; x < this.map.length; x++){
			for(y = 0; y < this.map[x].length; y++){
				tally = Array();
				for(dx = -1; dx <= 1; dx++){
					for(dy = -1; dy <= 1; dy++){
						if(dx == 0 && dy == 0) continue;
						rx = (x + dx + this.map.length) % this.map.length;
						ry = (y + dy + this.map[rx].length) % this.map[rx].length;

						charval = this.map[rx][ry];
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

		for(x = 0; x < this.map.length; x++){
			for(y = 0; y < this.map[x].length; y++){
				this.map[x][y] = newMap[x][y];
			}
		}
	}
	return this.map;
}

// initialize a clean map of the specified dimensions.
mapBuilder.prototype.makeEmptyMap = function (width, height, fillchar){
	if(width == undefined) width = this.width;
	if(height == undefined) height = this.height;
	if(fillchar == undefined) fillchar = ' ';
	var newmap = Array();
	for(var n = 0; n < width; n++){
		newmap[n] = Array.apply(null, Array(height)).map(String.prototype.valueOf, fillchar);
	}
	return newmap;
};
