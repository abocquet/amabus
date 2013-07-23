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
						alert("Une erreur s'est produite durant la localisation. Essayez de recharger la page plus tard.");
						break ;
				}
			},

			coder : new google.maps.Geocoder(),

			map : {


			}

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

		this.addFavoriButton = document.createElement("input");
			this.addFavoriButton.className = "centered";
			this.addFavoriButton.type = "button" ;
			this.addFavoriButton.value = "Ajouter un lieu favori";

			this.addFavoriButton.onclick = function(){
				that.addFavori();
			};

			this.container.appendChild(this.addFavoriButton);

		this.addFavori = function(){
			var fav = new Favori(this.container, this);
			fav.afficher();

			this.listeFavoris.push(fav);
			this.serialize();

			return fav ;
		};

		this.removeFavori = function(val){

			this.listeFavoris.unset(val);

			if(this.listeFavoris.length == 0)
			{
				this.addFavori().setDefault(true);
			}

			if(val.isDefault){
				this.listeFavoris[0].setDefault(true);
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
			currentFav = this.container.firstElementChild.nextElementSibling ; //On ne commence que par le second enfant, le premier étant le titre
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

		// Les autres parametres par défaut seront déterminé par la position courante du device
		this.adresse = "666 Steve Jobs Avenue";
		this.latitude = 0 ;
		this.longitude = 0 ;

		this.listeIntervals = [];

		//On se sert de cette liste pour hydrater l'objet à partir des vues contenues dans le tableau
		this.listeInputs = {};

		//Gestion de toutes les vues

		this.container = document.createElement("div");
			container.insertBefore(this.container, container.lastChild);

		this.setDefault = function(isDefault){

			this.isDefault = isDefault ;

			if(this.listeInputs.isDefault != undefined)
			{
				this.listeInputs.isDefault.checked = this.isDefault ;
			}

		};

		this.createStatic = function(){

			this.static = document.createElement("div");
				this.static.className = "favoris" ;

				var modifier = document.createElement('input');
					modifier.type = "button" ;
					modifier.value = "Modifier" ;
					modifier.className = "right" ;

				modifier.onclick =  function(){

					Favori.disableEditable();

					if(that.dynamic == undefined){
						that.createDynamic();
						that.container.appendChild(that.dynamic);
					}

					Favori.toogleView(that.container);

				};

				var nom = document.createElement('h5');
					nom.textContent = this.nom ;

				var adresse = document.createElement("p");
					adresse.textContent = this.adresse ;

			this.static.appendChild(modifier);
			this.static.appendChild(nom);
			this.static.appendChild(adresse);
		};

		this.createDynamic = function(){

			this.dynamic = document.createElement("div");
				this.dynamic.className = "favoris" ;

				var terminer = document.createElement('input');
					terminer.type = "button" ;
					terminer.value = "Enregistrer" ;
					terminer.className = "right active" ;

				terminer.onclick = function(e){

					Favori.disableEditable();

				};

				var nom = document.createElement('input');
					nom.className = "h5";
					nom.type = "text" ;
					nom.value = this.nom ;

				var map = document.createElement("div");
					map.className = "map";

				var adresse = document.createElement("input");
					adresse.className = "p" ;
					adresse.type = "text";
					adresse.value = this.adresse ;

				var longitude = document.createElement("input");
					longitude.type = "hidden" ;

				var latitude = document.createElement("input");
					latitude.type = "hidden" ;

					// api.geo.map.addGeocodeSupport(map, adresse, latitude, longitude);

				var isDefaultContainer = document.createElement("div");

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
					deleteButton.className = "alert";
					deleteButton.value = "Supprimer ce favoris";

					deleteButton.onclick = function(){

						if(confirm("Etes-vous sûr de vouloir supprimer " + that.nom + " ?"))
						{
							Favori.manager.removeFavori(that);
						}
					};

			this.dynamic.appendChild(terminer);
			this.dynamic.appendChild(nom);
			this.dynamic.appendChild(map);
			this.dynamic.appendChild(longitude);
			this.dynamic.appendChild(latitude);
			this.dynamic.appendChild(adresse);
			this.dynamic.appendChild(isDefaultContainer);
			this.dynamic.appendChild(deleteButton);

			this.listeInputs = {
				"nom": nom,
				"longitude": longitude,
				"latitude": latitude,
				"adresse": adresse,
				"isDefault": isDefault
			};

			this.dynamic.style.display = "none";
		};

		Favori.disableEditable = function(){

			var editingView = document.querySelector("#editing");
			if(editingView != undefined){

				Favori.manager.VtoF(editingView).bind() ;
				Favori.toogleView(editingView);
			}
		};

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
			this.createStatic();
			this.container.appendChild(this.static) ;
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

	google.maps.visualRefresh = true;
	// Balancage massif de purée de Brocolis+pommes+liqueure de frelons
	var mainManager = new FavorisManager(document.querySelector("#favoris"));
	Favori.manager = mainManager ;
	mainManager.unserialize();
};