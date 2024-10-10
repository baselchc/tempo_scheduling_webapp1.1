import { motion, AnimatePresence } from 'framer-motion';

const Sidebar = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence> 
      {isOpen && (
        <motion.div 
          initial={{ x: '-100%' }} // Start off-screen
          animate={{ x: 0 }} // Animate to the default position
          exit={{ x: '-100%' }} // Animate out
          transition={{ type: 'tween', duration: 0.3 }} 
          className="fixed top-0 left-0 h-screen w-64 bg-gray-800 text-white z-50 shadow-lg"
        >
          <div className="p-4">
            {/* Your sidebar content here */}
            <h2 className="text-2xl font-bold mb-4">My Account</h2>
            <ul>
              <li className="mb-2"><a href="#">My Profile</a></li>
              <li className="mb-2"><a href="#">Settings</a></li>
              <li className="mb-2"><a href="#">Notifications</a></li>
              <button onClick={onClose} className="mt-4 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded">
                Close
              </button>
            </ul>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Sidebar;
//code enhanced with help of chatgpt4 and some youtube videos for knowing how to animate in tailwind css. Prompt was "Design a React component called Sidebar which will contain Framer Motion for animation and the styles will be added with Tailwind CSS. Optional elements Open/Close sidebar: The sidebar should slide in from the right hand side of the page with the button to open the sidebar, and slide out with the close button." 