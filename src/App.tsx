// Paste this full code in App.tsx
// NOTE: Ensure Tailwind CSS is set up properly in your project

import { useEffect, useRef, useState } from 'react';
import Globe, { GlobeMethods } from 'react-globe.gl';
import { feature } from 'topojson-client';
import { Feature, Geometry } from 'geojson';
import { Globe as GlobeIcon } from 'lucide-react';
import Select from 'react-select';
import worldData from 'world-atlas/countries-110m.json';
import { countriesData } from './data/countriesData';
import { Topology } from 'topojson-specification';
import { centroid } from '@turf/turf';
import { countryNameMap } from './data/countryNameMap';

type CountryInfo = typeof countriesData[number];
type CountryFeature = Feature<Geometry, { name: string; centroid?: { lat: number; lng: number } }>;

function App() {
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const [globeReady, setGlobeReady] = useState(false);
  const [countries, setCountries] = useState<CountryFeature[]>([]);
  const [selectedCountryData, setSelectedCountryData] = useState<CountryInfo | null>(null);
  const [highlightedCountry, setHighlightedCountry] = useState<string | null>(null);
  const [glowColor, setGlowColor] = useState('#ffffff');
  const [isRotating, setIsRotating] = useState(true);

  useEffect(() => {
    if (globeReady && globeRef.current) {
      globeRef.current.controls().autoRotate = isRotating;
      globeRef.current.controls().autoRotateSpeed = 0.5;
    }
  }, [globeReady, isRotating]);
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setTooltipPos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    let glowInterval: NodeJS.Timeout;
    if (highlightedCountry) {
      let toggle = false;
      glowInterval = setInterval(() => {
        setGlowColor(toggle ? '#ffffff' : '#38bdf8');
        toggle = !toggle;
      }, 600);
    }
    return () => clearInterval(glowInterval);
  }, [highlightedCountry]);

  useEffect(() => {
    const countriesGeo = (feature(
      worldData as unknown as Topology,
      (worldData as unknown as Topology).objects.countries
    ) as { type: string; features: CountryFeature[] }).features;
    setCountries(countriesGeo);
  }, []);

  useEffect(() => {
    if (globeReady && globeRef.current) {
      globeRef.current.controls().autoRotate = true;
      globeRef.current.controls().autoRotateSpeed = 0.5;
    }
  }, [globeReady]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const globeCanvas = document.querySelector('canvas');
      if (globeCanvas && e.target === globeCanvas) {
        setSelectedCountryData(null);
      }
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const handleCountryHighlight = (name: string) => {
    setHighlightedCountry(name);
    setTimeout(() => setHighlightedCountry(null), 2000);
  };

  const handleCountrySelect = (countryName: string) => {
    const countryInfo = countriesData.find(c => c.name.toLowerCase().trim() === countryName.toLowerCase().trim());
    setSelectedCountryData(countryInfo || null);

    if (countryInfo) {
      handleCountryHighlight(countryInfo.name);
    }

    if (globeRef.current && countryInfo) {
      const countryFeature = countries.find(f => f.properties.name.toLowerCase().trim() === countryInfo.name.toLowerCase().trim());
      if (countryFeature) {
        try {
          const center = centroid(countryFeature as Feature<Geometry>);
          const [lng, lat] = center.geometry.coordinates;
          globeRef.current.pointOfView({ lat, lng, altitude: 2.2 }, 1000);
        } catch {
          globeRef.current.pointOfView({ lat: 20, lng: 78, altitude: 2.2 }, 1000);
        }
        
      }
    }
  };

  const countryOptions = countriesData
    .map(country => ({
      value: country.name,
      label: country.name
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return (
    <div className="flex h-screen bg-[#0a1c2e] text-white font-sans">
<div className="w-1/4 bg-[#e5f6ff] p-8 space-y-6 shadow-lg z-10">

<div className="flex items-center space-x-2 text-sm text-white mt-2">
  <input
    type="checkbox"
    checked={isRotating}
    onChange={() => setIsRotating(!isRotating)}
    className="form-checkbox accent-blue-500"
  />
  <label>Earth rotation</label>
</div>

<div className="flex items-center gap-3">
          <GlobeIcon className="w-7 h-7 text-white" />
          <h2 className="text-2xl font-semibold tracking-tight text-blue-200">Country Insights</h2>
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
          className="text-black"
          styles={{
            control: (base) => ({
              ...base,
              borderRadius: '10px',
              padding: '4px 6px',
              backgroundColor: '#1e293b',
              color: 'white',
              border: '1px solid #334155'
            }),
            singleValue: (base) => ({ ...base, color: 'white' }),
            menu: (base) => ({ ...base, backgroundColor: '#1e293b', color: 'white' }),
            option: (base, state) => ({
              ...base,
              backgroundColor: state.isFocused ? '#334155' : '#1e293b',
              color: 'white'
            })
          }}
        />

        {selectedCountryData && (
          <div className="bg-[#1e293b] p-4 rounded-lg shadow-inner">
            <h3 className="text-lg font-bold">{selectedCountryData.name}</h3>
            <p className="mt-1 text-sm">Region: {selectedCountryData.region}</p>
            <div className="mt-3 space-y-1 text-sm">
              <p className="font-medium">Contributions</p>
              <ul className="ml-4 list-disc">
                <li>IBRD/IDA: ${selectedCountryData.contributions.IBRD_IDA} M</li>
                <li>FIFs: ${selectedCountryData.contributions.FIFs} M</li>
              </ul>
              <p className="pt-2 font-medium">Disbursements: ${selectedCountryData.disbursements} M</p>
            </div>
            <a
              href={`/country/${encodeURIComponent(selectedCountryData.name)}`}
              className="inline-block mt-4 text-blue-400 hover:text-blue-500 text-sm underline"
            >
              View Details
            </a>
          </div>
        )}
      </div>

      <div className="w-3/4 h-full flex items-center justify-center relative z-0 bg-[#f7fafd]">
      <div
    className="rounded-full"
    style={{
      boxShadow: '0px 30px 120px rgba(0, 0, 0, 0.5)', // soft, deep shadow
      borderRadius: '50%',
    }}
  >
        <Globe
          ref={globeRef}
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-day.jpg"
          backgroundColor="#e3f4fe"
          onGlobeReady={() => setGlobeReady(true)}
          polygonsData={countries}
          polygonCapColor={(obj: object) => {
            const feat = obj as CountryFeature;
            const geoName = feat.properties.name;
            const normalizedName = countryNameMap[geoName] || geoName;
            const countryData = countriesData.find(c => c.name === normalizedName);
            return countryData ? countryData.color : '#ffffff';
          }}
          polygonSideColor={() => 'rgba(0,0,0,0.1)'}
          polygonStrokeColor={(obj: object) => {
            const feat = obj as CountryFeature;
            const geoName = feat.properties.name;
            const normalizedName = countryNameMap[geoName] || geoName;
            return highlightedCountry === normalizedName ? glowColor : '#2c3e50';
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
              const match = countriesData.find(c => c.name === normalizedName);
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
            const matchedCountry = countriesData.find(c => c.name === normalizedName);
            if (matchedCountry) {
              setSelectedCountryData(matchedCountry);
              handleCountryHighlight(matchedCountry.name);
              try {
                const center = centroid(feat as Feature<Geometry>);
                const [lng, lat] = center.geometry.coordinates;
                globeRef.current?.pointOfView({ lat, lng, altitude: 2.2 }, 1000);
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
              whiteSpace: 'nowrap',
              transition: 'opacity 0.1s ease'
            }}
          >
            {hoveredCountry}
          </div>
        )}
      </div>
    </div>
    </div>
  );
}

export default App;
