const accessToken =
  "pk.eyJ1IjoiYW5kcmV3YzMxIiwiYSI6ImNsZnNwbW40OTA0M3czbW83dXkxcThseTgifQ.tphp4wYRnJjSPjwF0qa15g";

const shapefileUrl = 'shapefiles/fpl_shp.zip';

// Get the tbody element
var tbody = document.querySelector("#product-table tbody");

// Create a dropdown list of products
const productDropdown = document.querySelector("#product-filter");
const allOption = document.createElement("option");
allOption.textContent = "All Products";
allOption.selected = true;
productDropdown.insertBefore(allOption, productDropdown.firstChild);

// Define endpoint URL for the API
let endpoint = "https://api.weather.gov/alerts/active?area=FL";

// Function to update the product dropdown menu based on the selected state
const updateProductDropdown = (data) => {
  // Clear the existing dropdown options
  productDropdown.innerHTML = "";
  
  // Get the list of unique product names for the selected state
  const products = [
    ...new Set(data.features.map((item) => item.properties.event)),
  ];

  // Add the "All Products" option
  const allOption = document.createElement("option");
  allOption.textContent = "All Products";
  allOption.selected = true;
  productDropdown.appendChild(allOption);

  // Add the product options
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
      console.log('Loading shapefile:', shapefileUrl); // Add logging statement
      const response = await fetch(shapefileUrl);
      const arrayBuffer = await response.arrayBuffer();
      const geojson = await shp(arrayBuffer);
      console.log('Shapefile loaded, adding to map:', geojson); // Add logging statement

      const layerGroup = L.layerGroup().addTo(map); // Create a layer group for the polygons

      L.geoJSON(geojson, {
        style: {
          color: 'black',
          weight: 2,
          fillColor: 'yellow',
          fillOpacity: 0.4,
        },
        onEachFeature: function(feature, layer) { // Add a click event listener to each polygon layer
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




// Grab all the current products for the list of items

const poll_data = () => {
  fetch(endpoint)
    .then((response) => response.json())
    .then((data) => {
      // Get the list of unique product names
      const products = [
        ...new Set(data.features.map((item) => item.properties.event)),
      ];
      products.forEach((product) => {
        const option = document.createElement("option");
        option.textContent = product;
        productDropdown.appendChild(option);
      });

      // Check if the "All Products" option exists, and create it if it doesn't
      const firstChild = productDropdown.firstElementChild;
      if (!firstChild || firstChild.textContent !== "All Products") {
        const allOption = document.createElement("option");
        allOption.textContent = "All Products";
        allOption.selected = true;
        productDropdown.insertBefore(allOption, productDropdown.firstChild);
      }
    });
};
const clear_menu = () => {
  productDropdown.innerHTML = "";
};

// Function to fetch data from the API and update the table
const fetchData = () => {
  // Clear the table body
  //tbody.innerHTML = '';
  // Make an HTTP request to the endpoint and retrieve the response as JSON
  fetch(endpoint)
    .then((response) => response.json())
    .then((data) => {
      updateProductDropdown(data);
      // Declare constants outside of the string'
      const mapValue = `const map = L.map("map").setView([0, 0], 1); L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=${accessToken}', { attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' + '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' + 'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>', id: 'mapbox/streets-v11', tileSize: 512, zoomOffset: -1, accessToken: '${accessToken}' }).addTo(map);`;
      const handleViewProductClick = (data) => {
        // Format the feature data as a string
        let wmo = JSON.stringify(data.properties.parameters.WMOidentifier);
        wmo = wmo.split(" ")[1];
        const formattedData = `\nFORECAST OFFICE: ${data.properties.senderName}  (${wmo})\n\nEVENT: ${data.properties.event}\n\nAREAS AFFECTED...${data.properties.areaDesc}\n\n${data.properties.description}\n `;

        if (!data.geometry || !data.geometry.coordinates) {
          console.error("Coordinates not found in the data:", data);
          // Open a new page to display the formatted data
          const newPage = window.open("", "_blank");
          newPage.document.write("<!DOCTYPE html>");
          newPage.document.write("<html>");
          newPage.document.write("<head>");
          newPage.document.write("<title>Porduct Info</title>");
          newPage.document.write("<style>pre { font-size: 16px; }</style>"); // add CSS to set font size
          newPage.document.write("</head>");
          newPage.document.write("<body>");
          newPage.document.write("<pre>");
          newPage.document.write(formattedData);
          newPage.document.write("</pre>");
          newPage.document.write("</body>");
          newPage.document.write("</html>");
          return;
        }

        let geometry = data.geometry.coordinates;

        // Open a new page to display the formatted data and the map
        const newPage = window.open("", "_blank");
        newPage.document.write("<!DOCTYPE html>");
        newPage.document.write("<html>");
        newPage.document.write("<head>");
        newPage.document.write("<title>Product Info</title>");
        newPage.document.write(
          "<script src='https://unpkg.com/leaflet@1.7.1/dist/leaflet.js'></script>"
        );
        newPage.document.write(
          "<link rel='stylesheet' href='https://unpkg.com/leaflet@1.7.1/dist/leaflet.css'>"
        );
        newPage.document.write("<style>pre { font-size: 16px; }</style>"); // add CSS to set font size
        newPage.document.write(
          "<script src='https://cdn.jsdelivr.net/npm/shpjs@4.0.4/dist/shp.min.js'></script>"
        );
        newPage.document.write("</head>");
        newPage.document.write("<body>");
        newPage.document.write("<div style='display: flex;'>");
        newPage.document.write("<pre style='width: 50%; overflow: auto;'>");


      // Declare constants inside the string
        const geojsonLayerValue = `
          const geojsonLayer = L.geoJSON(${JSON.stringify(data.geometry)}, {
            style: {
              color: 'black',
              weight: 3,
              fillColor: 'lightblue',
              fillOpacity: 0.5
            }
          }).addTo(map);
          const data = '${JSON.stringify(formattedData)}';
          geojsonLayer.on('click', function(e) {
            L.popup()
              .setLatLng(e.latlng)
              .setContent(data)
              .openOn(map);
          });
          map.setView([${geometry[0][0][1]}, ${geometry[0][0][0]}], 9);
        `;
        const radarLayer = `const radar = L.tileLayer('https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913/{z}/{x}/{y}.png', {
          attribution: 'Base Reflectivity © Iowa State University',
          tileSize: 512,
          zoomOffset: -1
        }).addTo(map);`;
        
        // Write the formatted data and the map to the new page
        newPage.document.write(formattedData);
        newPage.document.write("</pre>");
        newPage.document.write(
          `<div id='map' style='width: 50%; height: 400px;'></div>`
        );
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

      const filterTable = () => {
        tbody.innerHTML = ""; // clear the table
        const selectedProduct = productDropdown.value;
        if (selectedProduct === "All Products") {
          data.features.forEach((item) => {
            // Create a new row and cells for each column
            var row = document.createElement("tr");

            // Create a cell for the "View Product" button
            var viewCell = document.createElement("td");
            var viewButton = document.createElement("button");
            viewButton.textContent = "View Product";
            viewButton.addEventListener("click", () =>
              handleViewProductClick(item)
            );
            viewCell.appendChild(viewButton);
            row.appendChild(viewCell);

            // Create cells for the other columns
            var issuanceCell = document.createElement("td");
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
            issuanceCell.textContent = formattedDate + " UTC";;
            row.appendChild(issuanceCell);

            var productCell = document.createElement("td");
            productCell.textContent = item.properties.event;
            row.appendChild(productCell);


            if (item.properties.event === "Tornado Warning") {
              productCell.style.backgroundColor = "#DA70D6";
            } else if (item.properties.event === "Severe Thunderstorm Warning") {
              productCell.style.backgroundColor = "#FAA0A0";
            } else if (item.properties.event === "Special Weather Statement") {
              productCell.style.backgroundColor = "#C19A6B";
            }

            var threatCell = document.createElement("td");
            threatCell.textContent = item.properties.severity;
            row.appendChild(threatCell);

            var stationCell = document.createElement("td");
            stationCell.textContent = JSON.stringify(
              item.properties.parameters.WMOidentifier
            ).split(" ")[1];
            row.appendChild(stationCell);
            // Add the new row to the table
            tbody.appendChild(row);
          });
        } else {
          data.features
            .filter((item) => item.properties.event === selectedProduct)
            .forEach((item) => {
              // Create a new row and cells for each column
              var row = document.createElement("tr");

              // Create a cell for the "View Product" button
              var viewCell = document.createElement("td");
              var viewButton = document.createElement("button");
              viewButton.textContent = "View Product";
              viewButton.addEventListener("click", () =>
                handleViewProductClick(item)
              );
              viewCell.appendChild(viewButton);
              row.appendChild(viewCell);

              // Create cells for the other columns
              var issuanceCell = document.createElement("td");
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
              issuanceCell.textContent = formattedDate + " UTC"; ;
              row.appendChild(issuanceCell);

              var productCell = document.createElement("td");
              productCell.textContent = item.properties.event;
              row.appendChild(productCell);

              if (item.properties.event === "Tornado Warning") {
                productCell.style.backgroundColor = "#DA70D6";
              } else if (item.properties.event === "Severe Thunderstorm Warning") {
                productCell.style.backgroundColor = "#FAA0A0";
              } else if (item.properties.event === "Special Weather Statement") {
                productCell.style.backgroundColor = "#C19A6B";
              }

              var threatCell = document.createElement("td");
              threatCell.textContent = item.properties.severity;
              row.appendChild(threatCell);

              var stationCell = document.createElement("td");
              stationCell.textContent = JSON.stringify(
                item.properties.parameters.WMOidentifier
              ).split(" ")[1];
              row.appendChild(stationCell);

              // Add the new row to the table
              tbody.appendChild(row);
            });
        }
      };

      // Attach an event listener to the product dropdown
      productDropdown.addEventListener("change", filterTable);

      // Populate the table with all the data
      filterTable();
    });
};

// Call poll data
poll_data();

// Call fetchData() once when the page loads
fetchData();

// Call fetchData() every two minutes
setInterval(fetchData, 120000);

// Call poll_data() every 1.98 minutes
setInterval(poll_data, 119003);

// Clear the menu every 1.98 minutes
setInterval(clear_menu, 119000);
