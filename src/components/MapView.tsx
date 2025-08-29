import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import * as turf from "@turf/turf";
import { useMapbox } from "../hooks/useMapbox";
import {
  MAPBOX_STYLE_URL,
  ROADLESS_TILESET_ID,
  ROADLESS_SOURCE_LAYER,
  OVERLAY_COLOR,
  FILL_OPACITY,
  PCT_COLOR,
  ID_KEYS,
  NAME_KEYS,
  OREGON_TRAILS_COLOR,
  CONGRESSIONAL_DISTRICTS_COLOR,
} from "../config";
import { buildPopupHTML } from "../utils/popup";
import { addMapSources } from "../utils/mapSources";
import { addMapLayers } from "../utils/mapLayers";
import { LegendControl } from "./controls/LegendControl";
import { SurveyControl } from "./controls/SurveyControl";
import { PitchControl } from "./controls/PitchControl";
import { SourcesControl } from "./controls/SourcesControl";
import { SearchControl } from "./controls/SearchControl";

import MapTitle from "./MapTitle";

import Logos from "./Logos";
import ttLogo from "../assets/logos/tetontopo_logo.png";
import partnerLogo from "../assets/logos/SC-Oregon-Chapter-Logo_Horizontal_Color.png";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN as string;

export default function MapView() {
  const [note, setNote] = useState("Loading…");
  const noteRef = useRef<HTMLDivElement | null>(null);
  const [selectedDistrictId, setSelectedDistrictId] = useState<string | null>(
    null
  );

  const { map, ready } = useMapbox("map", MAPBOX_STYLE_URL);

  // Attach custom controls once
  useEffect(() => {
    if (!ready || !map) return;
    const m = map as mapboxgl.Map; // <- capture non-null
    m.addControl(new PitchControl(), "top-right");
    m.addControl(new SurveyControl(), "bottom-right");
    m.addControl(new LegendControl(), "bottom-right");
  }, [ready, map]);

  async function getGeoJSONBounds(
    url: string
  ): Promise<[number, number, number, number] | null> {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      const gj = await res.json();
      // Compute bbox via Turf
      const b = (turf.bbox as any)(gj) as [number, number, number, number];
      return b;
    } catch {
      return null;
    }
  }

  // Add sources/layers + behavior
  useEffect(() => {
    if (!ready || !map) return;

    const m = map as mapboxgl.Map; //
    setNote("Basemap loaded. Adding sources + layers…");

    // Add sources
    addMapSources(m);

    addMapLayers(m);

    // Popups on roadless polygons
    const popup = new mapboxgl.Popup({ closeButton: true, closeOnClick: true });

    // Clear district selection when popup is closed
    popup.on("close", () => {
      setSelectedDistrictId(null);
    });

    function onEnter() {
      m.getCanvas().style.cursor = "pointer";
    }
    function onLeave() {
      m.getCanvas().style.cursor = "";
    }
    function onClick(e: mapboxgl.MapLayerMouseEvent) {
      const f = e.features && e.features[0];
      if (!f) return;
      const props = (f.properties || {}) as Record<string, any>;
      const nameKey = NAME_KEYS.find((k) => props[k] !== undefined);
      const idKey = ID_KEYS.find((k) => props[k] !== undefined);
      const name = nameKey ? String(props[nameKey]) : "Unnamed area";
      const uid = idKey ? String(props[idKey]) : null;

      // Area (m² -> acres)
      let acresTxt = "—";
      try {
        const gj = {
          type: "Feature",
          properties: {},
          geometry: f.geometry,
        } as any;
        const m2 = (turf.area as any)(gj);
        const acres = m2 / 4046.8564224;
        if (Number.isFinite(acres)) {
          acresTxt = acres.toLocaleString("en-US", {
            maximumFractionDigits: 0,
          });
        }
      } catch {}

      popup
        .setLngLat(e.lngLat)
        .setHTML(buildPopupHTML(name, uid, acresTxt))
        .addTo(m); // <- use m
    }

    // PCT and Oregon Trails click functionality
    function onTrailClick(e: mapboxgl.MapLayerMouseEvent) {
      const f = e.features && e.features[0];
      if (!f) return;
      const props = (f.properties || {}) as Record<string, any>;

      // Determine which trail layer was clicked by checking the source
      const sourceId = f.source;
      let trailName = "Unknown Trail";
      let trailInfo = "";

      if (sourceId === "pct") {
        trailName = "Pacific Crest Trail - Oregon";
        trailInfo =
          "A long-distance hiking trail spanning the length of Oregon";
      } else if (sourceId === "oregon-trails") {
        // Try to get trail name from properties
        trailName =
          props.TRAIL_NAME || props.NAME || props.TRAIL || "Oregon Trail";
        trailInfo = props.DESCRIPTION || "A trail in Oregon";

        // Check if this is a PCT segment
        if (props.TRAIL_NAME && props.TRAIL_NAME.includes("PACIFIC CREST")) {
          trailName = "Pacific Crest Trail - Oregon Section";
          trailInfo =
            "A long-distance hiking trail spanning from Canada to Mexico";
        }
      }

      // Get trail length from properties or calculate if not available
      let lengthTxt = "—";
      if (sourceId === "oregon-trails" && props.GIS_MILES) {
        // Use the pre-calculated GIS miles from the data
        lengthTxt =
          props.GIS_MILES.toLocaleString("en-US", {
            maximumFractionDigits: 1,
          }) + " miles";
      } else if (sourceId === "pct") {
        // For the dedicated PCT source, show the total Oregon PCT length
        lengthTxt = "456.5 miles (of 2,650 miles total)"; // Total Oregon PCT length
      } else {
        // Calculate length for other trails if GIS_MILES is not available
        try {
          const gj = {
            type: "Feature",
            properties: {},
            geometry: f.geometry,
          } as any;
          const lengthMeters = (turf.length as any)(gj);
          const lengthMiles = lengthMeters * 0.000621371; // Convert to miles
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

      popup.setLngLat(e.lngLat).setHTML(popupHTML).addTo(m);
    }

    m.on("mouseenter", "roadless-fill", onEnter);
    m.on("mouseleave", "roadless-fill", onLeave);
    m.on("click", "roadless-fill", onClick);

    // Add trail click functionality
    m.on("mouseenter", "pct-line", onEnter);
    m.on("mouseleave", "pct-line", onLeave);
    m.on("click", "pct-line", onTrailClick);

    m.on("mouseenter", "oregon-trails-line", onEnter);
    m.on("mouseleave", "oregon-trails-line", onLeave);
    m.on("click", "oregon-trails-line", onTrailClick);

    // Add congressional district click functionality
    m.on("mouseenter", "congressional-districts-line", onEnter);
    m.on("mouseleave", "congressional-districts-line", onLeave);
    m.on("mouseenter", "congressional-districts-fill", onEnter);
    m.on("mouseleave", "congressional-districts-fill", onLeave);

    // Add a general click handler for layer precedence
    const generalClickHandler = (e: mapboxgl.MapMouseEvent) => {
      const features = m.queryRenderedFeatures(e.point);

      // Define layer priority (higher index = higher priority)
      const layerPriority = [
        "congressional-districts-fill", // Lowest priority - clickable area
        "congressional-districts-line", // District boundaries
        "roadless-fill",
        "oregon-trails-line",
        "pct-line",
      ];

      // Find the highest priority feature
      let highestPriorityFeature = null;
      let highestPriorityIndex = -1;

      for (const feature of features) {
        const layerId = feature.layer?.id;
        if (layerId) {
          const priorityIndex = layerPriority.indexOf(layerId);
          if (priorityIndex > highestPriorityIndex) {
            highestPriorityIndex = priorityIndex;
            highestPriorityFeature = feature;
          }
        }
      }

      // If congressional districts (fill or line) is the highest priority, handle it
      if (
        highestPriorityFeature &&
        (highestPriorityFeature.layer?.id === "congressional-districts-line" ||
          highestPriorityFeature.layer?.id === "congressional-districts-fill")
      ) {
        const props = (highestPriorityFeature.properties || {}) as Record<
          string,
          any
        >;

        // Set the selected district ID for visual feedback
        const featureId = highestPriorityFeature.id?.toString() || null;
        const selectedDistrictNumber = props.DISTRICT || null;
        console.log("Selected district ID:", featureId);
        console.log("District number:", selectedDistrictNumber);
        console.log("Feature:", highestPriorityFeature);
        // Use district number instead of feature ID for more reliable comparison
        setSelectedDistrictId(selectedDistrictNumber);

        const representativeNameRaw =
          props.LISTING_NA || "Unknown Representative";
        const districtNumber = props.DISTRICT || "Unknown";
        const party = props.Party || "Unknown";
        const totalAcres = props.Acres
          ? props.Acres.toLocaleString("en-US")
          : "—";
        const roadlessAcres = props.SUM_RoadlessAreasAcres
          ? props.SUM_RoadlessAreasAcres.toLocaleString("en-US", {
              maximumFractionDigits: 0,
            })
          : "—";

        // Parse "Last, First" format and convert to "First Last"
        let formattedRepresentativeName = "Unknown Representative";
        if (representativeNameRaw !== "Unknown Representative") {
          const nameParts = representativeNameRaw.split(", ");
          if (nameParts.length === 2) {
            const lastName = nameParts[0];
            const firstName = nameParts[1];
            formattedRepresentativeName = `${firstName} ${lastName}`;
          } else {
            formattedRepresentativeName = representativeNameRaw;
          }
        }

        // Format the representative name as "Rep. First Last (Party–OR-##)"
        const formattedName = `Rep. ${formattedRepresentativeName} (${party}–OR-${districtNumber.padStart(
          2,
          "0"
        )})`;

        const popupHTML = `
          <div style="padding: 8px;">
            <h3 style="margin: 0 0 8px 0; color: #0b1f44; font-size: 16px;">Congressional District ${districtNumber}</h3>
            <p style="margin: 0 0 4px 0; color: #666; font-size: 14px;"><strong>Representative:</strong></p>
            <p style="margin: 0 0 4px 0; color: #666; font-size: 14px;">${formattedName}</p>
            <p style="margin: 0 0 4px 0; color: #666; font-size: 12px;"><strong>Total Area:</strong> ${totalAcres} acres</p>
            <p style="margin: 0; color: #666; font-size: 12px;"><strong>Roadless Areas:</strong> ${roadlessAcres} acres</p>
          </div>
        `;

        popup.setLngLat(e.lngLat).setHTML(popupHTML).addTo(m);
      } else {
        // Clear selection when clicking elsewhere
        setSelectedDistrictId(null);
      }
    };

    m.on("click", generalClickHandler);

    setNote(
      "Layers added. Popups enabled with live Acres and trail information."
    );

    // Removed delayed fit-to-bounds and easeTo to avoid post-load zoom jump

    return () => {
      m.off("mouseenter", "roadless-fill", onEnter);
      m.off("mouseleave", "roadless-fill", onLeave);
      m.off("click", "roadless-fill", onClick);
      m.off("mouseenter", "pct-line", onEnter);
      m.off("mouseleave", "pct-line", onLeave);
      m.off("click", "pct-line", onTrailClick);
      m.off("mouseenter", "oregon-trails-line", onEnter);
      m.off("mouseleave", "oregon-trails-line", onLeave);
      m.off("click", "oregon-trails-line", onTrailClick);
      m.off("mouseenter", "congressional-districts-line", onEnter);
      m.off("mouseleave", "congressional-districts-line", onLeave);
      m.off("mouseenter", "congressional-districts-fill", onEnter);
      m.off("mouseleave", "congressional-districts-fill", onLeave);
      m.off("click", generalClickHandler); // Remove general click handler
    };
  }, [ready, map]);

  // Update map layers when selected district changes
  useEffect(() => {
    if (!ready || !map) return;

    const m = map as mapboxgl.Map;
    const currentZoom = m.getZoom();

    console.log(
      "Updating styling - selectedDistrictId:",
      selectedDistrictId,
      "zoom:",
      currentZoom
    );

    // Only apply visual feedback when fill layer is visible (zoom <= 8)
    if (currentZoom <= 8) {
      // Update the congressional districts fill layer
      if (m.getLayer("congressional-districts-fill")) {
        if (selectedDistrictId) {
          console.log(
            "Setting fill opacity with selectedDistrictId:",
            selectedDistrictId
          );
          m.setPaintProperty("congressional-districts-fill", "fill-opacity", [
            "case",
            ["==", ["get", "DISTRICT"], selectedDistrictId],
            0.4, // Darker when selected
            0.1, // Very light shading when not selected
          ]);
        } else {
          // Reset to default when no selection
          console.log("Resetting fill opacity to default");
          m.setPaintProperty(
            "congressional-districts-fill",
            "fill-opacity",
            0.1
          );
        }
      }

      // Update the congressional districts line layer
      if (m.getLayer("congressional-districts-line")) {
        if (selectedDistrictId) {
          m.setPaintProperty("congressional-districts-line", "line-opacity", [
            "case",
            ["==", ["get", "DISTRICT"], selectedDistrictId],
            1.0, // Fully opaque when selected
            0.8, // Normal opacity when not selected
          ]);

          m.setPaintProperty("congressional-districts-line", "line-width", [
            "case",
            ["==", ["get", "DISTRICT"], selectedDistrictId],
            2.5, // Thicker when selected
            1.5, // Normal width when not selected
          ]);
        } else {
          // Reset to default when no selection
          m.setPaintProperty(
            "congressional-districts-line",
            "line-opacity",
            0.8
          );
          m.setPaintProperty("congressional-districts-line", "line-width", 1.5);
        }
      }
    } else {
      // When zoom > 8, reset to default styling
      if (m.getLayer("congressional-districts-fill")) {
        m.setPaintProperty("congressional-districts-fill", "fill-opacity", 0.1);
      }
      if (m.getLayer("congressional-districts-line")) {
        m.setPaintProperty("congressional-districts-line", "line-opacity", 0.8);
        m.setPaintProperty("congressional-districts-line", "line-width", 1.5);
      }
    }
  }, [selectedDistrictId, ready, map]);

  // Add zoom change listener to update styling when zoom changes
  useEffect(() => {
    if (!ready || !map) return;

    const m = map as mapboxgl.Map;

    const handleZoomChange = () => {
      const currentZoom = m.getZoom();

      // Only apply visual feedback when fill layer is visible (zoom <= 8)
      if (currentZoom <= 8) {
        if (selectedDistrictId) {
          // Update the congressional districts fill layer
          if (m.getLayer("congressional-districts-fill")) {
            m.setPaintProperty("congressional-districts-fill", "fill-opacity", [
              "case",
              ["==", ["get", "DISTRICT"], selectedDistrictId],
              0.4, // Darker when selected
              0.1, // Very light shading when not selected
            ]);
          }

          // Update the congressional districts line layer
          if (m.getLayer("congressional-districts-line")) {
            m.setPaintProperty("congressional-districts-line", "line-opacity", [
              "case",
              ["==", ["get", "DISTRICT"], selectedDistrictId],
              1.0, // Fully opaque when selected
              0.8, // Normal opacity when not selected
            ]);

            m.setPaintProperty("congressional-districts-line", "line-width", [
              "case",
              ["==", ["get", "DISTRICT"], selectedDistrictId],
              2.5, // Thicker when selected
              1.5, // Normal width when not selected
            ]);
          }
        } else {
          // Reset to default when no selection
          if (m.getLayer("congressional-districts-fill")) {
            m.setPaintProperty(
              "congressional-districts-fill",
              "fill-opacity",
              0.1
            );
          }
          if (m.getLayer("congressional-districts-line")) {
            m.setPaintProperty(
              "congressional-districts-line",
              "line-opacity",
              0.8
            );
            m.setPaintProperty(
              "congressional-districts-line",
              "line-width",
              1.5
            );
          }
        }
      } else {
        // When zoom > 8, reset to default styling
        if (m.getLayer("congressional-districts-fill")) {
          m.setPaintProperty(
            "congressional-districts-fill",
            "fill-opacity",
            0.1
          );
        }
        if (m.getLayer("congressional-districts-line")) {
          m.setPaintProperty(
            "congressional-districts-line",
            "line-opacity",
            0.8
          );
          m.setPaintProperty("congressional-districts-line", "line-width", 1.5);
        }
      }
    };

    m.on("zoom", handleZoomChange);

    return () => {
      m.off("zoom", handleZoomChange);
    };
  }, [selectedDistrictId, ready, map]);

  return (
    <div className="map-root">
      <div id="map" />
      {/*Map title overlay*/}
      <MapTitle title="Oregon Roadless Areas" />

      {/* Search Control */}
      <SearchControl position="top-left" map={map} />

      {/* Sources Control */}
      <SourcesControl position="bottom-left" />

      {/* Logos overlay goes here */}
      <Logos
        position="bottom-center"
        gap={20}
        items={[
          { src: ttLogo, alt: "TetonTopo", href: "https://tetontopo.com" },
          {
            src: partnerLogo,
            alt: "Sierra Club Oregon Chapter",
            href: "https://www.sierraclub.org/oregon",
            height: 34,
            card: true,
          },
        ]}
      />

      {/* Existing note overlay */}
      <div ref={noteRef} className="note">
        {note}
      </div>
    </div>
  );
}
