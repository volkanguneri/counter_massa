
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const Header = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Fonction pour vérifier la largeur de l'écran
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    // Vérification initiale et écoute des changements de taille de l'écran
    handleResize();
    window.addEventListener('resize', handleResize);

    // Nettoyage de l'écouteur d'événement
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
