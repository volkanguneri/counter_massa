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
    <header className={`header ${isMobile ? 'mobile' : ''}`}>
      <Link href="">
        <Image
          src="/logo.svg"
          alt="Logo"
          width={50}
          height={50}
          className="logo"
        />
      </Link>
      <h1 className="title">Counter</h1>
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
