// Load map

console.error ("i use arch btw");

let coordinfo = {};

function refresh_weather () {;
    const curdate = new Date(
        document.getElementById("date").valueAsNumber
    );

    document.getElementById("results").style["width"] = "var(--full-weather-results-catalog-size)";
    document.getElementById("vertical_notice").style["opacity"] = "0";
    document.getElementById("loading_screen").style["opacity"] = "1";
    document.getElementById("loaded_content").style["opacity"] = "0";
    document.getElementById("bodybox").style["gap"] = "var(--catalog-spacing-l)";

    console.log (coordinfo, curdate);
    console.log (curdate.getUTCDate(), curdate.getUTCMonth(), curdate.getUTCFullYear());
    
    fetch (
        "http://127.0.0.1:5000/weather?lat=" + coordinfo.lat + 
        "&lon=" + coordinfo.lng + 
        "&dd1=" + curdate.getUTCDate() + "&mm1=" + (curdate.getUTCMonth() + 1) + "&yy1=" + curdate.getUTCFullYear() + 
        "&dd2=" + curdate.getUTCDate() + "&mm2=" + (curdate.getUTCMonth() + 1) + "&yy2=" + curdate.getUTCFullYear())
    .then ((response) => {
        if (!response.ok)
            throw new Error("HTTP error " + response.status);

        return response.json();
    }).then ((json) => {
        console.log (json[0][Object.keys(json[0])[0]]);

        // json[0][Object.keys(json[0])[0]]

        const info = json[0][Object.keys(json[0])[0]];

        document.getElementById("weather-temperature").textContent = info["temperature"] + "°C";
        document.getElementById("weather-precipitation").textContent = info["precipitation"] + "mm";
        if (info["rain chance"] == undefined) {
            document.getElementById("weather-rain-chance").style["display"] = "none";
        } else {
            document.getElementById("weather-rain-chance").style["display"] = "unset";
            document.getElementById("weather-rain-chance").textContent = "Chance for rain: " + info["rain chance"] + "%";
        }
        document.getElementById("weather-humidity").textContent = info["humidity"] + "%";
        document.getElementById("weather-wind-speed").textContent = Math.max(info["windspeed"], 0) + "m/s";
        document.getElementById("weather-pressure").textContent = info["pressure"] + "hPa";

    }).then (() => {
        document.getElementById("loading_screen").style["opacity"] = "0";
        document.getElementById("loaded_content").style["opacity"] = "1";
    }).catch ((error) => {
        mdui.alert({
            headline: "Failed to connect",
            description: "Check your internet connection",
            confirmText: "OK"
        });
        console.error ("Error in loading weather (after location select): ", error);
        reject();
    });
}

new Promise((resolve, reject) => {
    // Load OpenStreetMaps

    var map = L.map('map').setView([41.69411, 44.83368], 13);

    let layer = new L.TileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png');
    map.addLayer(layer);

    // let marker = new L.Marker([51.958, 9.141]);
    // alert("You clicked the map at " + e.latlng + ", ");
    map.locate({'setView':1});
    // console.log(map.getCenter());
    let marker = new L.Marker([map.getCenter().lat, map.getCenter().lng]);
    marker.addTo(map);
    coordinfo = marker._latlng;

    map.on("locationfound", function(e){
        // marker = new L.Marker([map.getCenter().lat, map.getCenter().lng]);
        marker.setLatLng(map.getCenter());
        coordinfo = e.latlng;
    });

    map.on("click", function(e){
        coordinfo = e.latlng;
        map.setView([e.latlng.lat, e.latlng.lng],e.zoom);
        marker.setLatLng(e.latlng);
    });

    document.getElementById("location-fab").addEventListener("click", ()=>{
        refresh_weather();
    });

    // dynamically change map size
    (new ResizeObserver((entries) => {
        map.invalidateSize();
    })).observe(document.getElementById("results"));

    resolve();
}).catch ((error) => {
    console.error ("Error in OpenStreetMaps: ", error);
});

