const accessToken =
  "pk.eyJ1IjoiYW5kcmV3YzMxIiwiYSI6ImNsZnNwbW40OTA0M3czbW83dXkxcThseTgifQ.tphp4wYRnJjSPjwF0qa15g";

const shapefileUrl = 'shapefiles/fpl_shp.zip';

var tbody = document.querySelector("#product-table tbody");
const productDropdown = document.querySelector("#product-filter");

// Seed the dropdown with "All Products" before the first fetch completes
const seedOption = document.createElement("option");
seedOption.textContent = "All Products";
seedOption.selected = true;
productDropdown.appendChild(seedOption);

let endpoint = "https://api.weather.gov/alerts/active?area=FL";
let currentData = null;

const updateProductDropdown = (data) => {
  productDropdown.innerHTML = "";

  const products = [
    ...new Set(data.features.map((item) => item.properties.event)),
  ];

  const allOption = document.createElement("option");
  allOption.textContent = "All Products";
  allOption.selected = true;
  productDropdown.appendChild(allOption);

  products.forEach((product) => {
    const option = document.createElement("option");
    option.textContent = product;
    productDropdown.appendChild(option);
  });
};

const updateEndpoint = () => {
  const state = document.getElementById("state-filter").value;
  if (state) {
    endpoint = `https://api.weather.gov/alerts/active?area=${state}`;
    fetchData();
  }
};

const addShapefileToMapFunction = `
  async function addShapefileToMap(shapefileUrl, map) {
    try {
      const response = await fetch(shapefileUrl);
      const arrayBuffer = await response.arrayBuffer();
      const geojson = await shp(arrayBuffer);

      const layerGroup = L.layerGroup().addTo(map);

      L.geoJSON(geojson, {
        style: {
          color: 'black',
          weight: 2,
          fillColor: 'yellow',
          fillOpacity: 0.4,
        },
        onEachFeature: function(feature, layer) {
          layer.on('click', function() {
            layer.bindPopup(JSON.stringify(feature.properties.NAME)).openPopup();
          });
        }
      }).addTo(layerGroup);
    } catch (error) {
      console.error('Error adding shapefile to map:', error);
    }
  }
`;

const handleViewProductClick = (item) => {
  let wmo = JSON.stringify(item.properties.parameters.WMOidentifier);
  wmo = wmo.split(" ")[1];
  const formattedData = `\nFORECAST OFFICE: ${item.properties.senderName}  (${wmo})\n\nEVENT: ${item.properties.event}\n\nAREAS AFFECTED...${item.properties.areaDesc}\n\n${item.properties.description}\n `;

  if (!item.geometry || !item.geometry.coordinates) {
    console.error("Coordinates not found in the data:", item);
    const newPage = window.open("", "_blank");
    newPage.document.write("<!DOCTYPE html>");
    newPage.document.write("<html>");
    newPage.document.write("<head>");
    newPage.document.write("<title>Product Info</title>");
    newPage.document.write("<style>pre { font-size: 16px; }</style>");
    newPage.document.write("</head>");
    newPage.document.write("<body>");
    newPage.document.write("<pre>");
    newPage.document.write(formattedData);
    newPage.document.write("</pre>");
    newPage.document.write("</body>");
    newPage.document.write("</html>");
    return;
  }

  const geometry = item.geometry.coordinates;

  const mapValue = `const map = L.map("map").setView([0, 0], 1); L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=${accessToken}', { attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' + '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' + 'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>', id: 'mapbox/streets-v11', tileSize: 512, zoomOffset: -1, accessToken: '${accessToken}' }).addTo(map);`;

  const geojsonLayerValue = `
    const geojsonLayer = L.geoJSON(${JSON.stringify(item.geometry)}, {
      style: {
        color: 'black',
        weight: 3,
        fillColor: 'lightblue',
        fillOpacity: 0.5
      }
    }).addTo(map);
    const popupData = '${JSON.stringify(formattedData)}';
    geojsonLayer.on('click', function(e) {
      L.popup()
        .setLatLng(e.latlng)
        .setContent(popupData)
        .openOn(map);
    });
    map.setView([${geometry[0][0][1]}, ${geometry[0][0][0]}], 9);
  `;

  const radarLayer = `const radar = L.tileLayer('https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913/{z}/{x}/{y}.png', {
    attribution: 'Base Reflectivity © Iowa State University',
    tileSize: 512,
    zoomOffset: -1
  }).addTo(map);`;

  const newPage = window.open("", "_blank");
  newPage.document.write("<!DOCTYPE html>");
  newPage.document.write("<html>");
  newPage.document.write("<head>");
  newPage.document.write("<title>Product Info</title>");
  newPage.document.write("<script src='https://unpkg.com/leaflet@1.7.1/dist/leaflet.js'></script>");
  newPage.document.write("<link rel='stylesheet' href='https://unpkg.com/leaflet@1.7.1/dist/leaflet.css'>");
  newPage.document.write("<style>pre { font-size: 16px; }</style>");
  newPage.document.write("<script src='https://cdn.jsdelivr.net/npm/shpjs@4.0.4/dist/shp.min.js'></script>");
  newPage.document.write("</head>");
  newPage.document.write("<body>");
  newPage.document.write("<div style='display: flex;'>");
  newPage.document.write("<pre style='width: 50%; overflow: auto;'>");
  newPage.document.write(formattedData);
  newPage.document.write("</pre>");
  newPage.document.write("<div id='map' style='width: 50%; height: 400px;'></div>");
  newPage.document.write("</div>");
  newPage.document.write("<script>");
  newPage.document.write(addShapefileToMapFunction);
  newPage.document.write(mapValue);
  newPage.document.write(geojsonLayerValue);
  newPage.document.write(radarLayer);
  newPage.document.write("</script>");
  newPage.document.write("<script>");
  newPage.document.write(`addShapefileToMap('${shapefileUrl}', map);`);
  newPage.document.write("</script>");
  newPage.document.write("</body>");
  newPage.document.write("</html>");
  newPage.document.close();
};

