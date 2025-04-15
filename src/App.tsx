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
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const [globeReady, setGlobeReady] = useState(false);
  const [countries, setCountries] = useState<CountryFeature[]>([]);
  const [selectedCountryData, setSelectedCountryData] = useState<CountryInfo | null>(null);
  const [highlightedCountry, setHighlightedCountry] = useState<string | null>(null);
  const [glowColor, setGlowColor] = useState('#ffffff');

  useEffect(() => {
    let glowInterval: NodeJS.Timeout;
    if (highlightedCountry) {
      let toggle = false;
      glowInterval = setInterval(() => {
        setGlowColor(toggle ? '#ffffff' : '#38bdf8'); // white to Tailwind's sky-400
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
    countries.forEach(c => {
      const geoName = c.properties.name;
      const normalizedName = countryNameMap[geoName] || geoName;
      const match = countriesData.find(cd => cd.name === normalizedName);
      if (!match) {
        console.warn('❌ No data found for:', geoName, '| Normalized as:', normalizedName);
      }
    });
  }, [countries]);

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
        } catch (err) {
          console.warn("Centroid calculation failed. Falling back.", err);
          globeRef.current.pointOfView({ lat: 20, lng: 78, altitude: 2.2 }, 1000);
        }
      }
    }
  };

  const countryOptions = countriesData.map(country => ({
    value: country.name,
    label: country.name
  }));

  return (
    <div className="flex h-screen bg-gray-900 relative">
      {/* Sidebar */}
      <div className="w-1/4 bg-gray-800 p-6 overflow-y-auto z-10 relative">
        <div className="flex items-center gap-2 mb-4">
          <GlobeIcon className="w-6 h-6 text-blue-400" />
          <h2 className="text-xl font-bold text-white">Country Insights</h2>
        </div>

        <Select
          options={countryOptions}
          onChange={(selected) => handleCountrySelect(selected?.value || '')}
          className="mb-4"
        />

        {selectedCountryData && (
          <div className="p-4 bg-gray-700 rounded-lg text-sm text-white">
            <h3 className="text-lg font-bold">{selectedCountryData.name}</h3>
            <p><strong>Region:</strong> {selectedCountryData.region}</p>
            <p className="mt-2"><strong>Contributions:</strong></p>
            <ul className="ml-4 list-disc">
              <li>IBRD/IDA: ${selectedCountryData.contributions.IBRD_IDA} M</li>
              <li>FIFs: ${'FIFs' in selectedCountryData.contributions ? selectedCountryData.contributions.FIFs : 0} M</li>
            </ul>
            <p className="mt-2"><strong>Disbursements:</strong> ${selectedCountryData.disbursements} M</p>
            <a
              href={`/country/${encodeURIComponent(selectedCountryData.name)}`}
              className="text-blue-400 underline mt-2 inline-block cursor-pointer"
            >
              View Details
            </a>
          </div>
        )}
      </div>

      {/* Globe */}
      <div className="w-3/4 h-full flex items-center justify-center relative z-0">
      <Globe
  ref={globeRef}
  globeImageUrl="//unpkg.com/three-globe/example/img/earth-day.jpg"
  backgroundColor="rgba(173, 216, 240, 1)"
  onGlobeReady={() => setGlobeReady(true)}
  polygonsData={countries}
  
  polygonCapColor={(obj: object) => {
    const feat = obj as CountryFeature;
    const geoName = feat.properties.name;
    const normalizedName = countryNameMap[geoName] || geoName;
    const countryData = countriesData.find(c => c.name === normalizedName);
    return countryData ? countryData.color : 'rgba(255,255,255,0.05)';
  }}

  polygonStrokeColor={(obj: object) => {
    const feat = obj as CountryFeature;
    const geoName = feat.properties.name;
    const normalizedName = countryNameMap[geoName] || geoName;
    return highlightedCountry === normalizedName ? glowColor : 'rgba(20, 20, 20, 0.7)';
  }}

  polygonAltitude={(obj: object) => {
    const feat = obj as CountryFeature;
    const geoName = feat.properties.name;
    const normalizedName = countryNameMap[geoName] || geoName;
    return highlightedCountry === normalizedName ? 0.03 : 0.007;
  }}

  polygonSideColor={() => 'rgba(0, 100, 200, 0.15)'}
  polygonsTransitionDuration={300}

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


      </div>
    </div>
  );
}

export default App;
