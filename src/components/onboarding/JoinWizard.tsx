"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import { dayLabel } from "@/lib/utils/format";
import {
  createBarberAccount,
  createBarberProfile,
  saveBarberLocation,
  saveBarberServices,
  saveBarberHours,
  saveBarberImages,
  finishOnboarding
} from "@/actions/onboarding";

const LocationPicker = dynamic(() => import("./LocationPicker"), { ssr: false });

const STEP_LABELS = ["Account", "Business", "Location", "Services", "Hours", "Photos", "Review"];

type ServiceDraft = { name: string; priceNaira: number; durationMinutes: number | null };
type HourDraft = { dayOfWeek: number; isOpen: boolean; openTime: string | null; closeTime: string | null };

export default function JoinWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [barberId, setBarberId] = useState<string | null>(null);
  const [slug, setSlug] = useState<string | null>(null);

  const [account, setAccount] = useState({ fullName: "", email: "", phone: "", password: "" });
  const [business, setBusiness] = useState({ businessName: "", description: "", businessPhone: "", whatsappNumber: "" });
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [location, setLocation] = useState({ address: "", city: "", stateRegion: "", country: "Nigeria", lat: 9.0765, lng: 7.3986 });
  const [services, setServices] = useState<ServiceDraft[]>([{ name: "Haircut", priceNaira: 3000, durationMinutes: 30 }]);
  const [hours, setHours] = useState<HourDraft[]>(
    Array.from({ length: 7 }, (_, day) => ({
      dayOfWeek: day,
      isOpen: day !== 0,
      openTime: "09:00",
      closeTime: "20:00"
    }))
  );
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  function next() {
    setError(null);
    setStep((s) => Math.min(s + 1, STEP_LABELS.length - 1));
  }

  async function handleAccountSubmit() {
    setSaving(true);
    setError(null);
    const result = await createBarberAccount(account);
    setSaving(false);
    if (!result.ok || !result.data) return setError(result.error ?? "Something went wrong");
    setOwnerId(result.data.userId);
    next();
  }

  async function handleBusinessSubmit() {
    if (!ownerId) return setError("Missing account — go back to step 1.");
    setSaving(true);
    setError(null);
    const result = await createBarberProfile({ ownerId, ...business, logoUrl });
    setSaving(false);
    if (!result.ok || !result.data) return setError(result.error ?? "Something went wrong");
    setBarberId(result.data.barberId);
    setSlug(result.data.slug);
    next();
  }

  async function handleLocationSubmit() {
    if (!barberId) return setError("Missing business — go back to step 2.");
    setSaving(true);
    setError(null);
    const result = await saveBarberLocation({ barberId, ...location });
    setSaving(false);
    if (!result.ok) return setError(result.error ?? "Something went wrong");
    next();
  }

  async function handleServicesSubmit() {
    if (!barberId) return;
    setSaving(true);
    setError(null);
    const result = await saveBarberServices(barberId, services);
    setSaving(false);
    if (!result.ok) return setError(result.error ?? "Something went wrong");
    next();
  }

  async function handleHoursSubmit() {
    if (!barberId) return;
    setSaving(true);
    setError(null);
    const result = await saveBarberHours(
      barberId,
      hours.map((h) => ({ dayOfWeek: h.dayOfWeek, isOpen: h.isOpen, openTime: h.openTime, closeTime: h.closeTime }))
    );
    setSaving(false);
    if (!result.ok) return setError(result.error ?? "Something went wrong");
    next();
  }

  async function handlePhotosSubmit() {
    if (!barberId) return;
    setSaving(true);
    setError(null);
    const result = await saveBarberImages(barberId, photoUrls.map((url) => ({ url, type: "shop" as const })));
    setSaving(false);
    if (!result.ok) return setError(result.error ?? "Something went wrong");
    next();
  }

  async function handleFileUpload(files: FileList | null) {
    if (!files || !barberId) return;
    setUploading(true);
    const supabase = createClient();
    const uploaded: string[] = [];
    for (const file of Array.from(files)) {
      const path = `${barberId}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("barber-photos").upload(path, file);
      if (!error) {
        const { data } = supabase.storage.from("barber-photos").getPublicUrl(path);
        uploaded.push(data.publicUrl);
      }
    }
    setPhotoUrls((prev) => [...prev, ...uploaded]);
    setUploading(false);
  }

  async function handleFinish() {
    setSaving(true);
    await finishOnboarding();
    setSaving(false);
    router.push("/dashboard");
  }

  return (
    <div className="mx-auto max-w-lg px-4 pb-16 pt-8">
      <div className="mb-6 flex items-center gap-1">
        {STEP_LABELS.map((label, i) => (
          <div key={label} className={`h-1 flex-1 rounded-full ${i <= step ? "bg-accent" : "bg-border"}`} />
        ))}
      </div>
      <p className="mb-1 text-xs uppercase tracking-wide text-textMuted">
        Step {step + 1} of {STEP_LABELS.length}
      </p>
      <h1 className="mb-6 text-xl font-semibold">{STEP_LABELS[step]}</h1>

      {error && <p className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}

      {step === 0 && (
        <div className="flex flex-col gap-3">
          <input placeholder="Full name" value={account.fullName} onChange={(e) => setAccount({ ...account, fullName: e.target.value })} className="input" />
          <input type="email" placeholder="Email" value={account.email} onChange={(e) => setAccount({ ...account, email: e.target.value })} className="input" />
          <input placeholder="Phone number" value={account.phone} onChange={(e) => setAccount({ ...account, phone: e.target.value })} className="input" />
          <input type="password" placeholder="Password" value={account.password} onChange={(e) => setAccount({ ...account, password: e.target.value })} className="input" />
          <button onClick={handleAccountSubmit} disabled={saving} className="btn-primary">{saving ? "Creating…" : "Continue"}</button>
        </div>
      )}

      {step === 1 && (
        <div className="flex flex-col gap-3">
          <input placeholder="Barbershop name" value={business.businessName} onChange={(e) => setBusiness({ ...business, businessName: e.target.value })} className="input" />
          <textarea placeholder="Business description" value={business.description} onChange={(e) => setBusiness({ ...business, description: e.target.value })} className="input min-h-24" />
          <input placeholder="Business phone" value={business.businessPhone} onChange={(e) => setBusiness({ ...business, businessPhone: e.target.value })} className="input" />
          <input placeholder="WhatsApp number" value={business.whatsappNumber} onChange={(e) => setBusiness({ ...business, whatsappNumber: e.target.value })} className="input" />
          <div>
            <label className="mb-1 block text-xs text-textMuted">Logo / profile image</label>
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const supabase = createClient();
                const path = `pending/${Date.now()}-${file.name}`;
                const { error } = await supabase.storage.from("barber-logos").upload(path, file);
                if (!error) setLogoUrl(supabase.storage.from("barber-logos").getPublicUrl(path).data.publicUrl);
              }}
              className="text-sm"
            />
          </div>
          <button onClick={handleBusinessSubmit} disabled={saving} className="btn-primary">{saving ? "Saving…" : "Continue"}</button>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-3">
          <input placeholder="Country" value={location.country} onChange={(e) => setLocation({ ...location, country: e.target.value })} className="input" />
          <input placeholder="State / region" value={location.stateRegion} onChange={(e) => setLocation({ ...location, stateRegion: e.target.value })} className="input" />
          <input placeholder="City" value={location.city} onChange={(e) => setLocation({ ...location, city: e.target.value })} className="input" />
          <input placeholder="Street address" value={location.address} onChange={(e) => setLocation({ ...location, address: e.target.value })} className="input" />
          <p className="text-xs text-textMuted">Drag the pin to your exact shop location.</p>
          <LocationPicker
            lat={location.lat}
            lng={location.lng}
            onChange={(lat, lng) => setLocation((l) => ({ ...l, lat, lng }))}
          />
          <button onClick={handleLocationSubmit} disabled={saving} className="btn-primary">{saving ? "Saving…" : "Continue"}</button>
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col gap-3">
          {services.map((service, i) => (
            <div key={i} className="flex gap-2">
              <input
                placeholder="Service name"
                value={service.name}
                onChange={(e) => setServices((s) => s.map((row, idx) => (idx === i ? { ...row, name: e.target.value } : row)))}
                className="input flex-1"
              />
              <input
                type="number"
                placeholder="₦ Price"
                value={service.priceNaira}
                onChange={(e) => setServices((s) => s.map((row, idx) => (idx === i ? { ...row, priceNaira: Number(e.target.value) } : row)))}
                className="input w-28"
              />
              <button onClick={() => setServices((s) => s.filter((_, idx) => idx !== i))} className="px-2 text-textMuted">✕</button>
            </div>
          ))}
          <button
            onClick={() => setServices((s) => [...s, { name: "", priceNaira: 0, durationMinutes: 30 }])}
            className="rounded-lg border border-dashed border-border py-2 text-sm text-textMuted"
          >
            + Add another service
          </button>
          <button onClick={handleServicesSubmit} disabled={saving} className="btn-primary">{saving ? "Saving…" : "Continue"}</button>
        </div>
      )}

      {step === 4 && (
        <div className="flex flex-col gap-2">
          {hours.map((h, i) => (
            <div key={h.dayOfWeek} className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2">
              <span className="w-24 text-sm">{dayLabel(h.dayOfWeek)}</span>
              <label className="flex items-center gap-1 text-xs text-textMuted">
                <input
                  type="checkbox"
                  checked={h.isOpen}
                  onChange={(e) => setHours((prev) => prev.map((row, idx) => (idx === i ? { ...row, isOpen: e.target.checked } : row)))}
                />
                Open
              </label>
              {h.isOpen && (
                <>
                  <input type="time" value={h.openTime ?? ""} onChange={(e) => setHours((prev) => prev.map((row, idx) => (idx === i ? { ...row, openTime: e.target.value } : row)))} className="input flex-1 py-1" />
                  <input type="time" value={h.closeTime ?? ""} onChange={(e) => setHours((prev) => prev.map((row, idx) => (idx === i ? { ...row, closeTime: e.target.value } : row)))} className="input flex-1 py-1" />
                </>
              )}
            </div>
          ))}
          <button onClick={handleHoursSubmit} disabled={saving} className="btn-primary mt-2">{saving ? "Saving…" : "Continue"}</button>
        </div>
      )}

      {step === 5 && (
        <div className="flex flex-col gap-3">
          <input type="file" multiple accept="image/*" onChange={(e) => handleFileUpload(e.target.files)} className="text-sm" />
          {uploading && <p className="text-sm text-textMuted">Uploading…</p>}
          <div className="grid grid-cols-3 gap-2">
            {photoUrls.map((url) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={url} src={url} alt="" className="aspect-square rounded-xl object-cover" />
            ))}
          </div>
          <button onClick={handlePhotosSubmit} disabled={saving} className="btn-primary">{saving ? "Saving…" : "Continue"}</button>
        </div>
      )}

      {step === 6 && (
        <div className="flex flex-col gap-4">
          <div className="rounded-card border border-border bg-surface p-4 text-sm">
            <p className="font-semibold">{business.businessName}</p>
            <p className="mt-1 text-textMuted">{location.address}, {location.city}</p>
            <p className="mt-1 text-textMuted">{services.length} services · {photoUrls.length} photos</p>
          </div>
          <p className="text-sm text-textMuted">
            Your profile will be reviewed by our team before it appears in search. This usually takes less than 24 hours.
          </p>
          <button onClick={handleFinish} disabled={saving} className="btn-primary">{saving ? "Submitting…" : "Submit for review"}</button>
        </div>
      )}
    </div>
  );
}
