import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { getBarberBySlug } from "@/actions/barbers";
import { startConversation } from "@/actions/chat";
import ProfileHeader from "@/components/barber/ProfileHeader";
import ServicesList from "@/components/barber/ServicesList";
import HoursList from "@/components/barber/HoursList";
import PhotoGallery from "@/components/barber/PhotoGallery";

const LocationMap = dynamic(() => import("@/components/barber/LocationMap"), { ssr: false });

export default async function BarberProfilePage({ params }: { params: { slug: string } }) {
  const barber = await getBarberBySlug(params.slug);
  if (!barber) notFound();

  const whatsappHref = barber.whatsapp_number
    ? `https://wa.me/${barber.whatsapp_number.replace(/[^0-9]/g, "")}`
    : null;

  return (
    <main className="mx-auto max-w-2xl px-4 pb-24 pt-8">
      <ProfileHeader
        name={barber.business_name}
        logoUrl={barber.logo_url}
        verified={barber.is_verified}
        rating={barber.rating_average}
        reviewCount={barber.rating_count}
      />

      {barber.description && <p className="mt-6 text-sm leading-relaxed text-textMuted">{barber.description}</p>}

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-textMuted">Services</h2>
        <ServicesList services={barber.services} />
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-textMuted">Opening hours</h2>
        <HoursList hours={barber.hours} />
      </section>

      {barber.images.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-textMuted">Photos</h2>
          <PhotoGallery images={barber.images} />
        </section>
      )}

      {barber.location && (
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-textMuted">Location</h2>
          <p className="mb-3 text-sm text-textMuted">
            {barber.location.address}, {barber.location.city}
            {barber.location.state_region ? `, ${barber.location.state_region}` : ""}
          </p>
          <LocationMap lat={barber.location.lat} lng={barber.location.lng} />
        </section>
      )}

      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-bg/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl gap-2 px-4 py-3">
          <button className="flex-1 rounded-full bg-accent px-4 py-3 text-sm font-medium text-accentInk">
            Book appointment
          </button>
          <form action={startConversation.bind(null, barber.id)} className="flex-1">
            <button className="w-full rounded-full border border-border px-4 py-3 text-sm font-medium text-textPrimary">
              Message
            </button>
          </form>
          {whatsappHref && (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="flex-1 rounded-full border border-border px-4 py-3 text-center text-sm font-medium text-textPrimary"
            >
              WhatsApp
            </a>
          )}
          {barber.business_phone && (
            <a
              href={`tel:${barber.business_phone}`}
              className="flex-1 rounded-full border border-border px-4 py-3 text-center text-sm font-medium text-textPrimary"
            >
              Call
            </a>
          )}
        </div>
      </div>
    </main>
  );
}
