import React from 'react';
import { grantsData } from '../src/data/grantsData';
import { motion } from 'framer-motion';

interface CountryDetailsPanelProps {
  country: string;
  region: string;
  onBack: () => void;
}

const CountryDetailsPanel: React.FC<CountryDetailsPanelProps> = ({ country, region, onBack }) => {
  const filteredGrants = grantsData.filter(
    (grant) =>
      grant.country.toLowerCase().includes(country.toLowerCase()) &&
      grant.region.toLowerCase() === region.toLowerCase()
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: '100%' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: '100%' }}
      transition={{ duration: 0.4 }}
      className="absolute top-0 left-0 w-full h-full bg-gray-900 text-white p-6 overflow-y-scroll z-50"
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Grants in {country}</h2>
        <button onClick={onBack} className="text-blue-400 hover:underline text-sm">⬅ Back to Map</button>
      </div>

      <table className="w-full text-sm border border-gray-700">
        <thead className="bg-gray-800 sticky top-0 z-10">
          <tr>
            <th className="p-2 border">Country</th>
            <th className="p-2 border">Grant Name</th>
            <th className="p-2 border">Region</th>
            <th className="p-2 border">Trustee</th>
            <th className="p-2 border">Project ID</th>
            <th className="p-2 border">Execution</th>
            <th className="p-2 border">Sector</th>
            <th className="p-2 border">Approval Date</th>
            <th className="p-2 border">Grant Amount</th>
            <th className="p-2 border">Disbursement</th>
          </tr>
        </thead>
        <tbody>
          {filteredGrants.map((grant, idx) => (
            <tr key={idx} className="even:bg-gray-800">
              <td className="p-2 border">{grant.country}</td>
              <td className="p-2 border">{grant.grantName}</td>
              <td className="p-2 border">{grant.region}</td>
              <td className="p-2 border">{grant.trustee}</td>
              <td className="p-2 border">{grant.projectId}</td>
              <td className="p-2 border">{grant.execution}</td>
              <td className="p-2 border">{grant.sector}</td>
              <td className="p-2 border">{grant.approvalDate}</td>
              <td className="p-2 border">${grant.grantAmount.toLocaleString()}</td>
              <td className="p-2 border">${grant.disbursement.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </motion.div>
  );
};

export default CountryDetailsPanel;