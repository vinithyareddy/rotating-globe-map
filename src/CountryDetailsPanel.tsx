import React from "react";
import { grantsData } from "./data/grantsData";
import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const CountryDetailsPanel: React.FC = () => {
  const { countryName } = useParams();
  const navigate = useNavigate();

  const decodedCountry = decodeURIComponent(countryName || "").trim();

  const filteredGrants = grantsData.filter(
    (grant) =>
      grant.country.toLowerCase().trim() === decodedCountry.toLowerCase()
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: "100%" }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: "100%" }}
      transition={{ duration: 0.4 }}
      className="absolute top-0 left-0 w-full h-full bg-gray-900 text-white p-6 overflow-y-scroll z-50"
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Grants in {decodedCountry}</h2>
        <button
          onClick={() => navigate("/")}
          className="w-44 px-4 py-2 border border-white text-white rounded-md hover:bg-white hover:text-gray-900 transition duration-200 shadow-sm backdrop-blur-sm flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-4 h-4 text-white" />
          <span>Back to Map</span>
        </button>
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
          {filteredGrants.length === 0 ? (
            <tr>
              <td colSpan={10} className="text-center text-gray-400 py-4">
                No data available for {decodedCountry}
              </td>
            </tr>
          ) : (
            filteredGrants.map((grant, idx) => (
              <tr key={idx} className="even:bg-gray-800">
                <td className="p-2 border">{grant.country}</td>

                <td className="p-2 border">{grant.region}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </motion.div>
  );
};

export default CountryDetailsPanel;
