import mapboxgl from "mapbox-gl";
import {
  ROADLESS_SOURCE_LAYER,
  OVERLAY_COLOR,
  FILL_OPACITY,
  PCT_COLOR,
  OREGON_TRAILS_COLOR,
  CONGRESSIONAL_DISTRICTS_COLOR,
} from "../config";

export function addMapLayers(map: mapboxgl.Map) {
  // Find the first symbol layer to position our layers correctly
  const firstSymbol = map
    .getStyle()
    .layers?.find((l) => l.type === "symbol")?.id;

  // Roadless fill
  if (!map.getLayer("roadless-fill")) {
    map.addLayer(
      {
        id: "roadless-fill",
        type: "fill",
        source: "roadless-src",
        "source-layer": ROADLESS_SOURCE_LAYER,
        filter: ["==", ["geometry-type"], "Polygon"],
        paint: {
          "fill-color": OVERLAY_COLOR,
          "fill-opacity": FILL_OPACITY,
          "fill-translate": [0, 0],
          "fill-translate-anchor": "map",
        },
      },
      firstSymbol
    );
  }

  // Oregon Trails line layer
  if (!map.getLayer("oregon-trails-line")) {
    map.addLayer(
      {
        id: "oregon-trails-line",
        type: "line",
        source: "oregon-trails",
        minzoom: 8,
        layout: {
          "line-cap": "round",
          "line-join": "round",
        },
        paint: {
          "line-color": OREGON_TRAILS_COLOR,
          "line-width": [
            "interpolate",
            ["linear"],
            ["zoom"],
            10,
            0.8,
            12,
            1.5,
            14,
            2.5,
            16,
            4,
          ],
          "line-opacity": 0.9,
          "line-translate": [0, 0],
          "line-translate-anchor": "map",
        },
      },
      "roadless-fill"
    );
  }

  // Roadless outline
  if (!map.getLayer("roadless-line")) {
    map.addLayer(
      {
        id: "roadless-line",
        type: "line",
        source: "roadless-src",
        "source-layer": ROADLESS_SOURCE_LAYER,
        filter: [
          "any",
          ["==", ["geometry-type"], "LineString"],
          ["==", ["geometry-type"], "Polygon"],
        ],
        paint: {
          "line-color": OVERLAY_COLOR,
          "line-width": 1.5,
          "line-translate": [0, 0],
          "line-translate-anchor": "map",
        },
      },
      firstSymbol
    );
  }

  // PCT line
  if (!map.getLayer("pct-line")) {
    map.addLayer(
      {
        id: "pct-line",
        type: "line",
        source: "pct",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": PCT_COLOR,
          "line-opacity": 0.98,
          "line-width": [
            "interpolate",
            ["linear"],
            ["zoom"],
            3,
            1.4,
            8,
            2.8,
            12,
            4.2,
            16,
            6.5,
            20,
            10,
          ],
          "line-dasharray": [
            "step",
            ["zoom"],
            ["literal", [2, 2]],
            10,
            ["literal", [3, 2]],
            16,
            ["literal", [4, 2]],
          ],
          "line-translate": [0, 0],
          "line-translate-anchor": "map",
        },
      },
      firstSymbol
    );
  }

  // Congressional Districts line layer
  if (!map.getLayer("congressional-districts-line")) {
    map.addLayer({
      id: "congressional-districts-line",
      type: "line",
      source: "congressional-districts",
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": CONGRESSIONAL_DISTRICTS_COLOR,
        "line-opacity": 0.8,
        "line-width": 1.5,
        "line-translate": [0, 0],
        "line-translate-anchor": "map",
      },
    });
  }

  // Congressional Districts fill layer
  if (!map.getLayer("congressional-districts-fill")) {
    map.addLayer(
      {
        id: "congressional-districts-fill",
        type: "fill",
        source: "congressional-districts",
        maxzoom: 8, //Max zoom for shading
        paint: {
          "fill-color": CONGRESSIONAL_DISTRICTS_COLOR,
          "fill-opacity": 0.1, //light shading when not selected
          "fill-translate": [0, 0], //ensure proper positioning on 3D terrain
          "fill-translate-anchor": "map",
        },
      },
      "congressional-districts-line" // Position below the line layer
    );
  }
}
