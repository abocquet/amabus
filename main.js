document.body.onload = function(){
	
	//conteneur général
	var amb = 
	{	
		init : function()
		{	
			//Pour permettre l'utlisation de forEach dans amb.fwp.fav.changeMod()
			NodeList.prototype.forEach = Array.prototype.forEach; 
			HTMLCollection.prototype.forEach = Array.prototype.forEach;
			
			amb.sto.init();
			amb.fwp.init();
		},
		
		// Fuck the World, I'm a PANDA !
		fwp : {
			
			init : function()
			{	
				this.fav.init();
			},
			
			horaires : {
				
				container : document.querySelector("#horaires"),
				
				displayListe : function(listeHoraires)
				{
					
				}
				
			},
			
			carte : {
				
				carteTrajet : document.querySelector("#trajet"),
				
				afficherTrajet : function(listePoint)
				{
					
				}
				
			},
			
			recherche : {
				
			},
			
			fav : {
				
				container : document.querySelector("#favoris"),
				editing : false,
				listeFavoris : [],
				
				init : function(){
					
					var that = this ;
					
					this.displayList();

					
					var editButton = this.container.querySelector(".edit") ;
						editButton.onclick = function() { amb.fwp.fav.changeMode(this) } ;
				},
				
				changeMode : function(editButton) {
					var that = this ;
					
					// On commence par modfier le bouton de séléction du mode
					if(this.editing)
					{
						editButton.value = "Modifier" ;
						editButton.className = "right edit";
						
						this.editing = false ;
						
						//Puis, on persiste le tout
						amb.sto.fm.bind(this.container);
						
						//Enfin on rend chaque champ de chaque lieu inmodifiable
						amb.sto.fm.listeFavoris.forEach(function(current)
						{
							
						});
					}
					else
					{
						editButton.value = "Terminé" ;
						editButton.className = "right edit active";
						
						this.editing = true ;
						
						//Puis on rend chaque champ de chaque lieu modifiable
						amb.sto.fm.listeFavoris.forEach(function(current)
						{
							
						});
					}

				},
				
				displayList : function(){
					amb.sto.fm.listeFavoris.forEach(function(current)
					{
						amb.sto.fm.addFavori(current);
					});
				}
				
			}
			
		},
		
		// Juste pour éviter de se retaper le code à chaque fois :)
		api : {
			ajx : {
			
				getJSON : function(chemin, fonction)
				{	 		
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
					     	return fonction(xhr.responseText);	      
						}
					};
					xhr.send(); // La requête est prête, on envoie tout !
				}
				
			},
			geo : {
				
				getPosition : function(fonction)
				{
					navigator.geolocation.getCurrentPosition(fonction, amb.ctr.geo.displayError);
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
			},		
		},
		
		// Gestion de la persistance des entités en local storage
		sto : {
			
			templates : {},
			
			init : function()
			{
				var that = this ;
				amb.api.ajx.getFile("templates/lieu.html", function(html){ that.templates.lieu = html ; });
				amb.api.ajx.getFile("templates/interval.html", function(html){ that.templates.interval = html ; });
				amb.api.ajx.getFile("templates/lieu_modif.html", function(html){ that.templates.lieu_modif = html ; });
				amb.api.ajx.getFile("templates/interval_modif.html", function(html){ that.templates.interval_modif = html ; });
			
				this.fm = new this.FavorisManager(amb.fav.container);
				this.fm.unserialize() ;
			},
			
			FavorisManager : function(container)
			{
				this.container = container ;
				this.listeFavoris = [];
				
				this.serialize = function(){
					localStorage.setItem("serializedFavList", JSON.stringify(this.listeFavoris));
				};
				this.unserialize = function(){
					this.listeFavoris = JSON.parse(localStorage.getItem("serializedFavList"));
				};
				
				this.getCurrentList = function(){
					var currentListe = [];
					
					for(favori in this.listeFavoris)
					{
						if(favori.isCurrentNow())
						{
							currentListe.push(favori);
						}
					}
					
					return currentListe ;
				};
				
				this.bind = function(form){
					
					//this.serialize() ;
				};
				
				this.addFavori = function(options){
					this.listeFavoris.push(new amb.sto.Favori(this.container, options));
				}
				
			},
			
			Favori : function(container, options)
			{
				this.container = container ;
				this.staticRef = null ;
				this.formRef = null ;
			
				this.nom;
				this.latitude ;
				this.longitude ;
				this.adresse ;
				this.defaut ;
				
				this.listeIntervals = [];
				
				this.createStatic = function(){
					
					this.staticRef = document.createElement("div");
					this.staticRef.className = "favori";
					this.staticRef.innerHTML = amb.sto.templates.lieu ;
					
					this.container.appendChild(this.staticRef);
				}
				this.createForm = function(){
					
					this.formRef = document.createElement("div");
					this.formRef.className = "favori edit";
					this.formRef.innerHTML = amb.sto.templates.lieu_modif ;
					this.formRef.style.display = "none" ;
					
					this.staticRef.parentNode.insertBefore(this.modifRef, this.affRef);
				}
				
				this.setEditable = function(){
					
					this.staticRef.style.display = 'none' ;
					this.formRef.style.display = 'block' ;
				}
				this.setNotEditable = function(){
					
					this.staticRef.style.display = 'block' ;
					this.modifRef.style.display = 'none' ;
				}
				
				this.bind = function(form){
					
				};
				
				this.isCurrentNow = function(){
					
					for(interval in this.listeIntervals)
					{
						if(interval.isCurrentNow())
						{
							return true ;
						}
						return false;
					}
					
				};
				
				for(option in options)
				{
					this[option] = options[option];
					console.log(this);
				}
				
				this.createStatic();
				this.createForm();
			},
			
			/*Interval : function()
			{
				this.debut = new amb.sto.Horaire() ;
				this.fin = new amb.sto.Horaire() ;
				this.jours = [];
				
				this.isCurrentNow = function()
				{
					var date = new Date();
					var currentHoraire = new amb.sto.Horaire(date.getHours(), date.getMinutes());
					
					if(currentHoraire.isBetween(this.debut, this.fin))
					{
						return true ;
					}
					else
					{
						return false ;
					}
				};
				
				this.bind = function(form)
				{
					
				};
				
			},
			
			Horaire : function(heure, minute)
			{
				this.heure = heure;
				this.minute = minute;
				
				this.isSup = function(h2)
				{
					if(this.heure > h2.heure)
					{
						return true ;
					}
					else if(this.heure == h2.heure && this.minute > h2.minute)
					{
						return true ;
					}
					else
					{
						return false ;
					}
				}
				
				this.isInf = function(h2)
				{
					return !this.isSup(h2);
				}
				
				this.isBetween = function(h1, h2)
				{
					if(h1.isInf(h2))
					{
						if(this.isSup(h1) && this.isInf(h2))
						{
							return true ;
						}
						else
						{
							return false ;
						}
					}
					else
					{
						if(this.isSup(h2) && this.isInf(h1))
						{
							return true ;
						}
						else
						{
							return false ;
						}
					}
				}
			}*/
		}
		
	};	
	
	// Balançage massif de compote
	amb.init();
}