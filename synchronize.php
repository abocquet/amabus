<?php

	if(isset($_POST["favoris"]) && !empty($_POST["favoris"]))
	{
		$all = json_decode($_POST["favoris"], true);

		if(json_last_error() != "JSON_ERROR_NONE")
		{
			echo -1 ;
			return -1;
		}

		$timestamp = $all["timestamp"];
		$favoris = json_encode($all["list"], true);

		
		
	}

?>