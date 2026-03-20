import { createFileRoute } from "@tanstack/react-router";
import { LandingNavbar } from "@/components/landing-navbar.component";
import { LandingFooter } from "@/components/landing-footer.component";
import {
  Clapperboard,
  Users,
  Globe,
  Map,
  Package,
  UserCheck,
  FlaskConical,
  Mic,
  MousePointerClick,
  Radio,
  Zap,
  Heart,
  Monitor,
  Wifi,
  Mail,
  Library,
} from "lucide-react";

export const Route = createFileRoute("/concept")({
  head: () => ({
    meta: [
      { title: 'Concept — potmagic: Live Story Theater' },
      { name: 'description', content: 'Learn about the vision behind potmagic — a live story theater platform built for Directors, Actors, and Communities to create and share interactive stories in real-time.' },
      { property: 'og:title', content: 'The Concept Behind potmagic' },
      { property: 'og:description', content: 'A deliberate antidote to passive screen consumption. potmagic brings people together through live, collaborative storytelling.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:title', content: 'The Concept Behind potmagic' },
      { name: 'twitter:description', content: 'A deliberate antidote to passive screen consumption. potmagic brings people together through live, collaborative storytelling.' },
    ],
  }),
  component: ConceptPage,
});

function ConceptPage() {
  return (
    <div className="flex min-h-screen flex-col bg-base-200 text-base-content">
      <LandingNavbar />

      <main className="flex-1">
        {/* ── Hero / Vision ── */}
        <section className="hero min-h-[70vh] bg-base-100 relative overflow-hidden">
          {/* Subtle curtain gradient backdrop */}
          <div className="absolute inset-0 bg-gradient-to-b from-accent/5 via-transparent to-base-100 pointer-events-none" />
          <div className="hero-content text-center max-w-3xl py-24 relative z-10">
            <div>
              <div className="badge badge-accent badge-lg font-semibold uppercase tracking-wider mb-6">
                The Vision
              </div>
              <h1 className="font-display text-5xl font-bold leading-tight mb-6">
                Live Story Theater
              </h1>
              <p className="text-base-content/70 text-lg leading-relaxed mb-10">
                In a world where screen addiction is at an all-time high and yet
                genuine human connection is quietly fading,{" "}
                <span className="text-accent font-semibold">potmagic</span>{" "}
                returns to the roots of active storytelling. We scroll
                endlessly, consume passively, and interact with feeds instead of
                faces — but we rarely <em>create</em> together.{" "}
                <span className="text-accent font-semibold">potmagic</span> is a
                deliberate antidote: a space where people perform, collaborate,
                and truly share a moment.
              </p>

              {/* Three roles */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <RoleCard
                  icon={<Clapperboard className="size-6" />}
                  title="The Director"
                  description="Someone with a story to tell but no physical stage."
                  color="text-primary"
                  bg="bg-primary/10"
                />
                <RoleCard
                  icon={<Users className="size-6" />}
                  title="The Actors"
                  description="Those looking to share a moment of connection across any distance."
                  color="text-accent"
                  bg="bg-accent/10"
                />
                <RoleCard
                  icon={<Globe className="size-6" />}
                  title="The Community"
                  description="An audience that doesn't just watch — they interact directly with the storytellers, shaping the experience in real-time."
                  color="text-success"
                  bg="bg-success/10"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── Director's Workshop ── */}
        <section className="py-20 bg-base-200">
          <div className="max-w-4xl mx-auto px-6">
            <SectionLabel>The Director's Workshop</SectionLabel>
            <h2 className="font-display text-3xl font-bold mb-4">
              Architect the Experience
            </h2>
            <p className="text-base-content/60 mb-12">
              Every great show starts behind the curtain. Here is how a Director
              sets the stage for a production like{" "}
              <em>Little Red Riding Hood</em>.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <WorkshopStep
                step="01"
                icon={<Map className="size-5" />}
                title="Script & Scene Mapping"
                items={[
                  { label: "Narrative Flow", text: "Input story beats and define settings (e.g., The Village, The Deep Bavarian Forest, Grandma's Cottage)." },
                  { label: "Atmosphere", text: 'Select Background Layers (parallax scrolling art) and Music Loops (e.g., "Whimsical Forest" or "Suspenseful Growl").' },
                ]}
              />
              <WorkshopStep
                step="02"
                icon={<Package className="size-5" />}
                title="Asset Curation"
                items={[
                  { label: "Character Assignment", text: 'Select "Digital Puppets" — 2D or 3D assets that respond to actor input.' },
                  { label: "Virtual Props", text: 'Add interactive elements like a "Basket of Treats" or a "Hidden Wolf" behind a tree.' },
                ]}
              />
              <WorkshopStep
                step="03"
                icon={<UserCheck className="size-5" />}
                title="Casting & Invitations"
                items={[
                  { label: "Role Assignment", text: 'Assign characters to specific people (e.g., Daughter as "Red," Grandpa as "The Wolf").' },
                  { label: "The Call", text: "Send unique secure links containing a Digital Mask — the specific puppet that actor will control." },
                ]}
              />
              <WorkshopStep
                step="04"
                icon={<FlaskConical className="size-5" />}
                title="The Rehearsal (Sandbox)"
                items={[
                  { label: "Draft Mode", text: "The stage opens for actors to test movements via mouse, touch, or motion-tracking." },
                  { label: "Live Coaching", text: "The Director uses live voice-chat to give notes and guide the performance." },
                ]}
              />
            </div>
          </div>
        </section>

        {/* ── Actor's Stage ── */}
        <section className="py-20 bg-base-100">
          <div className="max-w-4xl mx-auto px-6">
            <SectionLabel>The Actor's Stage</SectionLabel>
            <h2 className="font-display text-3xl font-bold mb-4">
              Performance &amp; Spontaneity
            </h2>
            <p className="text-base-content/60 mb-12">
              Being an actor on potmagic is about presence, instinct, and play.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <ActorFeature
                icon={<MousePointerClick className="size-5" />}
                title="Entry"
                description="Click the invitation link to enter the Backstage View."
              />
              <ActorFeature
                icon={<Users className="size-5" />}
                title="Control"
                description="Maneuver your character's silhouette or stylized puppet on screen."
              />
              <ActorFeature
                icon={<Mic className="size-5" />}
                title="Voice"
                description="Transmit live audio with optional Character Filters (e.g., deepening the Wolf's voice)."
              />
              <ActorFeature
                icon={<Globe className="size-5" />}
                title="Interaction"
                description="Viewers can speak and interact directly with actors in real-time — no passive crowd."
              />
            </div>
          </div>
        </section>

        {/* ── Showtime ── */}
        <section className="py-20 bg-base-200">
          <div className="max-w-4xl mx-auto px-6">
            <SectionLabel>Showtime</SectionLabel>
            <h2 className="font-display text-3xl font-bold mb-12">
              The Live Broadcast
            </h2>

            <div className="flex flex-col gap-6">
              <ShowtimeRow
                icon={<Radio className="size-5 text-accent" />}
                title="The Link"
                description="A public or private Curtain Link is shared with the audience — no downloads, no sign-up required to watch."
              />
              <div className="divider my-0" />
              <ShowtimeRow
                icon={<Zap className="size-5 text-warning" />}
                title="Live Engagement"
                description='Viewers act as the "Village," triggering sound effects (applause, gasps) or voting on plot points (e.g., "Should Red take the shortcut?").'
              />
              <div className="divider my-0" />
              <ShowtimeRow
                icon={<Heart className="size-5 text-error" />}
                title="Emotional Connection"
                description="The Director orchestrates transitions live while actors provide the soul of the performance."
              />
            </div>
          </div>
        </section>

        {/* ── Technical Requirements ── */}
        <section className="py-20 bg-base-100">
          <div className="max-w-4xl mx-auto px-6">
            <SectionLabel>Under the Hood</SectionLabel>
            <h2 className="font-display text-3xl font-bold mb-12">
              Technical Requirements
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <TechCard
                icon={<Monitor className="size-5" />}
                title="Platform"
                spec="Cross-Platform"
                detail="Web Browsers and Tablet"
              />
              <TechCard
                icon={<Wifi className="size-5" />}
                title="Performance"
                spec="Low Latency via WebRTC"
                detail="Voice and movement synchronised in real-time"
              />
              <TechCard
                icon={<Globe className="size-5" />}
                title="Communication"
                spec="WebRTC Audio / Video"
                detail="Optimal internet connection required"
              />
              <TechCard
                icon={<Mail className="size-5" />}
                title="Account"
                spec="Email Required"
                detail="A working email address to create an account and receive invites"
              />
              <TechCard
                icon={<Library className="size-5" />}
                title="Asset Library"
                spec="Multi-format Support"
                detail="Still images, sound effects, and Rive-powered animated characters"
              />
            </div>
          </div>
        </section>

        {/* ── Closing CTA ── */}
        <section className="py-24 bg-base-200 text-center">
          <div className="max-w-2xl mx-auto px-6">
            <p className="font-display text-2xl font-semibold text-base-content/80 italic">
              "Distance is no longer a barrier to the magic of the theater."
            </p>
            <div className="mt-2 text-accent font-semibold tracking-wide">
              — potmagic
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}

/* ── Sub-components ── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-accent font-semibold uppercase tracking-widest text-sm mb-3">
      {children}
    </p>
  );
}

function RoleCard({
  icon,
  title,
  description,
  color,
  bg,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  bg: string;
}) {
  return (
    <div className="card bg-base-200 border border-base-300 shadow-sm text-left">
      <div className="card-body gap-3 p-5">
        <div className={`size-10 rounded-xl flex items-center justify-center ${bg} ${color}`}>
          {icon}
        </div>
        <h3 className="font-display font-semibold text-base">{title}</h3>
        <p className="text-base-content/60 text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function WorkshopStep({
  step,
  icon,
  title,
  items,
}: {
  step: string;
  icon: React.ReactNode;
  title: string;
  items: { label: string; text: string }[];
}) {
  return (
    <div className="card bg-base-100 border border-base-300 shadow-sm">
      <div className="card-body gap-4 p-6">
        <div className="flex items-center gap-3">
          <span className="font-display text-3xl font-bold text-base-content/10 leading-none">
            {step}
          </span>
          <div className="size-9 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
            {icon}
          </div>
          <h3 className="font-display font-semibold text-sm">{title}</h3>
        </div>
        <ul className="flex flex-col gap-3">
          {items.map((item) => (
            <li key={item.label} className="text-sm text-base-content/70 leading-relaxed">
              <span className="font-semibold text-base-content">{item.label}:</span>{" "}
              {item.text}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ActorFeature({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="card bg-base-200 border border-base-300 shadow-sm">
      <div className="card-body gap-3 p-5 items-center text-center">
        <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          {icon}
        </div>
        <h3 className="font-display font-semibold text-sm">{title}</h3>
        <p className="text-base-content/60 text-xs leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function ShowtimeRow({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="size-10 rounded-xl bg-base-100 border border-base-300 flex items-center justify-center shrink-0 mt-1">
        {icon}
      </div>
      <div>
        <h3 className="font-display font-semibold text-base mb-1">{title}</h3>
        <p className="text-base-content/60 text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function TechCard({
  icon,
  title,
  spec,
  detail,
}: {
  icon: React.ReactNode;
  title: string;
  spec: string;
  detail: string;
}) {
  return (
    <div className="card bg-base-200 border border-base-300 shadow-sm">
      <div className="card-body gap-3 p-5">
        <div className="size-10 rounded-xl bg-neutral text-neutral-content flex items-center justify-center">
          {icon}
        </div>
        <p className="text-base-content/50 text-xs uppercase tracking-wider">{title}</p>
        <p className="font-display font-semibold text-sm">{spec}</p>
        <p className="text-base-content/60 text-xs leading-relaxed">{detail}</p>
      </div>
    </div>
  );
}
