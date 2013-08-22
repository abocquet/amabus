function d(agr)
{
	console.log(agr);
}

document.body.onload = function(){

	/**
	 *	role -> permet la suppression aisée d'un élément dans un array
	 *
	 *	GET @mixed: val -> référence de l'élément à supprimer
	 *  Returns: none
	 */

	Array.prototype.unset = function(val){

		val.effacer();

		var index = this.indexOf(val);
		if(index > -1)
		{
			this.splice(index,1);
		}
	};

	// Pour éviter de se retaper le code à chaque fois 
	api = {
		ajx : {

			getJSON : function(chemin, fonction){
				return this.getFile(chemin, function(response){
					return JSON.parse(response);
				});
			},

			getFile : function(chemin, fonction)
			{
				var xhr = new XMLHttpRequest();
				xhr.open('GET', chemin);
				xhr.setRequestHeader("X-Requested-With","XMLHttpRequest");

				xhr.onreadystatechange = function(){
					if (xhr.readyState == 4 && xhr.status == 200) {
						fonction(xhr.responseText);
					}
				};
				xhr.send(); // La requête est prête, on envoie tout !
			}

		},

		geo : {

			getPosition : function(fonction, error)
			{
				if(error == undefined)
				{
					navigator.geolocation.getCurrentPosition(fonction, api.geo.displayError);
				}
				else
				{
					navigator.geolocation.getCurrentPosition(fonction, error);
				}
			},

			displayError : function(error)
			{
				switch(error.code)
				{
					case error.PERMISSION_DENIED :
						window.location = "PAGE D'EXPLICATION" ;

						break;

					case error.TIMEOUT :
						if(confirm("La localisation prend trop de temps. Voulez-vous réessayer ?"))
						{
							// GetPosition
						}
						break;

					case error.UNKNOWN_ERROR:
					case error.POSITION_UNAVAILABLE:
					default:
						alert("Une erreur s'est produite durant la localisation. Essayez de recharger la page plus tard.");
						break ;
				}
			},

			coder : new google.maps.Geocoder()
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

	function FavorisManager(container){

		//Gestion des favoris
		var that = this ;
		this.listeFavoris = [];
		this.isEditing = false ;
		this.container = container ;

		this.editButton = document.createElement("input");
			this.editButton.type = "button" ;
			this.editButton.value = "Modifier" ;
			this.editButton.className = "right" ;

			this.editButton.onclick = function()
			{

				that.isEditing = !that.isEditing ;

				if(that.isEditing)
				{
					this.value = "Terminer" ;
					this.className = "right active" ;

					for(var c = that.listeFavoris.length, i = 0 ; i < c ; i++)
					{
						that.listeFavoris[i].setEditable(true);
					}
				}
				else
				{
					this.value = "Modifier" ;
					this.className = "right" ;

					for(var c = that.listeFavoris.length, i = 0 ; i < c ; i++)
					{
						that.listeFavoris[i].setEditable(false);
					}
				}
				
			};

		this.addFavoriButton = document.createElement("input");
			this.addFavoriButton.className = "centered";
			this.addFavoriButton.type = "button" ;
			this.addFavoriButton.value = "Ajouter un lieu favori";

			this.addFavoriButton.onclick = function(){
				that.addFavori();
			};

		this.container.insertBefore(this.editButton, this.container.firstChild);
		this.container.appendChild(this.addFavoriButton);

		this.addFavori = function(){
			var fav = new Favori(this.container, this);
			fav.afficher();

			this.listeFavoris.push(fav);
			if(this.listeFavoris.length == 1){ fav.setDefault(true); }
			if(this.isEditing){ fav.setEditable(true); }

			this.serialize();
			return fav;
		};

		this.removeFavori = function(val){

			this.listeFavoris.unset(val);

			if(this.listeFavoris.length == 0){
				this.addFavori();
			}

			this.serialize() ;
		};

		//gestion de la persistance des données
		this.serialize = function(){
			var listeSerialize = [];

			for (var i = 0, c = this.listeFavoris.length ; i < c; i++) {
				listeSerialize.push(this.listeFavoris[i].serialize());
			}

			localStorage.setItem("serializedFavList", JSON.stringify(listeSerialize));
		};

		this.unserialize = function(){

			var listeUnserialize = JSON.parse(localStorage.getItem("serializedFavList"));

			for (var i = 0, c = listeUnserialize.length ; i < c; i++) {
				var fav = new Favori(this.container) ;
				fav.unserialize(listeUnserialize[i]);
				fav.afficher();

				this.listeFavoris.push(fav);

			}
		};


		/**
		 *	role -> renvoi un objet Favori dans la liste du manager d'après une vue donnée
		 *
		 *	GET: @HTMLElement: view (HTMLElement)
		 *  Returns: @Favoris
		 */

		this.VtoF = function(view){

			while(view.parentNode != this.container)
			{
				view = view.parentNode ;
			}

			var i = 0,
			//On ne commence que par le TROISIÈME enfant, le premier étant le titre, le second le bouton d'édition
			currentFav = this.container.firstElementChild.nextElementSibling.nextElementSibling ; 

			while(currentFav != view){
				i++ ;
				currentFav = currentFav.nextElementSibling ;
			}

			return this.listeFavoris[i] ;

		};
	}

	function Favori(container, manager){

		var that = this ;

		this.nom = "Nouveau lieu";
		this.isDefault = false ;

		this.isEditable = false ;
		this.isEditing = false ;

		// Les autres parametres par défaut seront déterminé par la position courante du device

		/**
		 *	role -> Définir les coordonées courantes à la création d'un favori
		 */

		/*this.rafraichirPosition = function(onSuccess){

			var error = function(){
				that.adresse = "1 place Saint Laurent, 38000 Grenoble" ;
				that.longitude = 5.7322185 ;
				that.latitude = 45.1978225 ;
			};

			api.geo.getPosition(function(position){

				that.longitude = position.coords.longitude ;
				that.latitude = position.coords.latitude ;

				api.geo.coder.geocode({'latLng': new google.maps.LatLng(that.latitude, that.longitude)}, function(results, status) {
					if (status == google.maps.GeocoderStatus.OK) {
						if (results[0]) {
							that.adresse = results[0].formatted_address ;
							that.latitude = results[0].geometry.location.jb ;
							that.longitude = results[0].geometry.location.kb ;

							onSuccess();
						} else {
							error();
						}
					} else {
						error();
					}
				});

			}, error);
		};*/

		this.adresse = "1 place Saint Laurent, 38000 Grenoble" ;
		this.longitude = 5.7322185 ;
		this.latitude = 45.1978225 ;

		this.listeIntervals = [];

		//On se sert de cette liste pour hydrater l'objet à partir des vues contenues dans le tableau
		this.listeInputs = {};

		//Gestion de toutes les vues

		this.container = document.createElement("div");
			container.insertBefore(this.container, container.lastChild);

		this.container.onclick = function()
		{
			if(that.isEditable && !that.isEditing)
			{
				that.setEditing(true);
			}
		};

		this.setEditable = function(edit){

			var label = this.static.firstChild;

			if(edit)
			{
				this.isEditable = true ;

				label.style.display = "block";
			}
			else
			{
				this.isEditable = false ;
				if(this.isEditing){ this.setEditing(false); }

				label.style.display = "none";
			}
		};

		this.setEditing = function(edit){

			if(edit)
			{
				//Tout d'abord on désactive le favori en cours d'édition
				var editingView = document.querySelector("#editing");

				if(editingView != undefined){

					Favori.manager.VtoF(editingView).setEditing(false);

				}

				//Puis on rend le nouveau favori en édition
				this.isEditing = true ;
				this.setEditable(true) ;

				if(that.dynamic == undefined){
					that.createDynamic();
					that.container.appendChild(that.dynamic);
				}

				that.container.lastChild.style.display = "block" ;
				that.container.firstChild.style.display = "none" ;
				that.container.id = "editing";
			}
			else
			{
				this.isEditing = false ;
				
				that.bind();

				that.container.lastChild.style.display = "none" ;
				that.container.firstChild.style.display = "block" ;
				that.container.id = "";
			}

		};

		this.setDefault = function(isDefault){

			this.isDefault = isDefault ;

			if(this.listeInputs.isDefault != undefined)
			{
				this.listeInputs.isDefault.checked = this.isDefault ;
			}
		};

		this.createStatic = function(onSuccess){

			this.static = document.createElement("div");
				this.static.className = "favoris" ;

				var label = document.createElement("p");
					label.textContent = "Cliquez pour modifier";
					label.className = "right" ;
					label.style.display = "none";

				var nom = document.createElement('h5');
					nom.textContent = this.nom ;

				var adresse = document.createElement("p");
					adresse.textContent = this.adresse ;

			this.static.appendChild(label);
			this.static.appendChild(nom);
			this.static.appendChild(adresse);

			onSuccess();

			// if(this.longitude == 0 && this.latitude == 0)
			// {
			//	this.rafraichirPosition(adresse);
			// }
		};

		this.createDynamic = function(){

			this.dynamic = document.createElement("div");
				this.dynamic.className = "favoris" ;

				var nom = document.createElement('input');
					nom.className = "h5";
					nom.type = "text" ;
					nom.value = this.nom ;

				var adresse = document.createElement("input");
					adresse.className = "p collapsed" ;
					adresse.type = "text";
					adresse.value = this.adresse ;

				var map = document.createElement("div");
					map.className = "map";

				var longitude = document.createElement("input");
					longitude.type = "hidden" ;
					longitude.value = this.longitude ;

				var latitude = document.createElement("input");
					latitude.type = "hidden" ;
					latitude.value = this.latitude ;

				var isDefaultContainer = document.createElement("div");
					isDefaultContainer.className = "noPadLeft" ;

					randomId = Math.random() * 10000 + this.latitude + this.longitude ;

					var isDefault = document.createElement('input');
						isDefault.type = "checkbox";
						isDefault.id = randomId ;
						isDefault.className = "isDefault" ;

						if(this.isDefault) { isDefault.checked = true ; }

						isDefault.addEventListener('click', function(e){

							var listeCheck = that.container.parentNode.querySelectorAll("input.isDefault");

							if(e.target.checked)
							{
								for (var check in listeCheck) {
									if(listeCheck[check].checked && e.target != listeCheck[check])
									{
										Favori.manager.VtoF(listeCheck[check]).setDefault(false) ;
										break ;
									}
								}
							}
							else
							{
								e.preventDefault();
							}

						}, false);

					var isDefaultLabel = document.createElement("label");
						isDefaultLabel.textContent = "Faire de ce favoris le lieu par défaut";
						isDefaultLabel.setAttribute("for", randomId) ;

					isDefaultContainer.appendChild(isDefault);
					isDefaultContainer.appendChild(isDefaultLabel);

				var deleteButton = document.createElement("input");
					deleteButton.type = "button";
					deleteButton.className = "alert centered";
					deleteButton.value = "Supprimer ce favoris";

					deleteButton.onclick = function(){

						if(confirm("Etes-vous sûr de vouloir supprimer " + that.nom + " ?"))
						{
							Favori.manager.removeFavori(that);
						}
					};

			this.dynamic.appendChild(nom);
			this.dynamic.appendChild(adresse);
			this.dynamic.appendChild(map);
			this.dynamic.appendChild(longitude);
			this.dynamic.appendChild(latitude);
			
			this.dynamic.appendChild(isDefaultContainer);
			this.dynamic.appendChild(deleteButton);

			this.listeInputs = {
				"nom": nom,
				"longitude": longitude,
				"latitude": latitude,
				"adresse": adresse,
				"isDefault": isDefault
			};

			this.addGeocodeSupport(map, adresse, latitude, longitude);//On fait cela en dernier car on a besoin des noeuds parents de certains elements

			this.dynamic.style.display = "none";
		};

		this.addGeocodeSupport = function(mapContainer, adresse, latitude, longitude){

			var center = new google.maps.LatLng(this.latitude, this.longitude);

			var map = new google.maps.Map(mapContainer,
			{
				center: center,
				zoom: 16,
				mapTypeId: google.maps.MapTypeId.ROADMAP,
				streetViewControl: false
			});

			var marker = new google.maps.Marker({

				draggable: true,
				flat: true,

				position: center,
				map: map

			});

			var boutonRecherche = document.createElement("input");
				boutonRecherche.value = "Rechercher";
				boutonRecherche.type = "button" ;
				boutonRecherche.className = "collapsed";

				adresse.parentNode.insertBefore(boutonRecherche, adresse.nextElementSibling);

			// Toutes les fonctions suivantes permettent de lancer le geocoding

			google.maps.event.addListener(marker, 'dragend', function(e){

				if(e.latLng) {
					//on applique un traitement de geocoding: coordonnées -> adresse
					var latLng = new google.maps.LatLng(e.latLng.lat(), e.latLng.lng());
					updateMap({'latLng': latLng});

				} else {
					alert("Erreur: le point n'a pu être enregistré");
				}

			});

			boutonRecherche.addEventListener('click', function(){ updateMap({'address': adresse.value}); }, false);

			adresse.addEventListener('keypress', function(e){

				if(e.keyCode == 13){
					updateMap({'address': adresse.value});
				}

			},false);

			function updateMap(options){
				api.geo.coder.geocode(options, function(results, status) {
					if (status == google.maps.GeocoderStatus.OK) {
						if (results[0]) {
							adresse.value = results[0].formatted_address ;

							console.log(results[0].geometry.location)
							latitude.value = results[0].geometry.location.mb ;
							longitude.value = results[0].geometry.location.nb ;

							map.setCenter(results[0].geometry.location);
							marker.setPosition(results[0].geometry.location);
						} else {
							alert('No results found');
						}
					} else {
						alert('Geocoder failed due to: ' + status);
					}
				});
			}
		};

		//Cette fonction hydrate la vue des champs affichés en mode static ainsi que le modèle
		this.bind = function(){

			//On hydrate d'abord le modèle

			for(var val in this.listeInputs){
				switch(this.listeInputs[val].type)
				{
					case "checkbox":
						this[val] = this.listeInputs[val].checked ;
						break ;
					default:
						this[val] = this.listeInputs[val].value ;
						break ;
				}
			}

			//Sans oublier de typer les variables
			this.latitude = parseFloat(this.latitude);
			this.longitude = parseFloat(this.longitude);

			d(this.longitude)

			//Puis on hydrate la vue
				//Le noeud du titre
				var currentElement = giveNextTag("h5", this.static.firstChild) ;
				currentElement.textContent = this.nom ;

				//Le noeud de l'adresse
				currentElement = giveNextTag("p", currentElement);
				currentElement.textContent = this.adresse ;

			Favori.manager.serialize();

		};

		//La création de la vue dynamique se fait au clic sur le bouton "modifier"
		this.afficher = function(){

			this.createStatic(function(){
				that.container.appendChild(that.static) ;
			});
		};

		this.effacer = function(){

			this.container.parentNode.removeChild(this.container);
		};

		//Gestion de la persistance des données

		this.serialize = function()
		{
			return {
				"nom": this.nom,
				"isDefault": this.isDefault,
				"adresse": this.adresse,
				"latitude": this.latitude,
				"longitude": this.longitude
			};
		};

		this.unserialize = function(args)
		{
			for(var arg in args)
			{
				this[arg] = args[arg] ;
			}
		};
	}

	//On survient d'abord aux besions en Google Map
	google.maps.visualRefresh = true ;

	// Balancage massif de purée de Brocolis+pommes+liqueure de frelons
	var mainManager = new FavorisManager(document.querySelector("#favoris"));
	Favori.manager = mainManager ;
	mainManager.unserialize();
};