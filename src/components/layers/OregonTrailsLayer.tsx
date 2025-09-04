import { useEffect, useRef } from "react";
import mapboxgl, { Map } from "mapbox-gl";
import { LayerComponentProps } from "./layerTypes";
import { OREGON_TRAILS_COLOR } from "../../config";
import * as turf from "@turf/turf";

export const OregonTrailsLayer: React.FC<LayerComponentProps> = ({
  map,
  ready,
}) => {
  const popupRef = useRef<mapboxgl.Popup | null>(null);

  useEffect(() => {
    if (!ready || !map) return;

    // Add trails source
    if (!map.getSource("oregon-trails")) {
      map.addSource("oregon-trails", {
        type: "geojson",
        data: "/data/Oregon_trails.geojson",
        promoteId: "OBJECTID_1",
      });
    }

    // Add trails line layer
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

    // Add trail labels layer
    if (!map.getLayer("oregon-trails-labels")) {
      map.addLayer(
        {
          id: "oregon-trails-labels",
          type: "symbol",
          source: "oregon-trails",
          minzoom: 6, // Only show labels when zoomed in enough
          layout: {
            "text-field": [
              "coalesce",
              ["get", "TRAIL_NAME"],
              ["get", "NAME"],
              ["get", "TRAIL"],
              "Trail"
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
              14
            ],
            "text-max-width": 8,
            "text-line-height": 1.2,
            "text-letter-spacing": 0.1,
            "text-justify": "center",
            "text-anchor": "center",
            "text-padding": 2,
            "text-allow-overlap": false,
            "text-ignore-placement": false,
            "symbol-placement": "line",
            "symbol-spacing": 200,
            "symbol-avoid-edges": true
          },
          paint: {
            "text-color": "#0b1f44",
            "text-halo-color": "#ffffff",
            "text-halo-width": 1,
            "text-halo-blur": 0.5,
            "text-opacity": 1
          }
        },
        "oregon-trails-line" // Place labels above the line layer
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
        props.TRAIL_NAME || props.NAME || props.TRAIL || "Oregon Trail";
      let trailInfo = props.DESCRIPTION || "A trail in Oregon";

      // Check if this is a PCT segment
      if (props.TRAIL_NAME && props.TRAIL_NAME.includes("PACIFIC CREST")) {
        trailName = "Pacific Crest Trail - Oregon Section";
        trailInfo =
          "A long-distance hiking trail spanning from Canada to Mexico";
      }

      // Get trail length
      let lengthTxt = "—";
      if (props.GIS_MILES) {
        lengthTxt =
          props.GIS_MILES.toLocaleString("en-US", {
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
    map.on("mouseenter", "oregon-trails-line", onEnter);
    map.on("mouseleave", "oregon-trails-line", onLeave);
    map.on("click", "oregon-trails-line", onTrailClick);

    // Cleanup function
    return () => {
      map.off("mouseenter", "oregon-trails-line", onEnter);
      map.off("mouseleave", "oregon-trails-line", onLeave);
      map.off("click", "oregon-trails-line", onTrailClick);

      if (popupRef.current) {
        popupRef.current.remove();
      }
    };
  }, [ready, map]);

  return null;
};