const buildTableRow = (item) => {
  const row = document.createElement("tr");

  const viewCell = document.createElement("td");
  const viewButton = document.createElement("button");
  viewButton.textContent = "View Product";
  viewButton.addEventListener("click", () => handleViewProductClick(item));
  viewCell.appendChild(viewButton);
  row.appendChild(viewCell);

  const issuanceCell = document.createElement("td");
  const issuanceDate = new Date(item.properties.sent);
  const formattedDate = issuanceDate
    .toLocaleString("en-US", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      weekday: "short",
    })
    .replace(/\/\d{4}/, "")
    .replace(",", "");
  issuanceCell.textContent = formattedDate;
  row.appendChild(issuanceCell);

  const productCell = document.createElement("td");
  productCell.textContent = item.properties.event;
  if (item.properties.event === "Tornado Warning") {
    productCell.style.backgroundColor = "#DA70D6";
  } else if (item.properties.event === "Severe Thunderstorm Warning") {
    productCell.style.backgroundColor = "#FAA0A0";
  } else if (item.properties.event === "Special Weather Statement") {
    productCell.style.backgroundColor = "#C19A6B";
  }
  row.appendChild(productCell);

  const threatCell = document.createElement("td");
  threatCell.textContent = item.properties.severity;
  row.appendChild(threatCell);

  const stationCell = document.createElement("td");
  stationCell.textContent = JSON.stringify(
    item.properties.parameters.WMOidentifier
  ).split(" ")[1];
  row.appendChild(stationCell);

  return row;
};

const filterTable = () => {
  if (!currentData) return;
  tbody.innerHTML = "";
  const selectedProduct = productDropdown.value;
  const items =
    selectedProduct === "All Products"
      ? currentData.features
      : currentData.features.filter(
          (item) => item.properties.event === selectedProduct
        );
  items.forEach((item) => tbody.appendChild(buildTableRow(item)));
};

// Attach the filter listener once at module level
productDropdown.addEventListener("change", filterTable);

const fetchData = () => {
  fetch(endpoint)
    .then((response) => response.json())
    .then((data) => {
      currentData = data;
      updateProductDropdown(data);
      filterTable();
    });
};

fetchData();

setInterval(fetchData, 120000);
