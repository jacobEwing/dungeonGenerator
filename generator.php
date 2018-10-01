<?php
/* this is a simple chunk of code for generating terrain types, which should
 * vary depending on circumstance.  For instance "dungeon" would be different
 * from "cave", "city", "castle", etc.  We'll start with dungeon. */
class roomClass{
	public $x1, $y1, $x2, $y2;

	public function setArea($x, $y, $gridStep, $zoom){
		$gridStep = abs($gridStep);
		$zoom = abs($zoom);
		$x += .5;
		$y += .5;

		$this->x = $x * $gridStep;
		$this->y = $y * $gridStep;
		$this->x1 = $x * $gridStep - $gridStep * $zoom;
		$this->x2 = $x * $gridStep + $gridStep * $zoom - 1;
		$this->y1 = $y * $gridStep - $gridStep * $zoom;
		$this->y2 = $y * $gridStep + $gridStep * $zoom - 1;

		$minSize = 3;
		$dx = $this->x2 - $this->x1;
		if($dx < $minSize){
			$this->x1 = $this->x2 - $minSize;
			if($this->x1 < 0){
				$this->x2 -= $this->x1;
				$this->x1 = 0;
			}
		}

		$dy = $this->y2 - $this->y1;
		if($dy < $minSize){
			$this->y1 = $this->y2 - $minSize;
			if($this->y1 < 0){
				$this->y2 -= $this->y1;
				$this->y1 = 0;
			}
		}
	}
}

