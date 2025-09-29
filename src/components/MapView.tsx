import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { useMapbox } from "../hooks/useMapbox";
import {
  MAPBOX_STYLE_URL,
  SC_LOGO_CARD_COLOR,
  TT_LOGO_CARD_COLOR,
} from "../config";
import { LegendControl } from "./controls/LegendControl";
import { SurveyControl } from "./controls/SurveyControl";
import { PitchControl } from "./controls/PitchControl";
import { SourcesControl } from "./controls/SourcesControl";
import { SearchControl } from "./controls/SearchControl";

//layers
import {
  RoadlessLayer,
  PCTLayer,
  OregonTrailsLayer,
  NationalTrailsLayer,
  CongressionalDistrictsLayer,
} from "./layers";

import MapTitle from "./MapTitle";
import Logos from "./Logos";
import ttLogo from "../assets/logos/tetontopo_logo.png";
import sclogo from "../assets/logos/SC Logo_Horiz Web White.png";

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
    const m = map as mapboxgl.Map;
    m.addControl(new PitchControl(), "top-right");
    m.addControl(new SurveyControl(), "bottom-right");
  }, [ready, map]);

  // Add sources/layers + behavior
  useEffect(() => {
    if (!ready || !map) return;

    const m = map as mapboxgl.Map;
    setNote("Basemap loaded. Adding sources + layers…");

    setNote(
      "Layers added. Popups enabled with live Acres and trail information."
    );

    return () => {
      // Cleanup will be handled by individual layer components
    };
  }, [ready, map]);

  return (
    <div className="map-root">
      <div id="map" />
      {/*Map title overlay*/}
      <MapTitle title="National Roadless Areas" />

      {/* Search Control */}
      <SearchControl position="top-left" map={map} />

      {/* Sources Control */}
      <SourcesControl position="bottom-left" />

      {/* Legend Control */}
      <div
        style={{
          position: "absolute",
          bottom: "12px",
          right: "12px",
          zIndex: 3,
        }}
      >
        <LegendControl map={map} />
      </div>

      {/* Logos overlay goes here */}
      <Logos
        position="bottom-center"
        gap={20}
        items={[
          {
            src: ttLogo,
            alt: "TetonTopo",
            href: "https://tetontopo.com",
            height: 50,
            card: true,
            cardColor: TT_LOGO_CARD_COLOR, // Custom blue background for the card
          },
          {
            src: sclogo,
            alt: "Sierra Club National",
            href: "https://www.sierraclub.org/",
            height: 50,
            card: true,
            cardColor: SC_LOGO_CARD_COLOR,
          },
        ]}
      />

      {/* Existing note overlay */}
      <div ref={noteRef} className="note">
        {note}
      </div>
      {ready && map && (
        <>
          <RoadlessLayer map={map} ready={ready} />
          {/* <PCTLayer map={map} ready={ready} /> */}
          {/* <OregonTrailsLayer map={map} ready={ready} /> */}
          <NationalTrailsLayer map={map} ready={ready} />

          <CongressionalDistrictsLayer
            map={map}
            ready={ready}
            selectedDistrictId={selectedDistrictId}
            setSelectedDistrictId={setSelectedDistrictId}
          />
        </>
      )}
    </div>
  );
}
