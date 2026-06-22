import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { AccountBand } from './sections/AccountBand';
import { DesignApproach } from './sections/DesignApproach';
import { Faq } from './sections/Faq';
import { Features } from './sections/Features';
import { Hero } from './sections/Hero';
import { HowItWorks } from './sections/HowItWorks';
import { OurPromise } from './sections/Promise';
import { Roadmap } from './sections/Roadmap';

export default function App() {
  return (
    <>
      <a className="tw-skip-link" href="#main">
        Skip to content
      </a>
      <Header />
      <main id="main">
        <Hero />
        <div id="promise">
          <OurPromise />
        </div>
        <DesignApproach />
        <div id="roadmap">
          <Roadmap />
        </div>
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
