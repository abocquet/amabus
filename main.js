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

	function FavorisManager(container){

		//Gestion des favoris
		var that = this ;
		this.listeFavoris = []; 
		this.isEditing = false ;
		this.container = container ;

		this.addFavori = function(){
			var fav = new Favori(this.container);
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

		// gestion de la vue 

		this.editButton = document.createElement("input");
			this.editButton.className = "right edit";
			this.editButton.type = "button" ;
			this.editButton.value = "Modifier"

			this.editButton.onclick = function()
			{
				that.isEditing = !that.isEditing ;
				if(that.isEditing)
				{
					this.value = "Terminé" ;
					this.className = "active right edit"

					for (var i = 0, c = that.listeFavoris.length ; i < c; i++) {
						that.listeFavoris[i].startTrans();
					};
				}
				else
				{
					this.value = "Modifier" ;
					this.className = "right edit";

					for (var i = 0, c = that.listeFavoris.length ; i < c; i++) {
						that.listeFavoris[i].stopTrans();
					};
				}
			}

			this.container.insertBefore(this.editButton, this.container.firstChild);
	}

	function Favori(container){

		var that = this ;
		this.nom = "Nouveau lieu";
		this.isDefault = false ;
		this.inTrans = false ;

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

				var title = document.createElement('h5');
					title.textContent = this.nom ;

				var adresse = document.createElement("p");
					adresse.textContent = this.adresse ;

			this.static.appendChild(title);
			this.static.appendChild(adresse);
		}		

		this.createDynamic = function(){

			this.dynamic = document.createElement("div");
				this.dynamic.className = "favoris" ;

				var terminer = document.createElement('a');
					terminer.href = "#" ;
					terminer.textContent = "terminer" ;
					terminer.className = "right" ;

				terminer.addEventListener('click', function(e){
					e.preventDefault();

					if(mainManager.isEditing)
					{	
						Favori.disableEditable();
					}

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

			this.dynamic.appendChild(title);
			this.dynamic.appendChild(map);
			this.dynamic.appendChild(adresse);

			this.dynamic.style.display = "none";
		}

		this.createTrans = function(){

			this.trans = document.createElement("div");
				this.trans.className = "favoris" ;

				var modifier = document.createElement('a');
					modifier.href = "#" ;
					modifier.textContent = "modifier" ;
					modifier.className = "right" ;

					modifier.addEventListener('click', function(e){
						e.preventDefault();

						if(mainManager.isEditing)
						{	
							Favori.disableEditable();
							Favori.toogleView(that.container); 
						}

					}, false);

				var title = document.createElement('h5');
					title.textContent = this.nom ;

			this.trans.appendChild(modifier);
			this.trans.appendChild(title);

			this.trans.style.display = "none" ;
		}

		Favori.disableEditable = function()
		{
			var editingView = document.querySelector("#editing");
			if(editingView != undefined){ 

				//
				// 	iiiiiii  ccccccc iiiiiii
				//     i     c          i
				//     i     c          i    On rafraichis toutes les vues
				//     i     c          i
				//  iiiiiii  ccccccc iiiiiii
				//

				Favori.toogleView(editingView);
			}
		}

		Favori.toogleView = function(element){

			if(element.id == "editing")
			{	
				//et on s'occupe d'abord de la vue
				element.lastChild.style.display = "none" ;
				element.firstChild.nextSibling.style.display = "block" ;
				element.id = "";

			}
			else
			{
				element.firstChild.nextSibling.style.display = "none" ;
				element.lastChild.style.display = "block" ;
				element.id = "editing";
			}
		}

		this.stopTrans = function(){
			this.inTrans = false ;

			var child = this.container.firstChild ;
			child.style.display = "block" ;

			while(child = child.nextSibling)
			{
				child.style.display = "none";
			}
		}

		this.startTrans = function(){
			this.inTrans = true ;

			var child = this.container.firstChild ;
			child.style.display = "none" ;

			child = child.nextSibling ;			
			child.style.display = "block";

			while(child = child.nextSibling)
			{
				child.style.display = "none";
			}
		}
		

		this.afficher = function(){
			this.createStatic();
			this.createTrans() ;
			this.createDynamic();

			this.container.appendChild(this.static) ;
			this.container.appendChild(this.trans) ;
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