function buildDungeon($params){
	if(!is_array($params)){
		throw new Exception("buildDungeon expects one argument of type array");
	}
	$requiredParams = array(
		'width',
		'height'
	);

	$optionalParams = array(
		'stairup' => false,
		'stairdown' => false,
		'roomscale' => .6 + (rand() % 400) / 1000,
		'gridscale' => .75 + (rand() % 500) / 1000
	);

	foreach($requiredParams as $param){
		if(!array_key_exists($param, $params)){
			throw new Exception("buildDungeon required parameter \"" . $param . "\" not provided.");
		}
		$$param = $params[$param];
	}

	foreach($optionalParams as $param => $defaultval){
		if(array_key_exists($param, $params)){
			$$param = $params[$param];
		}else{
			$$param = $defaultval;
		}
	}

	if(!is_integer($width) || $width < 3){
		throw new Exception("buildDungeon: Invaid width parameter:" . $width);
	}

	if(!is_integer($height) || $height < 3){
		throw new Exception("buildDungeon: Invaid height parameter" . $height);
	}

	$area = $width * $height;

	$map = makeEmptyMap($width, $height);

	// ok, we have our empty map, now let's do the dirty business!

	// first we build a few basic rooms
	$gridStep = round($gridscale * pow($area, 1/4));
	
	$xGrid = floor($width / $gridStep);
	$yGrid = floor($height / $gridStep);

	$rooms = [];
	$hypsq = $xGrid * $xGrid + $yGrid * $yGrid;
	for($attemptTally = 0; count($rooms) < 3 && ($attemptTally < 1000 || count($rooms) == 0); $attemptTally++){
		for($x = 0; $x < $xGrid; $x ++){
			for($y = 0; $y < $yGrid; $y++){

				$dx = ($width >> 1) - $x * $gridStep;
				$dy = ($height >> 1) - $y * $gridStep;
				if($dx * $dx + $dy * $dy > $hypsq * $gridStep * .8) continue;
				
				// edit this zoom and the if condition to change the varying size of the rooms
				$zoom =  $roomscale * (rand() % 700 + 300) / 1000;
				if(rand() % $gridStep < $gridStep * $zoom){
					$room = new roomClass();
					$room->setArea($x, $y, $gridStep, $zoom);
					$rooms[] = $room;

					for($dx = $room->x1; $dx <= $room->x2; $dx++){
						for($dy = $room->y1; $dy <= $room->y2; $dy++){
							if($dx >= 0 && $dx < $width && $dy >= 0 && $dy < $height){
								$map[$dx][$dy] = ".";
							}
							
						}
					}
				}
			}
		}
	}
	$numRooms = count($rooms);

	// now connect them with hallways	
	$connectedRooms = array(rand() % $numRooms);
	for($n = 0; $n < $numRooms; $n++){
		if(in_array($n, $connectedRooms)) continue;
		$minDist = null;
		$nearestIndex = null;
		for($m = 0; $m < count($connectedRooms); $m++){
			$dist = hypot($rooms[$n]->x - $rooms[$connectedRooms[$m]]->x, $rooms[$n]->y - $rooms[$connectedRooms[$m]]->y);
			if($minDist === null || $dist < $minDist){
				$minDist = $dist;
				$nearestIndex = $connectedRooms[$m];
			}
		}
		$connectedRooms[] = $n;
		$dx = $rooms[$nearestIndex]->x - $rooms[$n]->x;
		$dy = $rooms[$nearestIndex]->y - $rooms[$n]->y;

		$ix = $dx == 0 ? 0 : ($dx < 0 ? -1 : 1);
		$iy = $dy == 0 ? 0 : ($dy < 0 ? -1 : 1);

		if(abs($dx) > abs($dy)){
			for($x = $rooms[$n]->x; $x != $rooms[$nearestIndex]->x; $x += $ix){
				$map[$x][$rooms[$n]->y] = '.';
			}
			for($y = $rooms[$n]->y; $y != $rooms[$nearestIndex]->y; $y += $iy){
				$map[$x][$y] = '.';
			}
		}else{
			for($y = $rooms[$n]->y; $y != $rooms[$nearestIndex]->y; $y += $iy){
				$map[$rooms[$n]->x][$y] = '.';
			}
			for($x = $rooms[$n]->x; $x != $rooms[$nearestIndex]->x; $x += $ix){
				$map[$x][$y] = '.';
			}
		}
	}
	// now we surround the rooms with brick
	for($x = 1; $x < $width - 1; $x++){
		for($y = 1; $y < $height - 1; $y++){
			if($map[$x][$y] == "."){
				for($dx = -1; $dx <= 1; $dx++){
					for($dy = -1; $dy <= 1; $dy++){
						if($map[$x + $dx][$y + $dy] == ' '){
							$map[$x + $dx][$y + $dy] = '#';
						}
					}
				}
			}
		}
	}
	// make sure the edge of the room is enclosed
	for($x = 0; $x < $width; $x++){
		if($map[$x][0] == '.'){
			$map[$x][0] = '#';
		}
		if($map[$x][$height - 1] == '.'){
			$map[$x][$height - 1] = '#';
		}
	}
	for($y = 0; $y < $height; $y++){
		if($map[0][$y] == '.'){
			$map[0][$y] = '#';
		}
		if($map[$width - 1][$y] == '.'){
			$map[$width - 1][$y] = '#';
		}
	}
	// scrub any trailing walls caused by the code above
	for($x = 0; $x < $width; $x++){
		for($y = 0; $y < $height; $y++){
			if($map[$x][$y] == '#'){
				$tally = 0;
				for($dx = -1; $dx <= 1; $dx++){
					for($dy = -1; $dy <= 1; $dy++){
						if($dx == 0 && $dy == 0) continue;
						if($x + $dx >= 0 && $x + $dx < $width && $y + $dy >= 0 && $y + $dy < $height){
							if($map[$x + $dx][$y + $dy] != ' ') $tally++;
						}
					}
				}
				if($tally <= 3){
					$map[$x][$y] = ' ';
				}
			}
		}
	}
	// were stairs up/down requested?
	if($stairup){
		$tally = rand() % ($width * $height) + 100;
		while($tally > 0){
			for($x = 0; $x < $width && $tally > 0; $x += $tally != 0){
				for($y = 0; $y < $height && $tally > 0; $y += $tally != 0){
					if($map[$x][$y] == '.'){
						$tally --;
					}
				}
			}
		}
		$map[$x][$y] = '<';
	}
	if($stairdown){
		$tally = rand() % ($width * $height) + 100;
		while($tally > 0){
			for($x = 0; $x < $width && $tally > 0; $x += $tally != 0){
				for($y = 0; $y < $height && $tally > 0; $y += $tally != 0){
					if($map[$x][$y] == '.'){
						$tally --;
					}
				}
			}
		}
		$map[$x][$y] = '>';
	}
	return $map;

}

// Render a forest terrain
function buildForest($params){
	if(!is_array($params)){
		throw new Exception("buildTrees expects one argument of type array");
	}
	$requiredParams = array(
		'width',
		'height'
	);

	$optionalParams = array(
		'this_is_just_a_place_holder'
	);

	foreach($requiredParams as $param){
		if(!array_key_exists($param, $params)){
			throw new Exception("buildTrees required parameter \"" . $param . "\" not provided.");
		}
		$$param = $params[$param];
	}

	if(!is_integer($width) || $width < 3){
		throw new Exception("buildTrees: Invaid width parameter:" . $width);
	}

	if(!is_integer($height) || $height < 3){
		throw new Exception("buildTrees: Invaid height parameter" . $height);
	}

	$area = $width * $height;

	$map = array();
	for($n = 0; $n < $width; $n++){
		$map[$n] = array_fill(0, $height, '.');
	}


	// ok, we have our empty map, now let's do the dirty business!
	$gridStep = round(pow($area, .125));
	
	$xGrid = floor($width / $gridStep);
	$yGrid = floor($height / $gridStep);
	
	for($x = 0; $x < $xGrid; $x ++){
		for($y = 0; $y < $yGrid; $y++){
			if(!(rand() % ($gridStep))){

				for($dx = 0; $dx < $gridStep; $dx++){
					for($dy = 0; $dy < $gridStep; $dy++){
						$map[$x * $gridStep + $dx][$y * $gridStep + $dy] = "T";
					}
				}
			}
		}
	}
	$map = life($map, 5, 'T');
	return $map;
}

