import { useEffect, useRef, useState } from "react";
import Globe, { GlobeMethods } from "react-globe.gl";
import { feature } from "topojson-client";
import { Feature, Geometry } from "geojson";
import { Globe as GlobeIcon } from "lucide-react";
import Select from "react-select";
import worldData from "world-atlas/countries-110m.json";
import { countriesData } from "./data/countriesData";
import { Topology } from "topojson-specification";
import { centroid } from "@turf/turf";
import { countryNameMap } from "./data/countryNameMap";

type CountryInfo = (typeof countriesData)[number];
type CountryFeature = Feature<
  Geometry,
  { name: string; centroid?: { lat: number; lng: number } }
>;

function App() {
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const [countries, setCountries] = useState<CountryFeature[]>([]);
  const [selectedCountryData, setSelectedCountryData] =
    useState<CountryInfo | null>(null);
  const [highlightedCountry, setHighlightedCountry] = useState<string | null>(
    null
  );
  const [glowColor, setGlowColor] = useState("#ffffff");
  const [isRotating, setIsRotating] = useState(true);

  useEffect(() => {
    if (globeRef.current) {
      globeRef.current.controls().autoRotate = isRotating;
      globeRef.current.controls().autoRotateSpeed = 0.5;
    }
  }, [isRotating]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setTooltipPos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    let glowInterval: NodeJS.Timeout;
    if (highlightedCountry) {
      let toggle = false;
      glowInterval = setInterval(() => {
        setGlowColor(toggle ? "#ffffff" : "#38bdf8");
        toggle = !toggle;
      }, 600);
    }
    return () => clearInterval(glowInterval);
  }, [highlightedCountry]);

  useEffect(() => {
    const countriesGeo = (
      feature(
        worldData as unknown as Topology,
        (worldData as unknown as Topology).objects.countries
      ) as { type: string; features: CountryFeature[] }
    ).features;

    setCountries(countriesGeo);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const globeCanvas = document.querySelector("canvas");
      if (globeCanvas && e.target === globeCanvas) {
        setSelectedCountryData(null);
      }
    };
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  const handleCountryHighlight = (name: string) => {
    setHighlightedCountry(name);
    setTimeout(() => setHighlightedCountry(null), 2000);
  };

  const handleCountrySelect = (countryName: string) => {
    const countryInfo = countriesData.find(
      (c) => c.name.toLowerCase().trim() === countryName.toLowerCase().trim()
    );
    setSelectedCountryData(countryInfo || null);

    if (countryInfo) {
      handleCountryHighlight(countryInfo.name);
    }

    if (globeRef.current && countryInfo) {
      const countryFeature = countries.find(
        (f) =>
          f.properties.name.toLowerCase().trim() ===
          countryInfo.name.toLowerCase().trim()
      );
      if (countryFeature) {
        try {
          const center = centroid(countryFeature as Feature<Geometry>);
          const [lng, lat] = center.geometry.coordinates;
          globeRef.current.pointOfView({ lat, lng, altitude: 2.2 }, 1000);
        } catch {
          globeRef.current.pointOfView(
            { lat: 20, lng: 78, altitude: 2.2 },
            1000
          );
        }
      }
    }
  };

  const countryOptions = countriesData
    .map((country) => ({
      value: country.name,
      label: country.name,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return (
    <div className="flex h-screen bg-[#e3f4fe] text-gray-800 font-sans px-12 justify-between items-center relative">
      <div className="absolute left-40 top-24 z-10 space-y-3">
        <div className="flex items-center gap-3">
          <GlobeIcon className="w-7 h-7 text-blue-600" />
          <h2 className="text-3xl font-bold tracking-tight text-black">
            Country Insights
          </h2>
        </div>
        <Select
          options={countryOptions}
          onChange={(selected) => {
            if (selected) {
              handleCountrySelect(selected.value);
            } else {
              setSelectedCountryData(null);
            }
          }}
          isClearable
          placeholder="Select a country"
          className="w-80"
          styles={{
            control: (base) => ({
              ...base,
              backgroundColor: "white",
              borderRadius: "12px",
              border: "1px solid #d1d5db",
              padding: "2px 6px",
              fontSize: "15px",
              fontWeight: "500",
            }),
            singleValue: (base) => ({ ...base, color: "#0f172a" }),
            menu: (base) => ({
              ...base,
              backgroundColor: "#fff",
              color: "#0f172a",
            }),
            option: (base, state) => ({
              ...base,
              backgroundColor: state.isFocused ? "#e2e8f0" : "#fff",
              color: "#0f172a",
            }),
          }}
        />
      </div>

      {/* Globe */}
      <div className="flex items-center justify-center w-full">
        <div
          className="rounded-full"
          style={{
            boxShadow: "0px 30px 120px rgba(0, 0, 0, 0.5)",
            borderRadius: "50%",
          }}
        >
          <Globe
            ref={globeRef}
            globeImageUrl="//unpkg.com/three-globe/example/img/earth-day.jpg"
            backgroundColor="#e3f4fe"
            polygonsData={countries}
            polygonCapColor={(obj: object) => {
              const feat = obj as CountryFeature;
              const geoName = feat.properties.name;
              const normalizedName = countryNameMap[geoName] || geoName;
              const countryData = countriesData.find(
                (c) => c.name === normalizedName
              );
              return countryData ? countryData.color : "#ffffff";
            }}
            polygonSideColor={() => "rgba(0,0,0,0.1)"}
            polygonStrokeColor={(obj: object) => {
              const feat = obj as CountryFeature;
              const geoName = feat.properties.name;
              const normalizedName = countryNameMap[geoName] || geoName;
              return highlightedCountry === normalizedName
                ? glowColor
                : "#2c3e50";
            }}
            polygonAltitude={(obj: object) => {
              const feat = obj as CountryFeature;
              const geoName = feat.properties.name;
              const normalizedName = countryNameMap[geoName] || geoName;
              return highlightedCountry === normalizedName ? 0.03 : 0.008;
            }}
            polygonsTransitionDuration={300}
            onPolygonHover={(feat) => {
              if (feat) {
                const geoName = (feat as CountryFeature).properties.name;
                const normalizedName = countryNameMap[geoName] || geoName;
                const match = countriesData.find(
                  (c) => c.name === normalizedName
                );
                if (match) {
                  setHoveredCountry(`${match.name} (${match.region})`);
                }
              } else {
                setHoveredCountry(null);
              }
            }}
            onPolygonClick={(feat) => {
              const geoName = (feat as CountryFeature).properties.name;
              const normalizedName = countryNameMap[geoName] || geoName;
              const matchedCountry = countriesData.find(
                (c) => c.name === normalizedName
              );
              if (matchedCountry) {
                setSelectedCountryData(matchedCountry);
                handleCountryHighlight(matchedCountry.name);
                try {
                  const center = centroid(feat as Feature<Geometry>);
                  const [lng, lat] = center.geometry.coordinates;
                  globeRef.current?.pointOfView(
                    { lat, lng, altitude: 2.2 },
                    1000
                  );
                } catch (err) {
                  console.warn("Polygon centroid error:", err);
                }
              }
            }}
          />
          {hoveredCountry && (
            <div
              className="fixed bg-white text-gray-800 px-3 py-1 rounded shadow text-sm z-50 pointer-events-none"
              style={{
                left: tooltipPos.x + 12,
                top: tooltipPos.y + 12,
                whiteSpace: "nowrap",
                transition: "opacity 0.1s ease",
              }}
            >
              {hoveredCountry}
            </div>
          )}
        </div>
        {selectedCountryData && (
          <div className="absolute top-1/2 right-16 transform -translate-y-1/2 bg-white shadow-xl rounded-xl p-6 w-96 h-72  text-sm text-gray-800 z-20">
            <h3 className="text-xl font-bold mb-1">
              {selectedCountryData.name}
            </h3>
            <p className="mb-2 text-gray-600">
              Region: {selectedCountryData.region}
            </p>
            <div className="space-y-1 text-gray-700">
              <p className="font-medium">Contributions</p>
              <ul className="list-disc list-inside ml-2"></ul>
              <p className="pt-2 font-medium">
                Disbursements: ${selectedCountryData.disbursements} M
              </p>
            </div>
            <a
              href={`/country/${encodeURIComponent(selectedCountryData.name)}`}
              className="inline-block mt-4 text-blue-600 hover:underline"
            >
              View Details
            </a>
          </div>
        )}
      </div>

      <div className="absolute bottom-6 right-6 flex items-center gap-3 text-sm text-black font-medium">
        <span>Earth rotation</span>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={isRotating}
            onChange={() => setIsRotating(!isRotating)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 relative"></div>
        </label>
      </div>
    </div>
  );
}

export default App;
