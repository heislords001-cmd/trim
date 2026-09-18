"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { saveBarberImages } from "@/actions/onboarding";

export default function PhotosEditor({
  barberId,
  initialUrls
}: {
  barberId: string;
  initialUrls: string[];
}) {
  const [urls, setUrls] = useState<string[]>(initialUrls);
  const [uploading, setUploading] = useState(false);

  async function handleFileUpload(files: FileList | null) {
    if (!files) return;
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
    const next = [...urls, ...uploaded];
    setUrls(next);
    await saveBarberImages(barberId, uploaded.map((url) => ({ url, type: "shop" as const })));
    setUploading(false);
  }

  return (
    <div className="flex flex-col gap-3">
      <input type="file" multiple accept="image/*" onChange={(e) => handleFileUpload(e.target.files)} className="text-sm" />
      {uploading && <p className="text-sm text-textMuted">Uploading…</p>}
      <div className="grid grid-cols-3 gap-2">
        {urls.map((url) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={url} src={url} alt="" className="aspect-square rounded-xl object-cover" />
        ))}
      </div>
    </div>
  );
}
