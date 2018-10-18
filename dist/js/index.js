const dbPromise=idb.open("restaurantReviewSite",5,function(e){switch(e.oldVersion){case 0:case 1:e.createObjectStore("storeInfo",{keypath:"id"});case 2:e.createObjectStore("reviews",{keypath:"id"});case 3:e.transaction.objectStore("reviews").createIndex("rest_ID","restaurant_id");case 4:e.createObjectStore("tempStorage",{keypath:"id"})}});class DBHelper{static get DATABASE_URL(){return"http://localhost:1337/"}static fetchRestaurants(e){fetch(`${DBHelper.DATABASE_URL}restaurants`).then(e=>e.json()).then(function(t){if(t){const s=t;s.forEach(e=>{dbPromise.then(async t=>{const s=t.transaction("storeInfo","readwrite").objectStore("storeInfo");await s.get(e.id)||(console.log("store is not in db, adding now"),s.add(e,e.id))})}),e(null,s)}else{const s=`Request failed: ${t.status} - ${t.statusText}`;e(s,null)}}).catch(function(){console.log("Sorry, your internet doesn't seem to be working. Pulling cached data for you now!"),dbPromise.then(function(e){return e.transaction("storeInfo","readwrite").objectStore("storeInfo").getAll()}).then(function(t){e(null,t)})})}static fetchReviewsById(e,t){const s=`${DBHelper.DATABASE_URL}reviews/?restaurant_id=${e}`;fetch(s).then(e=>e.json()).then(function(e){if(e){const s=e;s.forEach(e=>{dbPromise.then(async t=>{const s=t.transaction("reviews","readwrite").objectStore("reviews");await s.get(e.id)||(console.log("new review found! adding to cache"),s.add(e,e.id))})}),t(null,s)}else{const s=`Request failed: ${e.status} - ${e.statusText}`;t(s,null)}}).catch(function(){console.log("Looks like you're offline - pulling cached reviews for you now"),dbPromise.then(function(t){const s=t.transaction("reviews","readwrite").objectStore("reviews").index("rest_ID").getAll(e);return console.log("reviews from storage by restId: "+s),s}).then(function(e){const s=e;console.log("catch response: "+s),t(null,s)})})}static fetchRestaurantById(e,t){DBHelper.fetchRestaurants((s,n)=>{if(s)t(s,null);else{const s=n.find(t=>t.id==e);s?t(null,s):t("Restaurant does not exist",null)}})}static fetchRestaurantByCuisine(e,t){DBHelper.fetchRestaurants((s,n)=>{if(s)t(s,null);else{const s=n.filter(t=>t.cuisine_type==e);t(null,s)}})}static fetchRestaurantByNeighborhood(e,t){DBHelper.fetchRestaurants((s,n)=>{if(s)t(s,null);else{const s=n.filter(t=>t.neighborhood==e);t(null,s)}})}static fetchRestaurantByCuisineAndNeighborhood(e,t,s){DBHelper.fetchRestaurants((n,a)=>{if(n)s(n,null);else{let n=a;"all"!=e&&(n=n.filter(t=>t.cuisine_type==e)),"all"!=t&&(n=n.filter(e=>e.neighborhood==t)),s(null,n)}})}static fetchNeighborhoods(e){DBHelper.fetchRestaurants((t,s)=>{if(t)e(t,null);else{const t=s.map((e,t)=>s[t].neighborhood),n=t.filter((e,s)=>t.indexOf(e)==s);e(null,n)}})}static fetchCuisines(e){DBHelper.fetchRestaurants((t,s)=>{if(t)e(t,null);else{const t=s.map((e,t)=>s[t].cuisine_type),n=t.filter((e,s)=>t.indexOf(e)==s);e(null,n)}})}static urlForRestaurant(e){return`./restaurant.html?id=${e.id}`}static imageUrlForRestaurant(e){return`./img/optimized/${e.photograph}-optimized.jpg`}static mapMarkerForRestaurant(e,t){const s=new L.marker([e.latlng.lat,e.latlng.lng],{title:e.name,alt:e.name,url:DBHelper.urlForRestaurant(e)});return s.addTo(newMap),s}static favStatus(e,t){dbPromise.then(async s=>{const n=s.transaction("storeInfo","readwrite"),a=n.objectStore("storeInfo"),o=await a.get(t);return o.is_favorite=e,fetch(`http://localhost:1337/restaurants/${t}/?is_favorite=${e}`,{method:"PUT"}),a.put(o,t),n.complete}).then(function(){console.log("transaction complete!")})}static toggleFav(e,t){console.log(e);const s=e.querySelector(".on"),n=e.querySelector(".off");s.classList.contains("hide")?(DBHelper.favStatus("true",t),s.classList.toggle("hide"),n.classList.toggle("hide")):n.classList.contains("hide")&&(DBHelper.favStatus("false",t),s.classList.toggle("hide"),n.classList.toggle("hide"))}static stashReview(e,t){"online"===e&&dbPromise.then(e=>{const s=e.transaction("reviews","readwrite");s.objectStore("reviews").add(t,t.id);return s.complete}),"offline"===e&&dbPromise.then(e=>{const s=e.transaction("tempStorage","readwrite");s.objectStore("tempStorage").add(t,t.id);return s.complete})}}let restaurants,neighborhoods,cuisines;var newMap,markers=[];document.addEventListener("DOMContentLoaded",e=>{initMap(),fetchNeighborhoods(),fetchCuisines()}),fetchNeighborhoods=(()=>{DBHelper.fetchNeighborhoods((e,t)=>{e?console.error(e):(self.neighborhoods=t,fillNeighborhoodsHTML())})}),fillNeighborhoodsHTML=((e=self.neighborhoods)=>{const t=document.getElementById("neighborhoods-select");e.forEach(e=>{const s=document.createElement("option");s.innerHTML=e,s.value=e,t.append(s)})}),fetchCuisines=(()=>{DBHelper.fetchCuisines((e,t)=>{e?console.error(e):(self.cuisines=t,fillCuisinesHTML())})}),fillCuisinesHTML=((e=self.cuisines)=>{const t=document.getElementById("cuisines-select");e.forEach(e=>{const s=document.createElement("option");s.innerHTML=e,s.value=e,t.append(s)})}),initMap=(()=>{self.newMap=L.map("map",{center:[40.722216,-73.987501],zoom:12,scrollWheelZoom:!1}),L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}",{mapboxToken:"pk.eyJ1IjoibGluZGFrdDE2IiwiYSI6ImNqaW1sY3Z4bjAxa2EzcHBmaTZ4aTE2dzQifQ.cOXPk5Jme5zrFsUP3KEgLw",maxZoom:18,attribution:'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',id:"mapbox.streets"}).addTo(newMap),updateRestaurants()}),updateRestaurants=(()=>{const e=document.getElementById("cuisines-select"),t=document.getElementById("neighborhoods-select"),s=e.selectedIndex,n=t.selectedIndex,a=e[s].value,o=t[n].value;DBHelper.fetchRestaurantByCuisineAndNeighborhood(a,o,(e,t)=>{e?console.error(e):(resetRestaurants(t),fillRestaurantsHTML())})}),resetRestaurants=(e=>{self.restaurants=[],document.getElementById("restaurants-list").innerHTML="",self.markers&&self.markers.forEach(e=>e.remove()),self.markers=[],self.restaurants=e}),fillRestaurantsHTML=((e=self.restaurants)=>{const t=document.getElementById("restaurants-list");e.forEach(e=>{t.append(createRestaurantHTML(e)),addMarkersToMap()})}),createRestaurantHTML=(e=>{const t=document.createElement("li"),s=document.createElement("img");s.className="restaurant-img",s.src=DBHelper.imageUrlForRestaurant(e),s.alt=`A photo showcasing the atmosphere of ${e.name}`,t.append(s);const n=document.createElement("button");n.className="favButton",n.setAttribute("aria-label","Toggle this restaurant's favorite status");const a=document.createElement("img");a.src="./img/icons/fav_on.svg",a.className="favorite on",a.alt="Favorite restaurant toggle turned on";const o=document.createElement("img");o.src="./img/icons/fav_off.svg",o.className="favorite off",o.alt="Favorite restaurant toggle turned off","true"==e.is_favorite&&o.classList.add("hide"),"false"==e.is_favorite&&a.classList.add("hide"),n.append(o,a),t.append(n);const r=t.querySelector(".favButton");r.addEventListener("click",function(t){t.preventDefault(),DBHelper.toggleFav(r,e.id)});const i=document.createElement("h3");i.innerHTML=e.name,t.append(i);const c=document.createElement("p");c.innerHTML=e.neighborhood,t.append(c);const l=document.createElement("p");l.innerHTML=e.address,t.append(l);const u=document.createElement("a");return u.innerHTML="View Details",u.setAttribute("aria-label",`View details for ${e.name}`),u.href=DBHelper.urlForRestaurant(e),t.append(u),t}),addMarkersToMap=((e=self.restaurants)=>{e.forEach(e=>{const t=DBHelper.mapMarkerForRestaurant(e,self.newMap);t.on("click",function(){window.location.href=t.options.url}),self.markers.push(t)})});
//# sourceMappingURL=index.js.map
