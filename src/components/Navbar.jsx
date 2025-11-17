import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, MessageCircle, MapPin, User, Bell } from 'lucide-react'; 
import { useNotifications } from "./NotificationContext";
import './Navbar.css';

const navItems = [
  { id: 'home', label: 'Home', icon: Home, path: '/homepage', tooltip: 'หน้าหลัก' },
  { id: 'chat', label: 'Chat', icon: MessageCircle, path: '/chat', tooltip: 'แชท' },
  { id: 'notifications', label: 'Notifications', icon: Bell, path: '/notifications', tooltip: 'การแจ้งเตือน' },
  { id: 'endtrip', label: 'End Trip', icon: MapPin, path: '/endtrip', tooltip: 'สิ้นสุดการเดินทาง' },
  { id: 'profile', label: 'Profile', icon: User, path: '/profile', tooltip: 'โปรไฟล์' }
];


const Navbar = ({ brand = "TripTogether", currentUser }) => {
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [sparkles, setSparkles] = useState([]);
  const { unreadCount, unreadChatCount } = useNotifications();

  useEffect(() => {
    const mainContent = document.querySelector('.main-content');
    const handleScroll = () => {
      if (mainContent) {
        setIsScrolled(mainContent.scrollTop > 50);
      } else {
        setIsScrolled(window.scrollY > 50);
      }
    };

    if (mainContent) {
      mainContent.addEventListener('scroll', handleScroll);
      return () => mainContent.removeEventListener('scroll', handleScroll);
    } else {
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const createSparkle = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const newSparkles = Array.from({ length: 3 }, (_, i) => ({
      id: Date.now() + i,
      x: Math.random() * rect.width,
      y: Math.random() * rect.height,
      delay: i * 0.2
    }));
    setSparkles(prev => [...prev, ...newSparkles]);
    setTimeout(() => {
      setSparkles(prev => prev.filter(s => !newSparkles.find(ns => ns.id === s.id)));
    }, 1000);
  };

  return (
    <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="navbar-container">
        <Link 
          to="/homepage"
          className="brand"
          onMouseEnter={createSparkle}
        >
          {brand}
          {sparkles.map(sparkle => (
            <span
              key={sparkle.id}
              className="sparkle"
              style={{
                left: `${sparkle.x}px`,
                top: `${sparkle.y}px`,
                animationDelay: `${sparkle.delay}s`
              }}
            >
              ✨
            </span>
          ))}
        </Link>

        <div className="nav-items">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            const isNotification = item.id === 'notifications'; 
            const isChat = item.id === 'chat';

            return (
              <Link
                key={item.id}
                to={item.path}
                className={`nav-button ${isActive ? 'active' : 'inactive'}`}
              >
                <span className={`nav-icon ${isNotification ? 'notification-icon' : ''}`}>
                  <Icon size={20} />
                  {isNotification && unreadCount > 0 && (
                    <span className="notification-dot">{unreadCount}</span>
                  )}
                  {isChat && unreadChatCount > 0 && (
                    <span className="notification-dot">{unreadChatCount}</span>
                  )}
                </span>
                <span className="nav-label">{item.label}</span>
              </Link>
            );
          })}
          
        </div>
      </div>
    </nav>
  );
};

export default Navbar;