'use client';

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function Dashboard() {
  const leads = useQuery(api.leads.getLeads);
  const [prevLeadsCount, setPrevLeadsCount] = useState(0);
  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
  }>({ show: false, message: '' });
  
  // Sort leads by createdAt in descending order (newest first)
  const sortedLeads = leads ? [...leads].sort((a, b) => b.createdAt - a.createdAt) : [];
  
  // This effect will run when leads data changes
  useEffect(() => {
    if (leads && leads.length > prevLeadsCount && prevLeadsCount > 0) {
      // Show notification when a new lead is added
      setNotification({
        show: true,
        message: "New lead added!"
      });
      
      // Hide notification after 5 seconds
      const timer = setTimeout(() => {
        setNotification({ show: false, message: '' });
      }, 5000);
      
      return () => clearTimeout(timer);
    }
    
    if (leads) {
      setPrevLeadsCount(leads.length);
    }
  }, [leads, prevLeadsCount]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {notification.show && (
        <div className="fixed top-4 right-4 bg-green-500 text-white p-4 rounded-md shadow-lg z-50 animate-fade-in-down">
          {notification.message}
        </div>
      )}
      
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Lead Dashboard</h1>
          <p className="text-gray-500">BANT Qualification for All Leads</p>
        </div>
        <Link href="/" className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors">
          Back to Voice Agent
        </Link>
      </div>

      {/* Leads count card */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <h2 className="text-xl font-semibold mb-2">Total Leads</h2>
        <p className="text-3xl font-bold">{leads?.length || 0}</p>
      </div>

      {/* Leads table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">BANT Qualified Leads</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Budget
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Authority
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Need
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timeframe
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leads?.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No leads found. Start a conversation with the voice agent to generate leads.
                  </td>
                </tr>
              )}
              
              {sortedLeads.map((lead) => {
                const dateAdded = new Date(lead.createdAt).toLocaleString();
                
                return (
                  <tr key={lead._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {lead.name || 'N/A'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {dateAdded}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 max-w-xs truncate">
                        {lead.budget}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 max-w-xs truncate">
                        {lead.authority}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 max-w-xs truncate">
                        {lead.needs}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 max-w-xs truncate">
                        {lead.timeframe}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button 
                        className="text-blue-600 hover:text-blue-900"
                        onClick={() => {
                          const content = JSON.stringify(lead, null, 2);
                          alert(content);
                        }}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 