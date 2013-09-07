<?php

	require_once("facebook.php");

	$config = array();
	$config['appId'] = '673004596045448';
	$config['secret'] = '557955873c7eb2cdfdf37c2e66fa33d4';

	$facebook = new Facebook($config);

	$user = $facebook->getUser();

	if ($user) {
		try {
			$user_profile = $facebook->api('/me');
		} catch (FacebookApiException $e) {
			$user = null;
		}
	}

	//id - username - email


	if ($user) {
		echo "connecté !" ;
	} else {
		echo "vous n'êtes pas connecté" ;
	}

?>