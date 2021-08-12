require([
  "esri/config",
  "esri/Map",
  "esri/views/MapView",

  "esri/layers/FeatureLayer",
  "esri/widgets/Editor",
], function (esriConfig, Map, MapView, FeatureLayer, Editor) {
  // Reference a feature layer to edit
  const myPointsFeatureLayer = new FeatureLayer({
    url: "https://services3.arcgis.com/tvneiQdn1lGDCYmQ/arcgis/rest/services/redlist_species_data_7b024e640fd848a2adf08e43737b5cb3/FeatureServer/0",
  });

  esriConfig.apiKey =
    "AAPK8ef026d991ac4b11a7c7a9d3720cc332Jr165-yVbArur6FY7HNYUnBCsC3PGp6FxVs9nXe_P2bG0xxueOeTbm12ZqoplSAB";

  const map = new Map({
    basemap: "arcgis-topographic", // Basemap layer service

    layers: [myPointsFeatureLayer],
  });

  const view = new MapView({
    container: "viewDiv",
    map: map,
    center: [22.3136, 0],
    zoom: 5,
  });

  // Editor widget
  const editor = new Editor({
    view: view,
  });
  // Add widget to the view
  view.ui.add(editor, "top-right");
});

