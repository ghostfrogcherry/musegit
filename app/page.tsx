import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="shell">
      <section className="marketingNav">
        <div className="brandRow">
          <Image alt="ChuneUp logo" className="brandLogo" height={40} src="/logo.png" width={40} />
          <span className="brandLink">ChuneUp</span>
        </div>
        <div className="navActions">
          <Link className="primaryButton ctaButton" href="/sign-in">Get started</Link>
        </div>
      </section>

      <section className="hero panel">
        <div className="heroMain">
          <p className="eyebrow">Collaborative album workflow</p>
          <h1>Track your music projects from first upload to final release.</h1>
          <p className="lede">
            Upload song versions, leave timestamped review notes, and keep every album neatly organized.
          </p>
          <div className="ctaRow">
            <Link className="primaryButton" href="/sign-in">Get started</Link>
          </div>
        </div>

        <div className="heroFeatures">
          <div className="featureItem featureGreen">
            <span className="featureIcon">💿</span>
            <div>
              <strong>Albums</strong>
              <p>Organize songs into albums with release goals and timelines.</p>
            </div>
          </div>
          <div className="featureItem featureGold">
            <span className="featureIcon">🎹</span>
            <div>
              <strong>Versions</strong>
              <p>Upload takes, track stems, and revisions with clear labeling.</p>
            </div>
          </div>
          <div className="featureItem featurePurple">
            <span className="featureIcon">🎤</span>
            <div>
              <strong>Review notes</strong>
              <p>Leave feedback at specific timestamps in each version.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
