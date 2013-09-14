document.body.onload = function(){
	/**
	 *	role -> permet la suppression aisée d'un élément dans un array
	 *
	 *	GET @mixed: val -> référence de l'élément à supprimer
	 *  Returns: none
	 */

	Array.prototype.unset = function(val){

		var index = this.indexOf(val);
		if(index > -1)
		{
			this.splice(index,1);
		}
	};

	/**
	 *	role -> retourne le prochain frère de l'élément spécifié du type DOM spécifié
	 *
	 *	GET @string : tag -> name of the tag
	 *		@HTMLElement : element -> currentChild
	 *  Returns: @HTMLElement
	 */

	function giveNextTag(tag, element){

		tag = tag.toUpperCase() ;
		do { element = element.nextElementSibling ; }
		while(element.tagName != tag);

		return element ;
	}

	//On survient d'abord aux besions en Google Map
	google.maps.visualRefresh = true ;

	// Balancage massif de purée de Brocolis+pommes+liqueure de frelons
	var app = {


	};
};