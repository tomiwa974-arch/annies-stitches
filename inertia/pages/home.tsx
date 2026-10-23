import { Link } from '@inertiajs/react'
import EditorialLayout from './components/EditorialLayout'
import useEditorialMotion from './components/useEditorialMotion'

export default function Welcome() {
  useEditorialMotion('.atelier-home')
  return (
    <EditorialLayout title="Welcome to Annie's Fashion House" variant="home">
      <section className="home-introduction">
        <div className="home-edition">
          <Link href="/">ANNIE'S FASHION HOUSE</Link>
          <span>A PERSONAL APPROACH TO GETTING DRESSED</span>
          <span>THE ATELIER</span>
        </div>
        <div className="home-hero-grid">
          <div className="home-hero-copy" data-reveal>
            <p className="atelier-eyebrow">A WORLD OF FABRIC, FORM & FEELING</p>
            <h1>
              <span className="home-wordmark">annie's</span>
              <span>
                Made for
                <br />
                <em>your kind of beautiful.</em>
              </span>
            </h1>
            <p className="home-hero-intro">
              Thoughtful pieces. Personal details. A little room for the unexpected. Welcome to
              Annabel's world of fashion.
            </p>
            <div className="home-actions">
              <Link href="/collection" className="atelier-button">
                Explore the collection ↗
              </Link>
              <Link href="/custom" className="atelier-text-link">
                Make it personal ↗
              </Link>
            </div>
            <a href="#discover" className="home-scroll-note">
              <span>THERE'S MORE TO THE STORY</span>
              <span aria-hidden="true">↓</span>
            </a>
          </div>
          <figure className="home-hero-image" data-reveal>
            <img
              src="/images/generated/studio.png"
              alt="The warm interior of the Annie's fashion studio"
              fetchPriority="high"
            />
            <figcaption>
              <span>01 / INSIDE THE ATELIER</span>
              <span>WHERE IDEAS TAKE SHAPE</span>
            </figcaption>
            <div className="home-image-note">
              A considered cut.
              <br />
              <em>A feeling all your own.</em>
            </div>
          </figure>
        </div>
      </section>
      <section id="discover" className="home-manifesto" data-reveal>
        <span className="atelier-eyebrow">THE ANNIE'S POINT OF VIEW</span>
        <h2>
          Clothes for the occasion.
          <br />
          <em>And the person within.</em>
        </h2>
        <p>
          Discover something you love, imagine something new, or take a little inspiration with you.
          There is more than one way into the house.
        </p>
      </section>
      <section className="home-discover" aria-label="Explore the collection and store">
        <Link
          href="/collection"
          className="home-destination home-destination-collection"
          data-reveal
        >
          <div className="home-destination-heading">
            <span>01 / THE COLLECTION ROOM</span>
            <span aria-hidden="true">↗</span>
          </div>
          <div className="home-destination-image">
            <img
              src="/images/generated/evening.png"
              alt="Black occasion gown with a sculpted silhouette"
              loading="lazy"
            />
          </div>
          <div className="home-destination-caption">
            <h2>
              A point
              <br />
              of <em>view.</em>
            </h2>
            <p>Explore the shapes, details, and expressions of the collection.</p>
          </div>
          <span className="home-destination-link">VIEW THE COLLECTION ↗</span>
        </Link>
        <Link href="/store" className="home-destination home-destination-store" data-reveal>
          <div className="home-destination-heading">
            <span>02 / THE WARDROBE</span>
            <span aria-hidden="true">↗</span>
          </div>
          <div className="home-destination-image">
            <img
              src="/images/generated/custom.png"
              alt="Generated editorial of women's and men's tailored suits"
              loading="lazy"
            />
          </div>
          <div className="home-destination-caption">
            <h2>
              Your next
              <br />
              <em>favourite.</em>
            </h2>
            <p>A wardrobe to explore. Find a piece that feels like you.</p>
          </div>
          <span className="home-destination-link">STEP INTO THE STORE ↗</span>
        </Link>
      </section>
      <section className="home-bespoke" data-reveal>
        <div>
          <p className="atelier-eyebrow">SOME IDEAS DESERVE THEIR OWN PATTERN</p>
          <h2>
            A thought.
            <br />A conversation.
            <br />
            <em>Something yours.</em>
          </h2>
        </div>
        <div>
          <p>
            A special occasion, an imagined silhouette, or simply a feeling. Start a conversation
            with the studio about custom wear and a personal fitting.
          </p>
          <Link href="/custom#booking" className="atelier-button">
            Meet us at the fitting table ↗
          </Link>
          <span className="home-bespoke-note">CONSULTATIONS / CUSTOM WEAR / FITTINGS</span>
        </div>
      </section>
      <section className="home-journal" data-reveal>
        <div className="home-journal-cover" aria-hidden="true">
          <span>THE ATELIER EDIT / VOL. 01</span>
          <strong>annie's</strong>
          <img src="/images/generated/evening.png" alt="" loading="lazy" />
          <em>
            The art of
            <br />
            being yourself.
          </em>
        </div>
        <div className="home-journal-copy">
          <p className="atelier-eyebrow">A MOMENT TO TURN THE PAGE</p>
          <h2>
            Good style.
            <br />
            <em>A closer look.</em>
          </h2>
          <p>
            Enter the reading room. Explore the first Atelier Edit, a few pages on silhouette,
            individuality, and the details worth noticing.
          </p>
          <Link href="/magazine" className="atelier-text-link">
            Open the magazine ↗
          </Link>
        </div>
      </section>
      <section className="home-about" data-reveal>
        <span className="home-about-monogram" aria-hidden="true">
          A.
        </span>
        <div>
          <p className="atelier-eyebrow">THE PERSON BEHIND THE PIECES</p>
          <h2>
            A little more
            <br />
            <em>about Annabel.</em>
          </h2>
          <p>Get to know the person and the point of view behind Annie's Fashion House.</p>
          <Link href="/about" className="atelier-text-link">
            Meet Annabel ↗
          </Link>
        </div>
      </section>
    </EditorialLayout>
  )
}
