<?php

	require_once("facebook/facebook.php");

	function getFbUser(){
		$facebook = new Facebook(array(
			'appId'  => 'app_id',
			'secret' => 'secr3t'
		));

		$user = $facebook->getUser();

		if ($user) {
			try {
				// Proceed knowing you have a logged in user who's authenticated.
				$user_profile = $facebook->api('/me');

				if($user_profile['verified']){
					return $user_profile ;
				} else {
					die("-2:  Votre compte Facebook n'a pas encore été activé") ;
				}

			} catch (FacebookApiException $e) {
				die("-2: FacebookApiException " . $e) ;
		  	}
		}

		return false ;
	}

	$user = getFbUser();

	function bddConnect(){

		try
		{
			return new PDO('mysql:host=localhost;dbname=', '', '');
		}
		catch (Exception $e)
		{
			die('Erreur : ' . $e->getMessage());
		}
	}

	function persistFavoris($user, $list){

		$bdd = bddConnect();

		$req = $bdd->prepare("SELECT * FROM users WHERE fb_id = ?") ;
		$req->execute(array($user['id']));

		if($req->fetch())
		{
			$up = $bdd->prepare("UPDATE users SET name = :name, email = :email, time = :time, favoris = :favoris WHERE fb_id = :fb_id");
			$up->execute(array(

				"fb_id"   => $user['id'],
				"name"    => $user['name'],
				"email"   => $user['email'],
				"time"    => $list['age'],
				"favoris" => $list['favoris']

			));
		}
		else
		{
			$add = $bdd->prepare("INSERT INTO users(fb_id, name, email, time, favoris) VALUES(:fb_id, :name, :email, :time, :favoris)") ;
			$add->execute(array(

				"fb_id"   => $user['id'],
				"name"    => $user['name'],
				"email"   => $user['email'],
				"time"    => $list['age'],
				"favoris" => $list['favoris']

			));
		}
	}
	
	function bindUpload(){
		//On commence par regarder si la requete est bonne
		if(isset($_POST["favoris"]) && !empty($_POST["favoris"])){
			$all = json_decode($_POST["favoris"], true);

			if(json_last_error() !== JSON_ERROR_NONE)
			{
				die("-1 Json error " . json_last_error());
			}

			$timestamp = (int) $all["timestamp"];
			$favoris = json_encode($all, true);

			if($timestamp > 0 && !empty($favoris))
			{
				return array(

					"age" => $timestamp,
					"favoris" => $favoris

				);
			}
		}
		return false ;
	}

	$list = bindUpload();

	function bindDownload(){

		if(isset($_GET['time']) && !empty($_GET['time']))
		{
			return (int) $_GET['time'];
		}
		else
		{
			return false ;
		}
	}

	function getFavoris($user){

		$bdd = bddConnect();

		$req = $bdd->prepare("SELECT * FROM users WHERE fb_id = ?") ;
		$req->execute(array($user['id']));

		return $req->fetch();
	}

	$timestamp = bindDownload();

	if($user && $list)
	{
		persistFavoris($user, $list);
		echo 1 ;
		return 1 ;
	}
	else if($user && ($timestamp+1))
	{
		$user = getFavoris($user);

		if($user['time'] > $timestamp)
		{
			echo $user['favoris'];
		} else {
			echo 2 ;
		}
	}
	else
	{
		echo -1 ;
		return -1 ;
	}

?>