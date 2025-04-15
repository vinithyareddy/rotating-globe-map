import React from 'react';
import { useParams } from 'react-router-dom';
import CountryDetailsPanel from '../CountryDetailsPanel';
import { countriesData } from '../data/countriesData';

const DynamicCountryDetails: React.FC = () => {
  const { countryName } = useParams<{ countryName: string }>();


  const country = countriesData.find(c => c.name.toLowerCase() === countryName?.toLowerCase());

  if (!country) {
    return <div className="text-white p-6">Country data not found.</div>;
  }

  return (
    <CountryDetailsPanel />

  );
};

export default DynamicCountryDetails;
