"use client"
import React from "react";
import Head from "next/head";
import "./globals.css";
import styles from './styles/Home.module.css';
import IncrementCounter from "./components/IncrementCounter";
import Header from "./components/Header";

export default function Home() {
return (
  <div className={styles.container}>
    <Head>
      <title>Massa Counter</title>
      <link rel="icon" href="/favicon.ico"/>    
    </Head>

    <Header/>

    <main>
      <div className={styles.grid}>
      <IncrementCounter/>
      </div>
    </main>

    <footer >
      <span>
      © 2024 Volkan Guneri
      </span>
      <a
        href="https://massa.net/"
        target="_blank"
        rel="noopener noreferrer"
      >
        <img src="/logo_massa.svg" alt="Massa Logo" />
      </a>
    </footer>

    <style jsx>{`
      main {
        padding: 5rem 0;
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
      }
      footer {
        width: 100%;
        height: 100px;
        border-top: 1px solid #eaeaea;
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 3em;
      }
      footer img {
        width: 5em; 
        height: 5em;
      }
      footer span {
        font-size:.8em;
      }
      footer img {
        width: 5em; 
        height: 5em;
      }
      footer a {
        display: flex;
        justify-content: center;
        align-items: center;
        text-decoration: none;
        color: inherit;
      }
      code {
        background: #fafafa;
        border-radius: 5px;
        padding: 0.75rem;
        font-size: 1.1rem;
        font-family:
          Menlo,
          Monaco,
          Lucida Console,
          Liberation Mono,
          DejaVu Sans Mono,
          Bitstream Vera Sans Mono,
          Courier New,
          monospace;
      }
    `}</style>
    <style jsx global>{`
      html,
      body {
        padding: 0;
        margin: 0;
        font-family:
          -apple-system,
          BlinkMacSystemFont,
          Segoe UI,
          Roboto,
          Oxygen,
          Ubuntu,
          Cantarell,
          Fira Sans,
          Droid Sans,
          Helvetica Neue,
          sans-serif;
      }
      * {
        box-sizing: border-box;
      }
    `}</style>
  </div>
);
}