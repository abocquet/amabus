<?php

	require("Ligne.class.php");

	class Trajet
	{
		private $id ;
		private $lignes ;

		function __construct($id)
		{
			$this->id = $id ;
			$this->lignes = array() ;
		}

		function getId()
		{
			return $this->id ;
		}

	}