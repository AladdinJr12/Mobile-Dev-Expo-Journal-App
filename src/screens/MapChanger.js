//---This is the screen that pops up when the user presses the map button in the new entry page--//
//--It basically pastes the adddress of the location they have selected----//
import React, { useState, useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, TextInput, FlatList } from "react-native";
import { WebView } from "react-native-webview";

//----My Google maps api key-----//
const GOOGLE_MAPS_API_KEY = "AIzaSyDkKID-05znBxhNnf6j1CisulmlFM4W0qE"; 

export default function MapChangerWithRNSearch({ navigation, route }) {
  const [selectedAddress, setSelectedAddress] = useState("");

  //---the default lat and lng values (which is set to my home country Singapore---//)
  const [latitude, setlatitude] = useState(1.3521);
  const [longitude, setlongitude] = useState(103.8198);

  //---for the address search button----//
  const [searchText, setSearchText] = useState("");
  const [locationSuggestions, setSuggestions] = useState([]);
  
  //---for future use inside the WebView-----//
  const webviewRef = useRef(null);

  //------This will activate at the start and pull in user's phone location----//
  useEffect( ()=>{
      (async()=>{
          //---Askiing for phone's permission to access its location-----//
          let { status } = await Location.requestForegroundPermissionsAsync();

          if (status == "granted") {
            
          }
          //----if the gps permission is not given, it will simply just not update the default lat and lng values------//
          
          //----Get last recorded gps location of the phone-----//
          let currentLocation = await Location.getCurrentPositionAsync({});
          
          //---converting the gps location into an address---//
          let [address] = await Location.reverseGeocodeAsync({
              latitude: currentLocation.coords.latitude,
              longitude: currentLocation.coords.longitude,
          });
          
          setlatitude(address.latitude)
          setlongitude(address.longitude)
      })();
  }, [])

  //----Fetch location suggestions from the Google Places Autocomplete API-----//
  const fetchSuggestions = async (input) => {
    //---ensuring the the suggestions dropdown list only shows up when something is typed inside the search bar----//
    if (!input) {
      setSuggestions([]);
      return;
    }

    //--the url link for the googles places autocomplete api---//
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?key=${GOOGLE_MAPS_API_KEY}&input=${encodeURIComponent(
      input
    )}&types=geocode&language=en`;

    //---calling the api----//
    try {
      const response = await fetch(url);
      const json = await response.json();

      //---once api returns okay= update location suggestions state----//
      if (json.status === "OK") {
        setSuggestions(json.predictions);
        // console.log(json.predictions);
      } 
      //---this means no such location was found----//
      else {
        setSuggestions([]);
      }
    }
    //----error handling + empty out suggested locations----// 
    catch (error) {
      console.error(error);
      setSuggestions([]);
    }
  };

  //---When user selects one of the suggested locations------//
  const selectSuggestions = async (placeId, description) => {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?key=${GOOGLE_MAPS_API_KEY}&place_id=${placeId}`;
    try {
      //----Fetching the selected place's details to get its lat & lng values----//
      const response = await fetch(url);
      
      const json = await response.json();

      if (json.status === "OK") {
        const { lat, lng } = json.result.geometry.location;
        //----Function to move the marker inside the html(that is inside the WebView)---//
        const jsCode = `
          if(window.moveMarker){
            window.moveMarker(${lat}, ${lng});
          }
          true;
        `;
        
        //----activating the above javascript code inside of the html content written in WebView--//
        webviewRef.current.injectJavaScript(jsCode);

        //---update the selected address---//
        setSelectedAddress(description); 
        
        //----Reset suggesstions----//
        setSuggestions([]);
        setSearchText(description);
      }
    } 
    catch (error) {
      console.error(error);
    }
  };

  //---This is the function of the confirm button and basically brings the user back to the new entry page
  const confirmSelection = () => {
    //----Calling the callback passedJournalEntrywEntry.js---//
    if (route.params?.onGoBack) {
      route.params.onGoBack(selectedAddress);
    }

    //-----Returning back to the previous screen----//
    navigation.goBack();
   
  };

  //-----HTML + JavaScript for the google map-------//
  const htmlContent = `
    <!DOCTYPE html>
        <html>
          <head>
            <meta name="viewport" content="initial-scale=1.0, width=device-width" />
            <!-- //--Adding the styling here since there is no css file for this html string---// -->
            <style> html, body, #map { height: 100%; margin: 0; padding: 0; } </style>
            
            <!-- the JavaScript api key link -->
            <script src="https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}"></script>
            
            <!-- This is the script that will target the body div + create the google map -->
            <script>
            // ---setting up variables for the google map------//
              let map;
              let marker;

              function initMap() {
                //---This is where the map is created----//
                map = new google.maps.Map(document.getElementById("map"), {
                  center: { lat: ${latitude}, lng: ${longitude} }, //--This will either be the default address or phone's address--//
                  zoom: 13,
                });

                //----Adding event listner to hear where the user clicked at----//
                map.addListener('click', (e) => {
                  const lat = e.latLng.lat();
                  const lng = e.latLng.lng();

                  //-----This removes the previous marker(if it exists) and place a new marker down on where the user clicked at---//
                  if(marker) marker.setMap(null);
                  marker = new google.maps.Marker({ position: { lat, lng }, map: map });

                  window.ReactNativeWebView.postMessage(JSON.stringify({ lat, lng }));

                });

                //---(This function is setup for when we call it in selectSuggestions)--//
                //---It will update the marker's positioning to the centre of the input's lat & lng----//
                window.moveMarker = (lat, lng) => {
                  if(marker) marker.setMap(null);
                  marker = new google.maps.Marker({ position: { lat, lng }, map: map });
                  map.setCenter({ lat, lng });
                  map.setZoom(15);
                };
              }
            </script>
          </head>

          <!-- The body of the html file we are messing with -->
          <body onload="initMap()">
            <!-- This is where the google map will form -->
            <div id="map"></div>
          </body>
        </html>
    `;

  return (
    <View style={{ flex: 1 }}>
      {/*------__________The search bar section_______________----*/}
      <View style={styles.searchBarSect}>
        <TextInput
          placeholder="Search for a place"
          value={searchText}
          onChangeText={(text) => {
            setSearchText(text);
            fetchSuggestions(text);
          }}
          style={styles.locationSearchBar}
        />
      {/*---These are the location suggestions, shown via a dropdown list---*/}
        {locationSuggestions.length > 0 && (
          <FlatList
            data={locationSuggestions}
            keyExtractor={(item) => item.place_id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={{ padding: 8, borderBottomWidth: 1, borderColor: "#eee" }}
                onPress={() => selectSuggestions(item.place_id, item.description)}
              >
                <Text>{item.description}</Text>
              </TouchableOpacity>
            )}
            style={{ maxHeight: 200, backgroundColor: "#fff" }}
          />
        )}
      </View>
      
      <WebView
        //----This line is so that we can control/manipulate the WebView even outside this return section---//
        ref={webviewRef}
        
        //----so that it can load content from the the api urls-----//
        originWhitelist={["*"]}

        //---show the html tags I wrote in htmlContent---//
        source={{ html: htmlContent }}

        style={ styles.mapHTMLSect }
        
        onMessage={async (event) => {

          //----Gettting lat and lng data from the html's window.ReactNativeWebView.postMessage method-----//
          const locationData = JSON.parse(event.nativeEvent.data);
          const { lat, lng } = locationData;

          //---getting the address from the Google Geocoding API-----//
          try {
            const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`;
            const response = await fetch(url);
            const json = await response.json();

            let address = "";
            if (json.status === "OK" && json.results[0]) {
              address = json.results[0].formatted_address;
              console.log("The address is:")
              console.log(address)
            } 
            else {
              address = "No address was found";
            }

            //---Getting the names of landmark clicked by the user via the places api----//
            const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=50&key=${GOOGLE_MAPS_API_KEY}`;
            const placesRes = await fetch(placesUrl);
            const placesJson = await placesRes.json();

            let placeName = "";
            if (placesJson.status === "OK" && placesJson.results[0]) {
              placeName = placesJson.results[1].name;
            }

            //----Combining the landmark's name with the address----//
            const displayName = placeName ? `${placeName}, located at ${address}` : `Located at: ${address}`;

            //---updating the address we are sending over + the address displayed in the search bar----//
            setSelectedAddress(displayName);
            setSearchText(address);

          } 
          catch (err) {
              console.error("Reverse geocode or place searching has failed", err);
              setSelectedAddress("Error resolving address");
          }
        }}
      />

      {/*----footer section-----*/}
      <View style={styles.footer}>
        {/*----Displays what the tapped location is called-----*/}
        <Text style={{ color: "white" }}>
          {selectedAddress || "Tap on map or search to select location"}
        </Text>

        {/*----The confirm selectionButton----*/}
        <TouchableOpacity style={styles.confirmButton} onPress={confirmSelection}>
          <Text style={{ color: "white" }}> Confirm </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  //___________CSS affecting just the footer area_________________//
  footer: {
    position: "absolute",
    bottom: 20,
    width: "100%",
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 15,
  },
  
  confirmButton: {
    marginTop: 10,
    backgroundColor: "#4CAF50",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  
  //___________CSS affecting just the map area_________________//

  mapHTMLSect:{
    flex: 1 
  },

  //___________CSS affecting just the search bar area_________________//
  locationSearchBar: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
  },

  searchBarSect:{
    padding: 10, 
    backgroundColor: "#fff",
  },

});