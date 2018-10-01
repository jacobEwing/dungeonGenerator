<?php
	if(array_key_exists('getPHPDungeon', $_GET)){
		include("generator.php");
		$size = rand() % 60;
		$map = buildDungeon(array(
			'width' => 40 + $size, 
			'height' => 40 + $size,
			'stairdown' => true,
			'stairup' => true
			//'roomscale' => .6
		));
		for($y = 0; $y < count($map[0]); $y++){
			for($x = 0; $x < count($map); $x++){
				echo $map[$x][$y];
			}
			echo "\n";
		}
		echo "\n";
		exit;
	}

	if(array_key_exists('getPHPForest', $_GET)){
		include("generator.php");
		$size = rand() % 60;
		$map = buildForest(array(
			'width' => 40 + $size,
			'height' => 40 + $size
		));
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
	<script type="text/javascript" src="jquery.min.js"></script>
	<script type="text/javascript" src="generator.js"></script>
	<script type="text/javascript">
		function phpDungeon(){
			$('#mapContent').load('index.php?getPHPDungeon');
		}

		function phpForest(){
			$('#mapContent').load('index.php?getPHPForest');
		}

		function jsForest(){
			var size = Math.floor(Math.random() * 60);
			map = buildForest({
				'width' : 40 + size, 
				'height' : 40 + size
			});
			var lineStr;
			$('#mapContent').html('');
			for(var y = 0; y < map.length; y++){
				lineStr = "";
				for(var x = 0; x < map[y].length; x++){
					lineStr += map[x][y];
				}
				$('#mapContent').append(lineStr + "\n");
			}
		}

		function jsDungeon(){
			//$('#mapContent').load('index.php?getPHPMap');
			var size = Math.floor(Math.random() * 60);
			map = buildDungeon({
				'width' : 40 + size, 
				'height' : 40 + size,
				'stairdown' : true,
				'stairup' : true
				//'roomscale' : 1
			});
			var lineStr;
			$('#mapContent').html('');
			for(var y = 0; y < map.length; y++){
				lineStr = "";
				for(var x = 0; x < map[y].length; x++){
					lineStr += map[x][y];
				}
				$('#mapContent').append(lineStr + "\n");
			}
		}
	</script>
</head>
<body>
	<button onclick="phpDungeon();">PHP Dungeon</button>
	<button onclick="phpForest();">PHP Forest</button>
	<button onclick="jsDungeon();">JS Dungeon</button>
	<button onclick="jsForest();">JS Forest</button>
	<pre style="line-height: .5em" id="mapContent">
</pre>
</body>
</html>
