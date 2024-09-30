"use client";
import React from 'react';
import { useUser, useAuth } from '@clerk/nextjs';
import Layout from '../Layout';
export default function EmployeeProfile() {
  const { user } = useUser();

  return (
    <Layout>
      <div className="text-center"> {/* Full background with white color */}
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-2 mt-4">
        Profile
        </h1>
        <div className="bg-white shadow-md rounded-lg p-4 mt-5">
          <table className="min-w-full bg-white">
            <thead className="text-left text-xl font-bold text-black">
              Information
            </thead>
            <tbody>
              <tr>
                <td className="w-1/3 pl-2 pr-2 pb-2">
                  <div className="text-black bg-gray-200 shadow-md rounded-lg p-2 mt-2 text-left">
                    Phone:
                  </div>
                </td>
                <td className="w-1/3 pl-2 pr-2 pb-2">
                  <div className=" text-black bg-gray-200 shadow-md rounded-lg p-2 mt-2 text-left">
                    Email:
                  </div>
                </td>
                <td className="w-1/3 pl-2 pr-2 pb-2">
                  <div className=" text-black bg-gray-200 shadow-md rounded-lg p-2 mt-2 text-left">
                    N/A:
                  </div>
                </td>
              </tr>
              <tr>
                <td className="w-1/3 pl-2 pr-2 pb-2">
                  <div className="text-black bg-gray-200 shadow-md rounded-lg p-2 mt-2 text-left">
                    N/A:
                  </div>
                </td>
                <td className="w-1/3 pl-2 pr-2 pb-2">
                  <div className=" text-black bg-gray-200 shadow-md rounded-lg p-2 mt-2 text-left">
                    N/A:
                  </div>
                </td>
                <td className="w-1/3 pl-2 pr-2 pb-2">
                  <div className=" text-black bg-gray-200 shadow-md rounded-lg p-2 mt-2 text-left">
                    N/A:
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          
         
        </div>
        

        
      </div>
    </Layout>
  );
  }