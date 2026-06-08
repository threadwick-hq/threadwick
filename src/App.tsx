import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { AccountBand } from './sections/AccountBand';
import { DesignApproach } from './sections/DesignApproach';
import { Faq } from './sections/Faq';
import { Features } from './sections/Features';
import { Hero } from './sections/Hero';
import { HowItWorks } from './sections/HowItWorks';

export default function App() {
  return (
    <>
      <a className="tw-skip-link" href="#main">
        Skip to content
      </a>
      <Header />
      <main id="main">
        <Hero />
        <DesignApproach />
        <div id="features">
          <Features />
        </div>
        <div id="how-it-works">
          <HowItWorks />
        </div>
        <AccountBand />
        <div id="faq">
          <Faq />
        </div>
      </main>
      <Footer />
    </>
  );
}
