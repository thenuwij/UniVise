import React from 'react';
import { useParams } from 'react-router-dom';
import { DashboardNavBar } from '../components/DashboardNavBar';
import { MenuBar } from '../components/MenuBar';

function RoadmapPathPage() {
  const { degreeId } = useParams();

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-sky-50 to-indigo-100">
      <DashboardNavBar />
      <MenuBar />
      <div className="max-w-5xl mx-auto py-20 px-6">
        <h1 className="text-5xl font-light text-slate-800 mb-12 text-center">
          Your Personalized Roadmap
        </h1>
        <p className="text-center text-gray-600 text-lg">
          Showing roadmap for degree ID: <strong>{degreeId}</strong>
        </p>
        {/* TODO: Fetch and display roadmap content based on degreeId */}
      </div>
    </div>
  );
}

export default RoadmapPathPage;