// Render a swamp terrain
function buildSwamp($params){
	if(!is_array($params)){
		throw new Exception("buildSwamp expects one argument of type array");
	}
	$requiredParams = array(
		'width',
		'height'
	);

	// no need for these to add up to 100 - chance is calculated from their sum
	$optionalParams = array(
		'treeChance' => 10,
		'waterChance' => 15,
		'reedChance' => 85
	);

	foreach($requiredParams as $param){
		if(!array_key_exists($param, $params)){
			throw new Exception("buildSwamp required parameter \"" . $param . "\" not provided.");
		}
		$$param = $params[$param];
	}

	foreach($optionalParams as $param => $defaultval){
		if(array_key_exists($param, $params)){
			$$param = $params[$param];
		}else{
			$$param = $defaultval;
		}
	}
	$totalChance = $treeChance + $waterChance + $reedChance;

	if(!is_integer($width) || $width < 3){
		throw new Exception("buildSwamp: Invaid width parameter:" . $width);
	}

	if(!is_integer($height) || $height < 3){
		throw new Exception("buildSwamp: Invaid height parameter" . $height);
	}

	$area = $width * $height;

	$map = array();
	for($n = 0; $n < $width; $n++){
		$map[$n] = array_fill(0, $height, '.');
	}


	// ok, we have our empty map, now let's do the dirty business!
	$gridStep = round(pow($area, .125));
	
	$xGrid = floor($width / $gridStep);
	$yGrid = floor($height / $gridStep);
	
	for($x = 0; $x < $xGrid; $x ++){
		for($y = 0; $y < $yGrid; $y++){
			if(rand() % ($gridStep)){
				$chance = rand() % $totalChance;
				if($chance < $treeChance){
					$drawchar = 'T';
				}else if($chance < $treeChance + $waterChance){
					$drawchar = '=';
				}else{
					$drawchar = '"';
				}
				$drawchar = $chance < 5 ? 'T' : ($chance < 15 ? '=' : '"');
				for($dx = 0; $dx < $gridStep; $dx++){
					for($dy = 0; $dy < $gridStep; $dy++){
						$map[$x * $gridStep + $dx][$y * $gridStep + $dy] = $drawchar;
					}
				}
			}
		}
	}
	$map = life($map, 4, '.');
	return $map;
}

// a competetive version of the game of life, which allows competing life forms
function life($map, $iterations, $deadchar){
	$newMap = makeEmptyMap(count($map), count($map[0]));
	for($n = 0; $n < $iterations; $n++){
		for($x = 0; $x < count($map); $x++){
			for($y = 0; $y < count($map); $y++){
				$tally = array();
				for($dx = -1; $dx <= 1; $dx++){
					for($dy = -1; $dy <= 1; $dy++){
						if($dx == 0 && $dy == 0) continue;
						$rx = ($x + $dx + count($map)) % count($map);
						$ry = ($y + $dy + count($map[$rx])) % count($map[$rx]);

						$charval = $map[$rx][$ry];
						if(!array_key_exists($charval, $tally)){
							$tally[$charval] = 1;
						}else{
							$tally[$charval]++;
						}
					}
				}
				$bestTally = -1;
				foreach($tally as $m => $sum){
					if($sum > 1 && $sum < 4){
						if($bestTally == -1 || $tally[$bestTally] < $sum){
							$bestTally = $m;
						}
					}
				}
				if($bestTally != -1){
					$newMap[$x][$y] = $bestTally;
				}else{
					$newMap[$x][$y] = $deadchar;
				}
			}
		}
		$map = $newMap;
	}
	return $map;
}

// initialize a clean map of the specified dimensions.
function makeEmptyMap($width, $height){
	$map = array();
	for($n = 0; $n < $width; $n++){
		$map[$n] = array_fill(0, $height, ' ');
	}
	return $map;
}