new Promise((resolve, reject) => {
    document.getElementById('date').valueAsNumber = (new Date()).getTime();

    let advanced_opened = false;
    function close_advanced_menu () {
        document.getElementById("results").style["width"] = "var(--full-weather-results-catalog-size)";
        document.getElementById("bodybox").style["gap"] = "var(--catalog-spacing-l)";
        advanced_opened = false;
    }
    function open_advanced_menu () {
        document.getElementById("results").style["width"] = "var(--fullscreen-weather-results-catalog-size)";
        document.getElementById("bodybox").style["gap"] = "0";
        advanced_opened = true;
    }

    document.getElementById("go_back_button").addEventListener("click", ()=>{
        if (advanced_opened == true) {
            close_advanced_menu ();
        } else {
            document.getElementById("results").style["width"] = "var(--empty-weather-results-catalog-size)";
            document.getElementById("vertical_notice").style["opacity"] = "1";
            document.getElementById("loading_screen").style["opacity"] = "0";
            document.getElementById("loaded_content").style["opacity"] = "0";
            document.getElementById("bodybox").style["gap"] = "var(--catalog-spacing-l)";
        }
    });

    document.getElementById("advanced-fab").addEventListener("click", ()=>{
        if (advanced_opened == false) {
            open_advanced_menu ();
        } else {
            close_advanced_menu ();
        }
    });

    function createChart(id, name, request_name) {
        const ctx = document.getElementById(id);


        const start_date = new Date (
            document.getElementById("date").valueAsNumber - 24 * 60 * 60 * 1000 * 15
        );
        const end_date = new Date (
            document.getElementById("date").valueAsNumber + 24 * 60 * 60 * 1000 * 15
        );

        let data = [];
        let labels = [];

        fetch (
            "http://127.0.0.1:5000/weather?lat=" + coordinfo.lat + 
            "&lon=" + coordinfo.lng + 
            "&dd1=" + start_date.getUTCDate() + "&mm1=" + (start_date.getUTCMonth() + 1) + "&yy1=" + start_date.getUTCFullYear() + 
            "&dd2=" + end_date.getUTCDate() + "&mm2=" + (end_date.getUTCMonth() + 1) + "&yy2=" + end_date.getUTCFullYear())
        .then ((response) => {
            if (!response.ok)
                throw new Error("HTTP error " + response.status);

            return response.json();
        }).then ((json) => {
            console.log ("uhh", json);
            for (let ind = 0; ind < json.length; ind++) {
                const obj = json[ind];
                const key = Object.keys(obj)[0];
                console.log (key, obj[key])
                labels.push (key);
                data.push (
                    Math.max (0, obj[key]["temperature"])
                );
            }

            console.log (labels);
            console.log (data);
        }).then (() => {
            new Chart(ctx, {
                type: 'bar',
                data: {
                labels: labels,
                    datasets: [{
                        label: name,
                        data: data,
                        borderWidth: 1
                    }]
                },
                options: {
                    plugins: {
                        title: {
                            display: true,
                            text: name
                        },
                        legend: {
                            display: false
                        }
                    },
                    maintainAspectRatio: false,
                    responsive: true
                }
            });
        }).catch ((error) => {
            mdui.alert({
                headline: "Failed to connect",
                description: "Check your internet connection",
                confirmText: "OK"
            });
            console.error ("Error in loading " + name + " chart: ", error);
            reject();
        });
    }
    createChart ("temperature_graph", "Temperature", "temperature");
    createChart ("precipation_graph", "Precipation", "precipitation");
    createChart ("humidity_graph", "Humidity", "humidity");
    // createChart ("rainchance_graph", "Rain chance", "rain chance");
    createChart ("winds_graph", "Wind speed", "windspeed");
    // createChart ("pressure_graph", "Pressure", "pressure");

    resolve();
}).catch ((error) => {
    console.error ("Error: ", error);
});