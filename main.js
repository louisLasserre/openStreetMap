

// Fonction d'initialisation de la carte
import myJson from './data.json' assert {type: 'json'};


document.addEventListener('DOMContentLoaded', async () => {
    const carte = new Map

    document.querySelector('#initMap').addEventListener('submit', async e => {
        e.preventDefault()
        const myFormData = new FormData(e.target);
        const formDataObj = Object.fromEntries(myFormData.entries());

        await carte.showMap(formDataObj.lat, formDataObj.long, formDataObj.zoom)

    })

    document.querySelector('#addMarker').addEventListener('submit', async e => {
        e.preventDefault()
        const myFormData = new FormData(e.target);
        const formDataObj = Object.fromEntries(myFormData.entries());


        carte.addParams(formDataObj)

    })
    document.querySelector('#mapScale').addEventListener('click', e=> {
        e.target.classList.toggle('check')
        if (e.target.classList.contains('check')){
            carte.showSize(true)
        }else{
            carte.showSize(false)
        }
    })
})


class Map{
    constructor() {
    }

    showMap(lat, long, zoom) {

        let macarte;



        // Créer l'objet "macarte" et l'insèrer dans l'élément HTML qui a l'ID "map"
        macarte = L.map('map').setView([lat, long], zoom);
        // Leaflet ne récupère pas les cartes (tiles) sur un serveur par défaut. Nous devons lui préciser où nous souhaitons les récupérer. Ici, openstreetmap.fr
        L.tileLayer('https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png', {
            // Il est toujours bien de laisser le lien vers la source des données
            attribution: 'données © <a href="//osm.org/copyright">OpenStreetMap</a>/ODbL - rendu <a href="//openstreetmap.fr">OSM France</a>',
            minZoom: 1,
            maxZoom: 20
        }).addTo(macarte);

        this.map = macarte


        //click de la map
        var popup = L.popup();

        function onMapClick(e) {
            popup
                .setLatLng(e.latlng)
                .setContent("You clicked the map at " + e.latlng.toString())
                .openOn(macarte);
        }

        macarte.on('click', onMapClick);

        getCoordinates2(myJson, this.map)
    }

    addParams(data){
        const macarte = this.map

        if (macarte){
            switch (data.type){
                case "marker":

                    let customIcon = {
                        //absolute or relative path
                        iconUrl:"/mapIcon.png",
                        iconSize:[30,45]
                    }
                    let myIcon = L.icon(customIcon)

                    //options for the marker
                    let iconOptions = {
                        title: "C'est le DV, ouaa",
                        draggable: true,
                        alt: "alt attribute for accessibility",

                        icon: myIcon
                        //more options here --> https://leafletjs.com/reference-1.7.1.html#icon
                    }
                    // show a marker on the map
                    L.marker({lon: data.markerlong, lat: data.markerlat}, iconOptions).bindPopup(data.markertext).addTo(macarte);



                    /*let MyiconOptions = {
                        title:"company name",
                        draggable:true,
                        icon:myIcon
                    }
                    L.marker({lon: '3.1278', lat: '44.7711658'}, MyiconOptions).bindPopup("text").addTo(macarte);
                    */

                    break;
                case "message":

                    //personalize pop up
                    let popup = L.popup()
                        .setLatLng([data.markerlat, data.markerlong] )
                        .setContent("<p>"+ data.text +"</p>")
                        //on peut mettre du html dans setContent exemple:
                        //.setContent("<p>new popup</br> Hello</p>")

                        .openOn(macarte);
                    break;
                case "circle":
                    var circle = L.circle([data.markerlat, data.markerlong], {
                        //on peut changer la couleur et le diamètre du cercle
                        color: 'red',
                        fillColor: '#f03',
                        fillOpacity: 0.5,
                        radius: 30000
                    }).addTo(macarte);

                    break;
                case "polygon":
                    var polygon = L.polygon([
                        [48.609, -0.08],
                        [46.403, -1.06],
                        [48.51, -1.047]
                    ], { color: 'violet',}).addTo(macarte);
                    break;
                case "css-marker":
                    var myCSSIcon = L.divIcon({className: 'my-div-icon'});
                    // you can set .my-div-icon styles in CSS

                    L.marker([data.markerlat, data.markerlong], {icon: myCSSIcon}).addTo(macarte);
                    break;
            }




        }
    }

    showSize(status) {
        let macarte = this.map
        if (this.map){

            if (status){
                // show the scale bar on the lower left corner
                this.scale = L.control.scale({imperial: true, metric: true}).addTo(macarte);
            }else {

                macarte.removeControl(this.scale)
            }
        }
    }

}


async function getCoordinates2(places, map){
    try {
        const step = 10;
        var standing = 0;
        const placesSize = places.length

        for (let i = 0; i < (placesSize/step); i++){
            getCoordinates2Fetch(i, step, standing, places, map)
        }
        console.log(standing)}
    catch (errors) {
        console.log(errors)
        errors.forEach((error) => console.error(error));
    }
}



async function getCoordinates2Fetch(i, step, standing, places, map) {
    const globalIndex = i
    const urls = []
    const finalData = []


    for (let j = 0; j < step; j++){
        let url = "https://data.opendatasoft.com/api/records/1.0/search/?dataset=geonames-postal-code%40public&q=FR&facet=country_code&facet=postal_code&refine.country_code=FR&refine.postal_code="+places[i*step+j].postCode
        urls.push(url)


    }

    const requests = urls.map((url) => fetch(url));
    const responses = await Promise.all(requests);

    const errors = responses.filter((response) => !response.ok);
    if (errors.length > 0) {
        throw errors.map((response) => Error(response.statusText));
    }

    const json = responses.map((response) => response.json());
    const data = await Promise.all(json);


    data.forEach(function (dataFetched, j){

        let jsonLatLong = {}


        if (dataFetched.records.length > 1 && places[globalIndex*step+j].cityName) {

            console.log(dataFetched.records, "--", places[globalIndex*step+j].cityName)
            let findTheOne = dataFetched.records.find(record => record.fields.place_name === places[globalIndex*step+j].cityName)
            jsonLatLong.latitude = findTheOne.fields.latitude
            jsonLatLong.longitude = findTheOne.fields.longitude
            jsonLatLong.cityName = findTheOne.fields.place_name

        } else {
            jsonLatLong.latitude = dataFetched.records[0].fields.latitude
            jsonLatLong.longitude = dataFetched.records[0].fields.longitude
            jsonLatLong.cityName = dataFetched.records[0].fields.place_name
        }


        jsonLatLong.habitant = places[globalIndex*step+j].habitant

        finalData.push(jsonLatLong)
    })


    console.log("finalData ",finalData)

    convertAndCreateMarkers(finalData, map)
}

async function convertAndCreateMarkers(data, map) {
    //On convertit les donnéees JSON en GEOJSON
    var jsonFeatures = [];
    data.forEach(function(point){
        var lat = point.latitude;
        var lon = point.longitude;

        var feature = {
            type: 'Feature',
            properties: point,
            geometry: {
                type: 'Point',
                coordinates: [lon,lat]
            }
        };

        jsonFeatures.push(feature);
    });

    var geoJson = { type: 'FeatureCollection', features: jsonFeatures };

    let layer = L.geoJson(geoJson, {
        onEachFeature: function (feature, layer) {

            layer.bindPopup("<h1>"+feature.properties.habitant+"</h1><br><p>réside à "+feature.properties.cityName);

        }
    })


    layer.addTo(map);
}







