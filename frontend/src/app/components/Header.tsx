
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const Header = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <header style={{ ...headerStyle, justifyContent: isMobile ? 'center' : 'flex-start' }}>
      <Link href="">
        <Image 
          src="./logo.svg" 
          alt="Logo" 
          width={50} 
          height={50} 
          style={logoStyle}
        />
      </Link>
    </header>
  );
};

// Styles
const headerStyle = {
  display: 'flex',
  alignItems: 'start',
  padding: '10px 20px',
  backgroundColor: 'black',
  width: '100%'
};

const logoStyle = {
  cursor: 'pointer',
};

export default Header;
