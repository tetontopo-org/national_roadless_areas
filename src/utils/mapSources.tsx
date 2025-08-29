import mapboxgl from "mapbox-gl";
import { ROADLESS_TILESET_ID } from "../config";

export function addMapSources(map: mapboxgl.Map) {
  // Roadless source
  if (!map.getSource("roadless-src")) {
    map.addSource("roadless-src", {
      type: "vector",
      url: `mapbox://${ROADLESS_TILESET_ID}`,
    });
  }

  // PCT source (local)
  if (!map.getSource("pct")) {
    map.addSource("pct", {
      type: "geojson",
      data: "/data/pct_or_simplified.geojson",
      generateId: true,
    });
  }

  // Trails source (local)
  if (!map.getSource("oregon-trails")) {
    map.addSource("oregon-trails", {
      type: "geojson",
      data: "/data/Oregon_trails.geojson",
      promoteId: "OBJECTID_1",
    });
  }

  // Congressional Districts source (local)
  if (!map.getSource("congressional-districts")) {
    map.addSource("congressional-districts", {
      type: "geojson",
      data: "/data/OR_Congressional_Districts.geojson",
      generateId: true,
    });
  }
}
