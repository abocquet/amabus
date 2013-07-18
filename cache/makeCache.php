<?php
	$listeTemplates = array();
	$directory = "../templates/" ;

	$listeFichiers = scandir($directory) ;

	foreach($listeFichiers as $key => $fileName)
	{
		if(strrchr($fileName,'.') == ".html")
		{	
			$fileNameNExt = substr($fileName, 0,  strpos($fileName, '.')); 
			$listeTemplates[$fileNameNExt] = file_get_contents($directory . $fileName);
		}
	}

	file_put_contents("templates.json", json_encode($listeTemplates));
?>