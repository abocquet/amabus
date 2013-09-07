<?php

	class Ligne
	{
		private $name ;
		private $arret ;
		private $horaires ;
		private $direction ;

		function __construct($name, $direction, $arret)
		{
			$this->name = (string) $name ;
			$this->direction = (string) $direction ;
			$this->arret = (string) $arret ;

			$this->horaires = array() ;
		}

		function addHoraire($horaire)
		{
			$this->horaires[] = (string) $horaire ;
		}

		function getHoraires()
		{
			return $this->horaires ;
		}

		function getName()
		{
			return $this->name ;
		}

		function getArret()
		{
			return $this->arret ;
		}

		function getDirection()
		{
			return $this->direction ;
		}
	}