import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";

export function useMapbox(
  containerId: string,
  style: string,
  center = [-110.6, 41] as [number, number],
  zoom = 5.25,
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
      "top-right",
    );
    mapRef.current.addControl(
      new mapboxgl.ScaleControl({ maxWidth: 150, unit: "imperial" }),
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
        //applyCustomStyleColors(mapRef.current);
      }
    }

    function onError(e: any) {
      if (e?.error?.status || e?.error?.message)
        console.warn(
          `Map error: ${e.error.status || ""} ${e.error.message || ""}`,
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
