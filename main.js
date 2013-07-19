document.body.onload = function(){

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

				xhr.onreadystatechange = function() { 
					if (xhr.readyState == 4 && xhr.status == 200) {
						fonction(xhr.responseText);	      
					}
				};
				xhr.send(); // La requête est prête, on envoie tout !
			}
			
		},

		geo : {
			
			getPosition : function(fonction)
			{
				navigator.geolocation.getCurrentPosition(fonction, api.geo.displayError);
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
						alert("Une erreur s'est produite durant la localisation. Essayez de recharger la page plus tard.")
						break ;
				}
			},

			coder : new google.maps.Geocoder()
		}
	}

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

		this.addFavoriButton = document.createElement("input");
			this.addFavoriButton.className = "centered";
			this.addFavoriButton.type = "button" ;
			this.addFavoriButton.value = "Ajouter un lieu favori";

			this.addFavoriButton.onclick = function(){
				that.addFavori();
			}

			this.container.appendChild(this.addFavoriButton);

		this.addFavori = function(){
			var fav = new Favori(this.container, this);
			fav.afficher();

			this.listeFavoris.push(fav);
			this.serialize();
		}

		this.removeFavori = function(element){

			for (i in this.listeFavoris) {
				
				if(this.listeFavoris[i] == element)
				{
					this.listeFavoris[i].effacer();
					delete(this.listeFavoris[i]);
					break;
				}
			}

			this.serialize() ;
		}

		//gestion de la persistance des données
		this.serialize = function(){
			var listeSerialize = [];

			for (i in this.listeFavoris) {
				listeSerialize.push(this.listeFavoris[i].serialize());
			};

			localStorage.setItem("serializedFavList", JSON.stringify(listeSerialize));
		};
		
		this.unserialize = function(){
			
			var listeUnserialize = JSON.parse(localStorage.getItem("serializedFavList"));

			for (var i = 0, c = listeUnserialize.length ; i < c; i++) {
				var fav = new Favori(this.container) ;
				fav.unserialize(listeUnserialize[i]);
				fav.afficher();

				this.listeFavoris.push(fav);

			};
		};

		this.numOfFav = function(FavHTML){

			var i = 0,
			currentFav = this.container.firstElementChild ;
			while(currentFav != FavHTML){
				i++ ;
				currentFav = currentFav.nextElementSibling ;
			}

			//On ne doit pas compter le titre
			return i - 1;

		}

		this.VtoF = function(view){

			return this.listeFavoris[this.numOfFav(view)] ;

		}
	}

	function Favori(container, manager){

		var that = this ;

		this.nom = "Nouveau lieu";
		this.isDefault = false ;

		// Les autres parametres par défaut seront déterminé par la position courante du device
		this.adresse = "666 Steve Jobs Avenue";
		this.latitude = 0 ;
		this.longitude = 0 ;

		this.listeIntervals = [];

		//Gestion de toutes les vues

		this.container = document.createElement("div");
			container.insertBefore(this.container, container.lastChild);

		this.createStatic = function(){

			this.static = document.createElement("div");
				this.static.className = "favoris" ;

				var modifier = document.createElement('input');
					modifier.type = "button" ;
					modifier.value = "Modifier" ;
					modifier.className = "right" ;

				modifier.onclick =  function(){

					Favori.disableEditable();
					Favori.toogleView(that.container);

				};

				var title = document.createElement('h5');
					title.textContent = this.nom ;

				var adresse = document.createElement("p");
					adresse.textContent = this.adresse ;

			this.static.appendChild(modifier);
			this.static.appendChild(title);
			this.static.appendChild(adresse);
		}		

		this.createDynamic = function(){

			this.dynamic = document.createElement("div");
				this.dynamic.className = "favoris" ;

				var terminer = document.createElement('input');
					terminer.type = "button" ;
					terminer.value = "Enregistrer" ;
					terminer.className = "right active" ;

				terminer.onclick = function(e){

					Favori.disableEditable();

				}

				var title = document.createElement('input');
					title.className = "h5"
					title.type = "text" ;
					title.value = this.nom ;

				var map = document.createElement("div");
					map.className = "map";
					this.createMapToEdit(map);

				var adresse = document.createElement("input");
					adresse.className = "p" ;
					adresse.type = "text"; 
					adresse.value = this.adresse ;

				var deleteButton = document.createElement("input");
					deleteButton.type = "button";
					deleteButton.className = "alert";
					deleteButton.value = "Supprimer ce favoris";

					deleteButton.onclick = function(){

						if(confirm("Êtes-vous sûr de vouloir supprimer " + that.nom + " ?"));
						{
							Favori.manager.removeFavori(that);
						}

					}

			this.dynamic.appendChild(terminer);
			this.dynamic.appendChild(title);
			this.dynamic.appendChild(map);
			this.dynamic.appendChild(adresse);
			this.dynamic.appendChild(deleteButton);

			this.dynamic.style.display = "none";
		}

		this.createMapToEdit = function(container){

			function createMap(longitude, latitude)
			{
				var position = new google.maps.LatLng(latitude, longitude);

				var map = new google.maps.Map(container, {

					zoom: 15,
					center: position,
					mapTypeId: google.maps.MapTypeId.ROADMAP 

				});

				var marker = new google.maps.Marker({ 
					position: position, 
					map: map,
					draggable: true 
				});
			
			}

			if(this.latitude == 0 && this.longitude == 0)
			{
				api.geo.getPosition(function(position){
					createMap(position.coords.longitude, position.coords.latitude);
				});
			}
			else
			{
				createMap(this.longitude, this.latitude);
			}


		}

		Favori.disableEditable = function(){

			var editingView = document.querySelector("#editing");
			if(editingView != undefined){ 

				Favori.bindFavori(editingView) ;
				Favori.toogleView(editingView);
			}
		}

		Favori.bindFavori = function(element){

			var currentFav = Favori.manager.VtoF(element);
			var currentElement = currentFav.dynamic.firstChild ;

			//Le noeud du titre
			currentElement = giveNextTag("input", currentElement) ;
			currentFav.nom = currentElement.value ;

			//Le noeud de l'adresse
			currentElement = giveNextTag("input", currentElement);
			currentFav.adresse = currentElement.value ;

			//Puis on hydrate la vue
				//Le noeud du titre
				currentElement = giveNextTag("h5", currentFav.static.firstChild) ;
				currentElement.textContent = currentFav.nom ;

				//Le noeud de l'adresse
				currentElement = giveNextTag("p", currentElement); ;
				currentElement.textContent = currentFav.adresse ;

			Favori.manager.serialize();

		}

		Favori.toogleView = function(element){

			if(element.id == "editing")
			{	
				//et on s'occupe d'abord de la vue
				element.lastChild.style.display = "none" ;
				element.firstChild.style.display = "block" ;
				element.id = "";

			}
			else
			{
				element.firstChild.style.display = "none" ;
				element.lastChild.style.display = "block" ;
				element.id = "editing";
			}
		}

		this.afficher = function(){
			this.createStatic();
			this.createDynamic();

			this.container.appendChild(this.static) ;
			this.container.appendChild(this.dynamic);
		}

		this.effacer = function(){
			this.container.parentNode.removeChild(this.container);
		}

		//Gestion de la persistance des données

		this.serialize = function()
		{
			return {
				"nom": this.nom,
				"isDefault": this.isDefault,
				"adresse": this.adresse,
				"latitude": this.latitude,
				"longitude": this.longitude
			}
		}

		this.unserialize = function(args)
		{
			this.nom = args.nom ;
			this.isDefault = args.isDefault;
			this.adresse = args.adresse;
			this.latitude = args.latitude;
			this.longitude = args.longitude;
		}
	}
	
	// Balancage massif de purée de Brocolis+pommes+liqueure de frelons
	var mainManager = new FavorisManager(document.querySelector("#favoris"));
	Favori.manager = mainManager ;
	mainManager.unserialize();
};