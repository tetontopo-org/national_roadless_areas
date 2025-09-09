import { useEffect, useRef } from "react";
import mapboxgl, { Map } from "mapbox-gl";
import { LayerComponentProps } from "./layerTypes";
import { NATIONAL_TRAILS_COLOR } from "../../config";
import * as turf from "@turf/turf";

export const NationalTrailsLayer: React.FC<LayerComponentProps> = ({
  map,
  ready,
}) => {
  const popupRef = useRef<mapboxgl.Popup | null>(null);

  useEffect(() => {
    if (!ready || !map) return;

    // Add trails source
    if (!map.getSource("national-trails")) {
      map.addSource("national-trails", {
        type: "geojson",
        data: "/data/National_Trails_Name_Simple.json",
        promoteId: "OBJECTID",
      });
    }

    // Add trails line layer
    if (!map.getLayer("national-trails-line")) {
      map.addLayer(
        {
          id: "national-trails-line",
          type: "line",
          source: "national-trails",
          minzoom: 8,
          layout: {
            "line-cap": "round",
            "line-join": "round",
            "symbol-elevation-reference": "hd-road-markup",
          },
          paint: {
            "line-color": NATIONAL_TRAILS_COLOR,
            "line-width": [
              "interpolate",
              ["linear"],
              ["zoom"],
              6,
              1.5,
              8,
              2.0,
              10,
              2.5,
              12,
              3.0,
              14,
              3.5,
              16,
              4.5,
            ],
            "line-opacity": 0.9,
            "line-translate": [0, -1],
            "line-translate-anchor": "map",
            "line-dasharray": [2, 2],
          },
        },
        "roadless-fill" // Place lines above fill layer
      );
    }

    // Add trail labels layer
    if (!map.getLayer("national-trails-labels")) {
      map.addLayer(
        {
          id: "national-trails-labels",
          type: "symbol",
          source: "national-trails",
          minzoom: 6, // Only show labels when zoomed in enough
          layout: {
            "text-field": [
              "coalesce",
              [
                "concat",
                [
                  "upcase",
                  [
                    "slice",
                    [
                      "coalesce",
                      ["get", "TRAIL_NAME"],
                      ["get", "NAME"],
                      ["get", "TRAIL"],
                      "Trail",
                    ],
                    0,
                    1,
                  ],
                ],
                [
                  "downcase",
                  [
                    "slice",
                    [
                      "coalesce",
                      ["get", "TRAIL_NAME"],
                      ["get", "NAME"],
                      ["get", "TRAIL"],
                      "Trail",
                    ],
                    1,
                  ],
                ],
              ],
              "Trail",
            ],
            "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
            "text-size": [
              "interpolate",
              ["linear"],
              ["zoom"],
              12,
              10,
              14,
              12,
              16,
              14,
            ],
            "text-max-width": 8,
            "text-line-height": 1.2,
            "text-letter-spacing": 0.1,
            "text-justify": "auto",
            "text-anchor": "center",
            "text-padding": 2,
            "text-allow-overlap": false,
            "text-ignore-placement": false,
            "symbol-placement": "line",
            "text-max-angle": 20,
            "text-keep-upright": true,
            "text-pitch-alignment": "viewport",
            "text-rotation-alignment": "map",
            "symbol-spacing": 200,
            "symbol-avoid-edges": true,
            "text-offset": [0, -1],
          },
          paint: {
            "text-color": "#000000",
            "text-halo-color": "#ffffff",
            "text-halo-width": 1,
            "text-halo-blur": 0.5,
            "text-opacity": 1,
          },
        },
        "national-trails-line" // Place labels above the line layer
      );
    }

    // Create popup
    popupRef.current = new mapboxgl.Popup({
      closeButton: true,
      closeOnClick: true,
    });

    // Event handlers
    const onEnter = () => {
      map.getCanvas().style.cursor = "pointer";
    };

    const onLeave = () => {
      map.getCanvas().style.cursor = "";
    };

    const onTrailClick = (e: mapboxgl.MapLayerMouseEvent) => {
      const f = e.features && e.features[0];
      if (!f || !popupRef.current) return;

      const props = (f.properties || {}) as Record<string, any>;
      let trailName =
        props.TRAIL_NAME || props.NAME || props.TRAIL || "National Trail";
      let trailInfo = "A national trail";

      // Get trail length
      let lengthTxt = "—";
      if (props.Shape_Length) {
        // Shape_Length is in meters, convert to miles
        const lengthMiles = props.Shape_Length * 0.000621371;
        lengthTxt =
          lengthMiles.toLocaleString("en-US", {
            maximumFractionDigits: 1,
          }) + " miles";
      } else {
        try {
          const gj = {
            type: "Feature",
            properties: {},
            geometry: f.geometry,
          } as any;
          const lengthMeters = (turf.length as any)(gj);
          const lengthMiles = lengthMeters * 0.000621371;
          if (Number.isFinite(lengthMiles)) {
            lengthTxt =
              lengthMiles.toLocaleString("en-US", {
                maximumFractionDigits: 1,
              }) + " miles";
          }
        } catch {}
      }

      const popupHTML = `
        <div style="padding: 8px;">
          <h3 style="margin: 0 0 8px 0; color: #0b1f44; font-size: 16px;">${trailName}</h3>
          <p style="margin: 0 0 4px 0; color: #666; font-size: 14px;">${trailInfo}</p>
          <p style="margin: 0; color: #666; font-size: 12px;">Length: ${lengthTxt}</p>
        </div>
      `;

      popupRef.current.setLngLat(e.lngLat).setHTML(popupHTML).addTo(map);
    };

    // Add event listeners
    map.on("mouseenter", "national-trails-line", onEnter);
    map.on("mouseleave", "national-trails-line", onLeave);
    map.on("click", "national-trails-line", onTrailClick);

    // Cleanup function
    return () => {
      map.off("mouseenter", "national-trails-line", onEnter);
      map.off("mouseleave", "national-trails-line", onLeave);
      map.off("click", "national-trails-line", onTrailClick);

      if (popupRef.current) {
        popupRef.current.remove();
      }
    };
  }, [ready, map]);

  return null;
};
