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
						window.location = "http://localhost/amabus/web/app_dev.php/explications#geolocation.permission" ;
						break;
						
					case error.TIMEOUT :
						if(confirm("La localisation prend trop de temps. Voulez-vous réessayer ?"))
						{
							alert("fwp.rafraichis();");
						}
						break; 
						
					case error.UNKNOWN_ERROR:
					case error.POSITION_UNAVAILABLE:
					default:
						alert("Une erreur s'est produite durant la localisation. Essayez de recharger la page plus tard.")
						break ;
				}
			}	
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

		this.addFavori = function(){
			var fav = new Favori(this.container, this);
			fav.afficher();

			this.listeFavoris.push(fav);
		}

		this.removeFavori = function(nom){

			for(favori in this.listeFavoris)
			{
				if(favori.nom == nom)
				{
					delete(this.listeFavoris[favori]);
					break;
				}
			}
		}

		//gestion de la persistance des données
		this.serialize = function(){
			var listeSerialize = [];

			for (var i = 0, c = this.listeFavoris.length ; i < c; i++) {
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
		this.latitude = 45 ;
		this.longitude = 5 ;

		this.listeIntervals = [];

		//Gestion de toutes les vues

		this.container = document.createElement("div");
			container.appendChild(this.container);

		this.createStatic = function(){

			this.static = document.createElement("div");
				this.static.className = "favoris" ;

				var modifier = document.createElement('input');
					modifier.type = "button" ;
					modifier.value = "Modifier" ;
					modifier.className = "right" ;

				modifier.addEventListener('click', function(e){
					e.preventDefault();

					Favori.disableEditable();
					Favori.toogleView(that.container);

				}, false);

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

				terminer.addEventListener('click', function(e){
					e.preventDefault();
					Favori.disableEditable();

				}, false);

				var title = document.createElement('input');
					title.className = "h5"
					title.type = "text" ;
					title.value = this.nom ;

				var map = document.createElement("div");
					map.id = "map";

				var adresse = document.createElement("input");
					adresse.className = "p" ;
					adresse.type = "text"; 
					adresse.value = this.adresse ;

			this.dynamic.appendChild(terminer);
			this.dynamic.appendChild(title);
			this.dynamic.appendChild(map);
			this.dynamic.appendChild(adresse);

			this.dynamic.style.display = "none";
		}

		Favori.disableEditable = function(){

			var editingView = document.querySelector("#editing");
			if(editingView != undefined){ 

				Favori.bindFavori(editingView) ;
				Favori.toogleView(editingView);
			}
		}

		Favori.bindFavori = function(element){

			var currentFav = Favori.manager.VtoF(element),
				currentElement = currentFav.dynamic.firstChild ;

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
	
	// mainManager.addFavori();

	// mainManager.listeFavoris[0].nom = "Domicile" ;
	// mainManager.listeFavoris[0].isDefault = true ;
	// mainManager.listeFavoris[0].latitude = 45 ;
	// mainManager.listeFavoris[0].longitude = 5 ;
	// mainManager.listeFavoris[0].adresse = "200 route des rieux Montbonnot" ;

	// mainManager.addFavori();

	// mainManager.listeFavoris[1].nom = "Lycée" ;
	// mainManager.listeFavoris[1].isDefault = false ;
	// mainManager.listeFavoris[1].latitude = 44 ;
	// mainManager.listeFavoris[1].longitude = 6 ;
	// mainManager.listeFavoris[1].adresse = "1 avenue du taillefer Meylan" ;
	
	// console.log(mainManager);

	// mainManager.serialize() ;
	mainManager.unserialize();
};