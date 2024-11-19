import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

/**
 * @title Header Component
 * @notice Displays a responsive header with a logo and a title
 * @dev Adapts layout based on screen size (mobile vs desktop)
 */
const Header = () => {
  /// @notice State to track if the viewport is in mobile mode
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    /**
     * @notice Handles window resize events to determine mobile mode
     * @dev Updates `isMobile` state based on `window.innerWidth`
     */
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    handleResize(); // Initial check on component mount
    window.addEventListener('resize', handleResize);

    // Clean up event listener on component unmount
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <header className={`header ${isMobile ? 'mobile' : ''}`}>
      {/* @notice Logo link to the homepage */}
      <Link href="">
        <Image
          src="/logo.svg"
          alt="Logo"
          width={50}
          height={50}
          className="logo"
        />
      </Link>

      {/* @notice Title of the application */}
      <h1 className="title">Counter</h1>

      {/* @dev CSS styles scoped to this component */}
      <style jsx>{`
        .header {
          display: flex;
          align-items: center;
          padding: 10px 20px;
          background-color: black;
          width: 100%;
        }
        .mobile {
          justify-content: center;
        }
        .logo {
          cursor: pointer;
        }
        .title {
          color: white;
          font-size: 2rem;
          margin-left: 10px;
        }
      `}</style>
    </header>
  );
};

export default Header;
