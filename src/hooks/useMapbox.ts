import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { CUSTOM_STYLE_OVERRIDES } from "../config";

export function useMapbox(
  containerId: string,
  style: string,
  center = [-110.6, 41] as [number, number],
  zoom = 5.25
) {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (mapRef.current) return;

    mapRef.current = new mapboxgl.Map({
      container: containerId,
      style,
      center,
      zoom,
      pitch: 35,
      bearing: 0,
    });

    mapRef.current.addControl(new mapboxgl.FullscreenControl(), "top-right");
    mapRef.current.addControl(
      new mapboxgl.NavigationControl({
        showCompass: true,
        showZoom: true,
        visualizePitch: true,
      }),
      "top-right"
    );
    mapRef.current.addControl(
      new mapboxgl.ScaleControl({ maxWidth: 150, unit: "imperial" })
    );

    function onLoad() {
      setReady(true);

      // Add 3D terrain
      if (mapRef.current) {
        mapRef.current.addSource("mapbox-terrain", {
          type: "raster-dem",
          url: "mapbox://mapbox.mapbox-terrain-dem-v1",
          tileSize: 512,
          maxzoom: 14,
        });

        // Add the DEM source as a terrain layer with consistent exaggeration across zooms
        mapRef.current.setTerrain({
          source: "mapbox-terrain",
          exaggeration: 1.5,
        });

        // Add sky layer for enhanced 3D effect
        mapRef.current.addLayer({
          id: "sky",
          type: "sky",
          paint: {
            "sky-type": "atmosphere",
            "sky-atmosphere-sun": [0.0, 0.0],
            "sky-atmosphere-sun-intensity": 15,
          },
        });

        // Add lighting for enhanced 3D terrain visualization
        mapRef.current.setLight({
          anchor: "map", // Keep sun fixed relative to map for consistent shading
          color: "white",
          intensity: 0.7, // Boosted intensity for more pronounced shading
          position: [1.5, 210, 80],
        });

        // Apply custom style color overrides
        applyCustomStyleColors(mapRef.current);
      }
    }

    function onError(e: any) {
      if (e?.error?.status || e?.error?.message)
        console.warn(
          `Map error: ${e.error.status || ""} ${e.error.message || ""}`
        );
    }

    mapRef.current.on("load", onLoad);
    mapRef.current.on("error", onError);

    return () => {
      mapRef.current?.off("load", onLoad);
      mapRef.current?.off("error", onError);
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [containerId, style, center.toString(), zoom]);

  return { map: mapRef.current, ready };
}

// Function to apply custom style colors
function applyCustomStyleColors(map: mapboxgl.Map) {
  try {
    const colors = CUSTOM_STYLE_OVERRIDES;
    const style = map.getStyle();

    if (style.layers) {
      style.layers.forEach((layer) => {
        const layerId = layer.id;

        if (layer.type === "fill") {
          // Check for national parks and wilderness (more specific check)
          if (
            layerId.includes("national-park") ||
            layerId.includes("national_park") ||
            layerId.includes("nationalpark") ||
            layerId.includes("wilderness")
          ) {
            map.setPaintProperty(layerId, "fill-color", colors.nationalPark);
          }
          // Check for national forests
          else if (
            layerId.includes("national-forest") ||
            layerId.includes("national_forest") ||
            layerId.includes("nationalforest")
          ) {
            map.setPaintProperty(layerId, "fill-color", colors.nationalForest);
          }
          // Then check for general park/forest (less specific)
          else if (layerId.includes("park")) {
            map.setPaintProperty(layerId, "fill-color", colors.park);
          } else if (layerId.includes("forest")) {
            map.setPaintProperty(layerId, "fill-color", colors.forest);
          }
          // General natural/landuse areas
          else if (layerId.includes("natural") || layerId.includes("landuse")) {
            map.setPaintProperty(layerId, "fill-color", colors.natural);
          }
        }
      });
    }

    console.log("Green colors toned down successfully");
  } catch (error) {
    console.warn("Error applying custom style colors:", error);
  }
}
