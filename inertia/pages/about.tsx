import { Link } from '@inertiajs/react'
import EditorialLayout from './components/EditorialLayout'

export default function About() {
  return (
    <EditorialLayout title="About Annabel" variant="about">
      <section className="atelier-about-hero">
        <div>
          <p className="atelier-eyebrow">THE WOMAN BEHIND THE STITCHES</p>
          <h1>
            A personal eye.
            <br />
            An <em>individual</em>
            <br />
            point of view.
          </h1>
          <p className="atelier-intro">
            Meet Annabel, the person behind Annie's Fashion House. A world of expressive clothes,
            thoughtful details, and room to be yourself.
          </p>
          <a href="#story" className="atelier-text-link">
            Step inside her world ↓
          </a>
        </div>
        <figure className="atelier-studio-image">
          <span className="about-photo-label">A GLIMPSE INTO MY WORLD</span>
          <img src="/images/generated/studio.png" alt="Inside the Annie's fashion studio" />
          <figcaption>THE ATELIER / WHERE IDEAS TAKE SHAPE</figcaption>
          <span className="atelier-image-note">
            Behind every piece,
            <br />
            <em>a person.</em>
          </span>
        </figure>
      </section>
      <section id="story" className="atelier-story">
        <div className="about-margin-note">
          <p className="atelier-eyebrow">ANNABEL & ANNIE'S</p>
          <span className="about-monogram" aria-hidden="true">
            A.
          </span>
          <span className="about-handwritten">A personal introduction.</span>
        </div>
        <div>
          <h2>
            Clothes are personal.
            <br />
            Their making should be, too.
          </h2>
          <p>
            Annie's is Annabel's fashion business: a place to explore a collection or start a
            conversation about a piece of your own. From an everyday silhouette to an outfit for a
            day you will always remember, the starting point is the person wearing it.
          </p>
          <p>
            Our design language brings together expressive fabric, a considered silhouette, and the
            details that make an outfit feel yours. Come with a clear vision, a handful of
            references, or simply a feeling. There is room to begin with any of them.
          </p>
          <Link href="/custom" className="atelier-text-link">
            Make something personal ↗
          </Link>
          <p className="about-signature">
            Annabel<span>THE PERSON BEHIND ANNIE'S</span>
          </p>
        </div>
      </section>
      <section className="atelier-values">
        <div>
          <span>01 / EXPRESSION</span>
          <h3>Your own kind of beautiful.</h3>
          <p>
            A wardrobe should make space for personality. Explore shape, colour, and the way you
            want to feel.
          </p>
        </div>
        <div>
          <span>02 / CONSIDERATION</span>
          <h3>The details make the piece.</h3>
          <p>
            Fabric, proportion, and finish belong in the same conversation. Small decisions shape
            the whole.
          </p>
        </div>
        <div>
          <span>03 / CONNECTION</span>
          <h3>A conversation, first.</h3>
          <p>
            Custom wear begins with listening: your occasion, your references, your preferences.
          </p>
        </div>
      </section>
      <section className="atelier-invitation">
        <p className="atelier-eyebrow">A NOTE TO YOU</p>
        <h2>
          Come as you are.
          <br />
          Leave with <em>something yours.</em>
        </h2>
        <Link className="atelier-button" href="/custom#booking">
          Start a conversation ↗
        </Link>
      </section>
    </EditorialLayout>
  )
}
