import React from 'react';
import { useParams } from 'react-router-dom';
import CountryDetailsPanel from '../CountryDetailsPanel';
import { countriesData } from '../data/countriesData';

const DynamicCountryDetails: React.FC = () => {
  const { countryName } = useParams<{ countryName: string }>();

  const country = countriesData.find(
    c => c.name.toLowerCase() === countryName?.toLowerCase()
  );

  if (!country) {
    return <div className="text-gray-800 p-6">Country data not found.</div>;
  }

  return (
    <div className="p-6">
      <CountryDetailsPanel />
    </div>
  );
};

export default DynamicCountryDetails;
