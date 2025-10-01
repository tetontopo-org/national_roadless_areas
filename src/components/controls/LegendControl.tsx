import React, { useState } from "react";
import type mapboxgl from "mapbox-gl";
import {
  OVERLAY_COLOR,
  FILL_OPACITY,
  PCT_COLOR,
  OREGON_TRAILS_COLOR,
  NATIONAL_TRAILS_COLOR,
  CONGRESSIONAL_DISTRICTS_COLOR,
} from "../../config";

interface LegendControlProps {
  map: mapboxgl.Map | null;
}

export const LegendControl: React.FC<LegendControlProps> = ({ map }) => {
  const [layerVisibility, setLayerVisibility] = useState({
    roadless: true,
    pct: true,
    oregonTrails: true,
    nationalTrails: true,
    congressionalDistricts: true,
  });

  const toggleLayer = (layerName: keyof typeof layerVisibility) => {
    if (!map) return;

    const newVisibility = !layerVisibility[layerName];
    setLayerVisibility((prev) => ({ ...prev, [layerName]: newVisibility }));

    // Toggle the layer visibility on the map
    const layerIds = getLayerIds(layerName);
    layerIds.forEach((layerId) => {
      if (map.getLayer(layerId)) {
        if (newVisibility) {
          map.setLayoutProperty(layerId, "visibility", "visible");
        } else {
          map.setLayoutProperty(layerId, "visibility", "none");
        }
      }
    });
  };

  const getLayerIds = (layerName: keyof typeof layerVisibility): string[] => {
    switch (layerName) {
      case "roadless":
        return ["roadless-fill", "roadless-line"];
      case "pct":
        return ["pct-line"];
      case "oregonTrails":
        return ["oregon-trails-line"];
      case "nationalTrails":
        return ["national-trails-line", "national-trails-labels"];
      case "congressionalDistricts":
        return ["congressional-districts-fill", "congressional-districts-line"];
      default:
        return [];
    }
  };

  const getOpacity = (layerName: keyof typeof layerVisibility) => {
    return layerVisibility[layerName] ? 1 : 0.3;
  };

  const getDisabledStyle = (layerName: keyof typeof layerVisibility) => {
    return layerVisibility[layerName]
      ? {}
      : { textDecoration: "line-through", color: "#999" };
  };

  return (
    <div className="mapboxgl-ctrl">
      <div className="legend-card">
        <div className="legend-title">Legend</div>

        {/* <div
          className={`legend-item ${
            !layerVisibility.pct ? "legend-item--disabled" : ""
          }`}
          onClick={() => toggleLayer("pct")}
          style={{ cursor: "pointer" }}
          title="Click to toggle PCT layer visibility"
        >
          <span className="legend-swatch" aria-hidden="true">
            <svg
              width="32"
              height="16"
              viewBox="0 0 32 16"
              xmlns="http://www.w3.org/2000/svg"
            >
              <line
                x1="2"
                y1="8"
                x2="30"
                y2="8"
                stroke={PCT_COLOR}
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="6 3"
                opacity={getOpacity("pct")}
              />
            </svg>
          </span>
          <span style={getDisabledStyle("pct")}>PCT (Pacific Crest Trail)</span>
          <span style={{ marginLeft: "auto", fontSize: "10px", color: "#666" }}>
            {layerVisibility.pct ? "●" : "○"}
          </span>
        </div> */}

        <div
          className={`legend-item ${
            !layerVisibility.roadless ? "legend-item--disabled" : ""
          }`}
          onClick={() => toggleLayer("roadless")}
          style={{ cursor: "pointer" }}
          title="Click to toggle Roadless Areas layer visibility"
        >
          <span className="legend-swatch" aria-hidden="true">
            <svg
              width="32"
              height="16"
              viewBox="0 0 32 16"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                x="2"
                y="2"
                width="28"
                height="12"
                fill={OVERLAY_COLOR}
                fillOpacity={
                  layerVisibility.roadless ? FILL_OPACITY : FILL_OPACITY * 0.3
                }
                stroke={OVERLAY_COLOR}
                strokeWidth="1.5"
                opacity={getOpacity("roadless")}
              />
            </svg>
          </span>
          <span style={getDisabledStyle("roadless")}>Roadless Area</span>
          <span style={{ marginLeft: "auto", fontSize: "10px", color: "#666" }}>
            {layerVisibility.roadless ? "●" : "○"}
          </span>
        </div>

        <div
          className={`legend-item ${
            !layerVisibility.nationalTrails ? "legend-item--disabled" : ""
          }`}
          onClick={() => toggleLayer("nationalTrails")}
          style={{ cursor: "pointer" }}
          title="Click to toggle National Trails layer visibility"
        >
          <span className="legend-swatch" aria-hidden="true">
            <svg
              width="32"
              height="16"
              viewBox="0 0 32 16"
              xmlns="http://www.w3.org/2000/svg"
            >
              <line
                x1="2"
                y1="8"
                x2="30"
                y2="8"
                stroke={NATIONAL_TRAILS_COLOR}
                strokeWidth="3"
                strokeLinecap="round"
                opacity={getOpacity("nationalTrails")}
              />
            </svg>
          </span>
          <span style={getDisabledStyle("nationalTrails")}>
            National Trails
          </span>
          <span style={{ marginLeft: "auto", fontSize: "10px", color: "#666" }}>
            {layerVisibility.nationalTrails ? "●" : "○"}
          </span>
        </div>

        {/* <div
          className={`legend-item ${
            !layerVisibility.oregonTrails ? "legend-item--disabled" : ""
          }`}
          onClick={() => toggleLayer("oregonTrails")}
          style={{ cursor: "pointer" }}
          title="Click to toggle Oregon Trails layer visibility"
        >
          <span className="legend-swatch" aria-hidden="true">
            <svg
              width="32"
              height="16"
              viewBox="0 0 32 16"
              xmlns="http://www.w3.org/2000/svg"
            >
              <line
                x1="2"
                y1="8"
                x2="30"
                y2="8"
                stroke={OREGON_TRAILS_COLOR}
                strokeWidth="3"
                strokeLinecap="round"
                opacity={getOpacity("oregonTrails")}
              />
            </svg>
          </span>
          <span style={getDisabledStyle("oregonTrails")}>Oregon Trails</span>
          <span style={{ marginLeft: "auto", fontSize: "10px", color: "#666" }}>
            {layerVisibility.oregonTrails ? "●" : "○"}
          </span>
        </div> */}

        <div
          className={`legend-item ${
            !layerVisibility.congressionalDistricts
              ? "legend-item--disabled"
              : ""
          }`}
          onClick={() => toggleLayer("congressionalDistricts")}
          style={{ cursor: "pointer" }}
          title="Click to toggle Congressional Districts layer visibility"
        >
          <span className="legend-swatch" aria-hidden="true">
            <svg
              width="32"
              height="16"
              viewBox="0 0 32 16"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                x="2"
                y="2"
                width="28"
                height="12"
                fill={CONGRESSIONAL_DISTRICTS_COLOR}
                fillOpacity={
                  layerVisibility.congressionalDistricts ? 0.1 : 0.03
                }
                stroke={CONGRESSIONAL_DISTRICTS_COLOR}
                strokeWidth="1.5"
                opacity={getOpacity("congressionalDistricts")}
              />
            </svg>
          </span>
          <span style={getDisabledStyle("congressionalDistricts")}>
            Congressional Districts
          </span>
          <span style={{ marginLeft: "auto", fontSize: "10px", color: "#666" }}>
            {layerVisibility.congressionalDistricts ? "●" : "○"}
          </span>
        </div>
      </div>
    </div>
  );
};
