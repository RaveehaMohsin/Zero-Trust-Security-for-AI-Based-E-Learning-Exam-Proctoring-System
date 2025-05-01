import React from 'react';
import { motion } from 'framer-motion';
import { FaUser, FaBook, FaBell, FaClipboardList, FaSignOutAlt, FaChartBar } from 'react-icons/fa';

const Dashboard = () => {
  const cards = [
    { title: "Profile Setup", icon: <FaUser />, link: "/profile" },
    { title: "Dashboard", icon: <FaChartBar />, link: "/dashboard" },
    { title: "Register Courses", icon: <FaBook />, link: "/register" },
    { title: "Notifications", icon: <FaBell />, link: "/notifications" },
    { title: "View Results", icon: <FaClipboardList />, link: "/results" },
    { title: "Logout", icon: <FaSignOutAlt />, link: "/logout" },
  ];

  return (
    <div className="min-h-screen bg-[#F5ECD5] flex flex-col">
      {/* Header */}
      <header className="flex justify-between items-center p-5 shadow-md bg-[#626F47] text-white">
        <h1 className="text-xl font-bold">E-Learning Portal</h1>
        <div>Welcome, Student | <button className="ml-4 underline">Logout</button></div>
      </header>

      {/* Cards Section */}
      <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-8 p-10">
        {cards.map((card, index) => (
          <motion.div
            key={index}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-[#A4B465] rounded-2xl shadow-lg p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:bg-[#F0BB78]"
          >
            <div className="text-4xl mb-4">{card.icon}</div>
            <h2 className="text-xl font-semibold">{card.title}</h2>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
