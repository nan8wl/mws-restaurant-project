const dbPromise=idb.open("restaurantReviewSite",5,function(e){switch(e.oldVersion){case 0:case 1:e.createObjectStore("storeInfo",{keypath:"id"});case 2:e.createObjectStore("reviews",{keypath:"id"});case 3:e.transaction.objectStore("reviews").createIndex("rest_ID","restaurant_id");case 4:e.createObjectStore("tempStorage",{keypath:"id"})}});class DBHelper{static get DATABASE_URL(){return"http://localhost:1337/"}static fetchRestaurants(e){fetch(`${DBHelper.DATABASE_URL}restaurants`).then(e=>e.json()).then(function(t){if(t){const n=t;n.forEach(e=>{dbPromise.then(async t=>{const n=t.transaction("storeInfo","readwrite").objectStore("storeInfo");await n.get(e.id)||(console.log("store is not in db, adding now"),n.add(e,e.id))})}),e(null,n)}else{const n=`Request failed: ${t.status} - ${t.statusText}`;e(n,null)}}).catch(function(){console.log("Sorry, your internet doesn't seem to be working. Pulling cached data for you now!"),dbPromise.then(function(e){return e.transaction("storeInfo","readwrite").objectStore("storeInfo").getAll()}).then(function(t){e(null,t)})})}static fetchReviewsById(e,t){const n=`${DBHelper.DATABASE_URL}reviews/?restaurant_id=${e}`;fetch(n).then(e=>e.json()).then(function(e){if(e){const n=e;n.forEach(e=>{dbPromise.then(async t=>{const n=t.transaction("reviews","readwrite").objectStore("reviews");await n.get(e.id)||(console.log("new review found! adding to cache"),n.add(e,e.id))})}),t(null,n)}else{const n=`Request failed: ${e.status} - ${e.statusText}`;t(n,null)}}).catch(function(){console.log("Looks like you're offline - pulling cached reviews for you now"),dbPromise.then(function(t){const n=t.transaction("reviews","readwrite").objectStore("reviews").index("rest_ID").getAll(e);return console.log("reviews from storage by restId: "+n),n}).then(function(e){const n=e;console.log("catch response: "+n),t(null,n)})})}static fetchRestaurantById(e,t){DBHelper.fetchRestaurants((n,a)=>{if(n)t(n,null);else{const n=a.find(t=>t.id==e);n?t(null,n):t("Restaurant does not exist",null)}})}static fetchRestaurantByCuisine(e,t){DBHelper.fetchRestaurants((n,a)=>{if(n)t(n,null);else{const n=a.filter(t=>t.cuisine_type==e);t(null,n)}})}static fetchRestaurantByNeighborhood(e,t){DBHelper.fetchRestaurants((n,a)=>{if(n)t(n,null);else{const n=a.filter(t=>t.neighborhood==e);t(null,n)}})}static fetchRestaurantByCuisineAndNeighborhood(e,t,n){DBHelper.fetchRestaurants((a,r)=>{if(a)n(a,null);else{let a=r;"all"!=e&&(a=a.filter(t=>t.cuisine_type==e)),"all"!=t&&(a=a.filter(e=>e.neighborhood==t)),n(null,a)}})}static fetchNeighborhoods(e){DBHelper.fetchRestaurants((t,n)=>{if(t)e(t,null);else{const t=n.map((e,t)=>n[t].neighborhood),a=t.filter((e,n)=>t.indexOf(e)==n);e(null,a)}})}static fetchCuisines(e){DBHelper.fetchRestaurants((t,n)=>{if(t)e(t,null);else{const t=n.map((e,t)=>n[t].cuisine_type),a=t.filter((e,n)=>t.indexOf(e)==n);e(null,a)}})}static urlForRestaurant(e){return`./restaurant.html?id=${e.id}`}static imageUrlForRestaurant(e){return`./img/optimized/${e.photograph}-optimized.jpg`}static mapMarkerForRestaurant(e,t){const n=new L.marker([e.latlng.lat,e.latlng.lng],{title:e.name,alt:e.name,url:DBHelper.urlForRestaurant(e)});return n.addTo(newMap),n}static favStatus(e,t){dbPromise.then(async n=>{const a=n.transaction("storeInfo","readwrite"),r=a.objectStore("storeInfo"),o=await r.get(t);return o.is_favorite=e,fetch(`http://localhost:1337/restaurants/${t}/?is_favorite=${e}`,{method:"PUT"}),r.put(o,t),a.complete}).then(function(){console.log("transaction complete!")})}static toggleFav(e,t){console.log(e);const n=e.querySelector(".on"),a=e.querySelector(".off");n.classList.contains("hide")?(DBHelper.favStatus("true",t),n.classList.toggle("hide"),a.classList.toggle("hide")):a.classList.contains("hide")&&(DBHelper.favStatus("false",t),n.classList.toggle("hide"),a.classList.toggle("hide"))}static stashReview(e,t){"online"===e&&dbPromise.then(e=>{const n=e.transaction("reviews","readwrite");n.objectStore("reviews").add(t,t.id);return n.complete}),"offline"===e&&dbPromise.then(e=>{const n=e.transaction("tempStorage","readwrite");n.objectStore("tempStorage").add(t,t.id);return n.complete})}}let restaurant,reviews;var newMap;document.addEventListener("DOMContentLoaded",e=>{initMap()}),initMap=(()=>{fetchRestaurantFromURL((e,t)=>{e?console.error(e):(self.newMap=L.map("map",{center:[t.latlng.lat,t.latlng.lng],zoom:16,scrollWheelZoom:!1}),L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}",{mapboxToken:"pk.eyJ1IjoibGluZGFrdDE2IiwiYSI6ImNqaW1sY3Z4bjAxa2EzcHBmaTZ4aTE2dzQifQ.cOXPk5Jme5zrFsUP3KEgLw",maxZoom:18,attribution:'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',id:"mapbox.streets"}).addTo(newMap),fillBreadcrumb(),DBHelper.mapMarkerForRestaurant(self.restaurant,self.newMap))})}),fetchRestaurantFromURL=(e=>{if(self.restaurant)return void e(null,self.restaurant);const t=getParameterByName("id");t?(DBHelper.fetchRestaurantById(t,(t,n)=>{self.restaurant=n,n?(fillRestaurantHTML(),e(null,n)):console.error(t)}),DBHelper.fetchReviewsById(t,(t,n)=>{self.reviews=n,n?0!=Object.keys(n).length&&(fillReviewsHTML(),e(null,n)):console.error(t)})):(error="No restaurant id in URL",e(error,null))}),fillRestaurantHTML=((e=self.restaurant)=>{document.getElementById("restaurant-name").innerHTML=e.name,document.getElementById("restaurant-address").innerHTML=e.address;const t=document.getElementById("restaurant-img");t.className="restaurant-img",t.src=DBHelper.imageUrlForRestaurant(e),t.alt=`A photo showcasing the atmosphere of ${e.name}`;const n=document.getElementById("restaurant-cuisine");n.innerHTML=e.cuisine_type,n.setAttribute("aria-label",`${e.cuisine_type} restaurant`);const a=document.createElement("img");a.src="./img/icons/fav_on.svg",a.className="favorite on";const r=document.createElement("img");r.src="./img/icons/fav_off.svg",r.className="favorite off","false"==e.is_favorite?a.classList.add("hide"):"true"==e.is_favorite&&r.classList.add("hide");const o=document.getElementById("fav");o.append(a,r),o.addEventListener("click",function(t){t.preventDefault(),DBHelper.toggleFav(o,e.id)}),e.operating_hours&&fillRestaurantHoursHTML()}),fillRestaurantHoursHTML=((e=self.restaurant.operating_hours)=>{const t=document.getElementById("restaurant-hours");for(let n in e){const a=document.createElement("tr"),r=document.createElement("td");r.innerHTML=n,a.appendChild(r);const o=document.createElement("td");o.innerHTML=e[n],a.appendChild(o),t.appendChild(a)}}),fillReviewsHTML=((e=self.reviews)=>{const t=document.getElementById("reviews-container"),n=document.createElement("h3");if(n.innerHTML="Reviews",t.appendChild(n),t.setAttribute("aria-label","Reviews"),!e){const e=document.createElement("p");return e.innerHTML="No reviews yet!",void t.appendChild(e)}const a=document.getElementById("reviews-list");e.forEach(e=>{a.appendChild(createReviewHTML(e))}),t.appendChild(a);const r=formFunction(e[0].restaurant_id);t.appendChild(r)}),createReviewHTML=(e=>{const t=document.createElement("li"),n=document.createElement("p");n.innerHTML=e.name,t.appendChild(n);const a=document.createElement("p");a.innerHTML=`Rating: ${e.rating}`,t.appendChild(a);const r=document.createElement("p");return r.innerHTML=e.comments,t.appendChild(r),t}),formFunction=(e=>{const t=document.getElementById("addReview"),n=document.createElement("h4");n.innerHTML="Add Your Own Review!",t.appendChild(n);const a=document.createElement("form");a.id="addReviewForm";const r=document.createElement("div");r.className="formDivider";const o=document.createElement("label");o.htmlFor="name",o.innerHTML="Your Name:";const s=document.createElement("input");s.type="text",s.name="user_name",s.id="name",r.appendChild(o),r.appendChild(s),a.appendChild(r);const i=document.createElement("div");i.className="formDivider";const l=document.createElement("label");l.htmlFor="rating",l.innerHTML="Rating: <br> (1 low, 5 high)";const c=document.createElement("input");c.type="number",c.name="user_rating",c.id="rating",i.appendChild(l),i.appendChild(c),a.appendChild(i);const d=document.createElement("div");d.className="formDivider";const u=document.createElement("label");u.htmlFor="uReview",u.innerHTML="Comments:";const m=document.createElement("textarea");m.name="user_review",m.id="uReview",m.placeholder="How was this place?",d.appendChild(u),d.appendChild(m),a.appendChild(d);const p=document.createElement("button");return p.type="submit",p.id="submitReview",p.innerHTML="Post Review",a.appendChild(p),t.appendChild(a),a.addEventListener("submit",function(n){n.preventDefault(),newReview(e,t,a)}),t}),newReview=((e,t,n)=>{const a={restaurant_id:e,name:n.user_name.value,rating:parseInt(n.user_rating.value,10),comments:n.user_review.value};fetch("http://localhost:1337/reviews/",{method:"POST",body:JSON.stringify(a)}).then(e=>e.json()).then(e=>{console.log("Success! Your review has been received. Response: ",e),DBHelper.stashReview("online",e),updateFormDiv(t)}).catch(e=>{console.error("Sorry, fetch failed! Storing review offline. Error code: ",e),DBHelper.stashReview("offline",a),updateFormDiv(t)})}),updateFormDiv=(e=>{e.innerHTML=`\n    <p> Thanks for adding your review! Reload the page to see your review live! </p>\n    <button class='reloadBtn'><a href=" ${window.location.href} "> Reload now? </a></button>\n  `}),fillBreadcrumb=((e=self.restaurant)=>{const t=document.getElementById("breadcrumb"),n=document.createElement("li");n.innerHTML=e.name,t.appendChild(n)}),getParameterByName=((e,t)=>{t||(t=window.location.href),e=e.replace(/[\[\]]/g,"\\$&");const n=new RegExp(`[?&]${e}(=([^&#]*)|&|#|$)`).exec(t);return n?n[2]?decodeURIComponent(n[2].replace(/\+/g," ")):"":null});
//# sourceMappingURL=restaurant.js.map
