<html>
<body>
<pre style="line-height: .5em">
<?php
	include("generator.php");
	//for($n = 0; $n < 100; $n++){
		$size = rand() % 60;
		$map = buildDungeon(array(
			'width' => 40 + $size, 
			'height' => 40 + $size,
			'stairdown' => true,
			'stairup' => true,
			//'roomscale' => .6
		));
		for($y = 0; $y < count($map[0]); $y++){
			for($x = 0; $x < count($map); $x++){
				echo $map[$x][$y];
			}
			echo "\n";
		}
		echo "\n";
	//}
?>
</pre>
</body>
</html>
