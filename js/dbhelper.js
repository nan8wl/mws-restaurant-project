/**
 * Common database helper functions.
 */

// First - open our db, or initialize if it's the first time
const dbPromise = idb.open('restaurantReviewSite', 5, function (upgradeDb) {
  switch (upgradeDb.oldVersion) {
    case 0:
    case 1:
      upgradeDb.createObjectStore('storeInfo', {
        keypath: 'id'
      })
    case 2:
      upgradeDb.createObjectStore('reviews', {
        keypath: 'id'
      })
    case 3:
      var newIndex = upgradeDb.transaction.objectStore('reviews');
      newIndex.createIndex('rest_ID', 'restaurant_id');
    case 4:
      upgradeDb.createObjectStore('tempStorage', {
        keypath: 'id',
        autoIncrement: true
      })
  };
});

class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337; // Change this to your server port
    return `http://localhost:${port}/`;
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    // First - try to fetch the data from the server
    fetch(`${DBHelper.DATABASE_URL}restaurants`)
      .then(response => response.json()) // parse the server response
      .then(function (response) {
        if (response) { // if we got a response, set the restaurants value to that and add to idb if not there
          const restaurants = response;
          restaurants.forEach(restaurant => {
            dbPromise.then(async db => { // start a separate transaction for each restaurant, to see if it's in db
              const tx = db.transaction('storeInfo', 'readwrite');
              const store = tx.objectStore('storeInfo');
              // try to get restaurant by id - if it's there, just say it's there - if not, add to db
              const request = await store.get(restaurant.id);
              if (!request) {
                console.log('store is not in db, adding now');
                store.add(restaurant, restaurant.id);
              }
            });
          });
          callback(null, restaurants);
        } else { // otherwise, there's no data and an error is thrown - data doesn't exist at all, even if online
          const error = (`Request failed: ${response.status} - ${response.statusText}`);
          callback(error, null);
        }
      })
      .catch(function () { // then, if the fetch fails, we call our db and check there
        console.log(`Sorry, your internet doesn't seem to be working. Pulling cached data for you now!`);

        dbPromise.then(function (db) {
          const tx = db.transaction('storeInfo', 'readwrite');
          const store = tx.objectStore('storeInfo');
          return store.getAll();
        })
          .then(function (response) {
            const restaurants = response;
            callback(null, restaurants);
          })
      });
  }

  static fetchReviewsById(id, callback) {
    // First - try to fetch the data from the server
    console.log('inside fetchReviewsById');

    const reviewURL = `${DBHelper.DATABASE_URL}reviews/?restaurant_id=${id}`;
    fetch(reviewURL)
      .then(response => response.json()) // parse the server response
      .then(function (response) {
        if (response) {
          console.log('fetch worked - dealing with response now');
          const reviews = response;
          reviews.forEach(review => {
            dbPromise.then(async db => {
              const tx = db.transaction('reviews', 'readwrite');
              const store = tx.objectStore('reviews');
              const request = await store.get(review.id);
              if (!request) {
                console.log('new review found! adding to cache');
                store.add(review, review.id);
              }
            });
          });
          callback(null, reviews);
        } else { // otherwise, there's no data and an error is thrown - data doesn't exist at all, even if online
          console.log('fetch worked, but there was not any data');
          const error = (`Request failed: ${response.status} - ${response.statusText}`);
          callback(error, null);
        }
      })
      .then(() => {

      })
      .catch(function () { // then, if the fetch fails, we call our db and check there
        console.log(`inside the catch function of fetchReviewsById`);
        dbPromise.then(function (db) {
          const tx = db.transaction('reviews', 'readwrite');
          const store = tx.objectStore('reviews');
          const restIdIndex = store.index('rest_ID');
          const temp = restIdIndex.getAll(parseInt(id, 10));
          return temp;
        })
          .then(function (stashedReviews) {
            const reviews = stashedReviews;
            callback(null, reviews);
          })
      });
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`./img/optimized/${restaurant.photograph}-optimized.jpg`);
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker  
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      {
        title: restaurant.name,
        alt: restaurant.name,
        url: DBHelper.urlForRestaurant(restaurant)
      })
    marker.addTo(newMap);
    return marker;
  }

  // Toggle favorite status
  static favStatus(status, id) {
    dbPromise.then(async db => {
      const tx = db.transaction('storeInfo', 'readwrite');
      const store = tx.objectStore('storeInfo');

      const req = await store.get(id);
      const currStore = req;
      currStore.is_favorite = status;

      fetch(`http://localhost:1337/restaurants/${id}/?is_favorite=${status}`, {
        method: 'PUT'
      })
        .then(() => {
          store.put(currStore, id);
          console.log('favorite status is marked!');
          return tx.complete;
        })
        .catch(() => {
          currStore.offlineUpdate = 'yes';
          console.log(currStore);
          store.put(currStore, id);
          console.log(`you're offline, but  your favorite status will be added when you're online again`);
          return tx.complete;
        })
    })
  }

  static toggleFav(button, id) {
    // function to toggle favorite button
    const on = button.querySelector('.on');
    const off = button.querySelector('.off');

    if (on.classList.contains('hide')) {
      DBHelper.favStatus('true', id);
      on.classList.toggle('hide');
      off.classList.toggle('hide');
    } else if (off.classList.contains('hide')) {
      DBHelper.favStatus('false', id);
      on.classList.toggle('hide');
      off.classList.toggle('hide');
    }
  }

  static stashReview(status, review) {
    // if user is online, add review to main db
    console.log(`in stashReview - here's the review we're saving: ${review}`);
    dbPromise.then(db => {
      const tx = db.transaction('reviews', 'readwrite');
      const store = tx.objectStore('reviews');
      if (status === 'online') {
        store.add(review, review.id);
      }
      if (status === 'offline') {
        review.offlineUpdate = true;
        store.add(review, review.id);
      }
      return tx.complete;
    });
  }

  static updateServer() {

    // first check storeInfo db for any changes to favorites
    dbPromise.then(function (db) {
      const tx = db.transaction('storeInfo', 'readwrite');
      const store = tx.objectStore('storeInfo');
      return store.getAll('offlineUpdate');
    })
    // if there are changes, loop through and add them to the server and remove flag
    .then(updates => {
      updates.forEach(update => {
        delete update.offlineUpdate;
        fetch(`http://localhost:1337/restaurants/${update.id}/?is_favorite=${update.is_favorite}`, {
            method: 'PUT'
          })
      })
    })
  
    // then check reviews db for any new reviews to add
    dbPromise.then(function (db) {
      const tx = db.transaction('reviews', 'readwrite');
      const store = tx.objectStore('reviews');
      return store.getAll('offlineUpdate');
    })
    // if there are some, push them to the server and remove flag
    .then(newReviews => {
      newReviews.forEach(review => {
        delete review.offlineUpdate;
        fetch('http://localhost:1337/reviews/', {
            method: 'POST',
            body: JSON.stringify(review)
          })
      })
    })
  }

} //end of class
