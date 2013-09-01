<?php

	require('Ligne.class.php');

	if(!(isset($_GET['lng']) && !empty($_GET['lng']) && isset($_GET['lat']) && !empty($_GET['lat']) 
	&& isset($_GET['tLng']) && !empty($_GET['tLng']) && isset($_GET['tLat']) && !empty($_GET['tLat'])))
	{
		echo "Parameters does not match";
		echo "<pre>";
		print_r($_GET);
		echo "</pre>";

		return -1 ;
	}

	$conf = array(
		"key" => "VOTRE CLÉ D'API",
		"mode" => "transit",
		"depType" => "7",
		"depLon" => (double) $_GET['lng'],
		"depLat" => (double) $_GET['lat'],
		"arrType" => "7",
		"arrLon" => (double) $_GET['tLng'],
		"arrLat" => (double) $_GET['tLat'],
		"departureTime" => date("Y-m-d_H-i"),
		"optimize" => "lessChanges",
		"transitModes" => "11111101000000101110"
	);

	$url = "http://dev.itinisere.fr/api/tripplanner/v1/plantrip/xml?";

	foreach ($conf as $key => $value) {

		$url .= "&" . $key . "=" . $value ;
	}


	$xml = simplexml_load_file($url);

	// header("content-type: application/xml");
	// echo $xml->asXML();

	$children = $xml->children();

	if($children[0]->code != 0)
	{
		echo "Erreur de planification : " . $xml->Status->description ;
		return -1 ;
	}

	$itineraires = array();

	for ($i=1; $i < count($children) ; $i++) { 

		$id = $children[$i]->interchangeNumber * count($children[$i]->tripSegments->children()) ;

		if(!isset($itineraires[$id]))
		{
			$itineraires[$id] = array();
		}

		$y = 0 ;
		foreach($children[$i]->tripSegments->children() as $tripSegment)
		{
			if($tripSegment->type == "TRANSPORT")
			{
				if(!isset($itineraires[$id][$y]))
				{
					$itineraires[$id][$y] = new Ligne($tripSegment->line->number, $tripSegment->directionName, $tripSegment->departurePoint->name);
				}

				$itineraires[$id][$y]->addHoraire($tripSegment->departureTime);
			}
			$y++ ;
		}

	}

?>


<?php 
	$first = false ;

	foreach($itineraires as $itineraire):

	if($first)
	{
		echo "<p>Ou bien:</p>" ;
	}
	else
	{
		$first = true ;
	}

		foreach($itineraire as $ligne):
?>
<div>
	<h5><?php echo $ligne->getName() ?></h5>
	<h6>En partant de <?php echo strtolower($ligne->getArret()) ; ?></h6>
	<h6>Vers <?php echo strtolower($ligne->getDirection()) ; ?></h6>

	<p>
		<?php 
			$horaires = $ligne->getHoraires();

			for($i = 0, $c = count($horaires) ; $i < $c ; $i++) {

				echo $horaires[$i];
				if($i != $c -1)
				{
					echo ' - ' ;
				}

			}
		?>
	</p>

</div>

<?php
	
		endforeach ;

	endforeach ;

?>

