<?php
	if(array_key_exists('phpbuild', $_GET)){
		if(!array_key_exists('category', $_GET)){
			throw new Exception("No map category specified");
		}
		if(!in_array($_GET['category'], array('dungeon', 'forest', 'swamp'))){
		}



		include("generator.php");

		$size = rand() % 60;
		
		switch($_GET['category']){
			case 'dungeon':
				$map = buildDungeon(array(
					'width' => 30 + $size, 
					'height' => 30 + $size,
					'stairdown' => true,
					'stairup' => true
					//'roomscale' => .6
				));
				break;
			case 'swamp':
				$map = buildSwamp(array(
					'width' => 30 + $size, 
					'height' => 30 + $size
				));
				break;
			case 'forest':
				$map = buildForest(array(
					'width' => 30 + $size, 
					'height' => 30 + $size
				));
				break;
			default:
				throw new Exception("Invalid map type specified");

		}


		for($y = 0; $y < count($map[0]); $y++){
			for($x = 0; $x < count($map); $x++){
				echo $map[$x][$y];
			}
			echo "\n";
		}
		echo "\n";
		exit;
	}
?>
<html>
<head>
        <link href='http://fonts.googleapis.com/css?family=Press+Start+2P&subset=latin,latin-ext' rel='stylesheet' type='text/css'>
	<style type="text/css">
		body{
			text-align:center;
		}

		#mapContent{
			font-family: 'Press Start 2P', cursive;
			line-height; 10px;
			font-size: 8px;
		}
	</style>
	<script type="text/javascript" src="jquery.min.js"></script>
	<script type="text/javascript" src="generator.js"></script>
	<script type="text/javascript">
		function phpBuild(category){
			$('#mapContent').load('index.php?phpbuild&category=' + category);
		}

		function jsBuild(mapType){
			var size = Math.floor(Math.random() * 60);
			switch(mapType){
				case 'dungeon':
					map = buildDungeon({
						'width' : 30 + size, 
						'height' : 30 + size,
						'stairdown' : true,
						'stairup' : true/*,
						'roomscale' : .6,
						'gridscale' : 1*/
					})
					break;
				case 'swamp':
					map = buildSwamp({
						'width' : 30 + size, 
						'height' : 30 + size
					});
					break;
				case 'forest':
					map = buildForest({
						'width' : 30 + size, 
						'height' : 30 + size
					});
					break;
				default:
					alert('Invalid map type');
					map = [];
			}

			var lineStr;
			$('#mapContent').html('');
			for(var y = 0; y < map[0].length; y++){
				lineStr = "";
				for(var x = 0; x < map.length; x++){
					lineStr += map[x][y];
				}
				$('#mapContent').append(lineStr + "\n");
			}
		}
	</script>
</head>
<body>
	<button onclick="phpBuild('dungeon');">PHP Dungeon</button>
	<button onclick="phpBuild('forest');">PHP Forest</button>
	<button onclick="phpBuild('swamp');">PHP Swamp</button>
	<button onclick="jsBuild('dungeon');">JS Dungeon</button>
	<button onclick="jsBuild('forest');">JS Forest</button>
	<button onclick="jsBuild('swamp');">JS Swamp</button>
	<pre id="mapContent">
</pre>
</body>
</html>

