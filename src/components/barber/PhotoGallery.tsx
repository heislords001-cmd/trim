import Image from "next/image";

export default function PhotoGallery({
  images
}: {
  images: { id: string; image_url: string; image_type: string }[];
}) {
  if (images.length === 0) return null;
  return (
    <div className="grid grid-cols-3 gap-2">
      {images.map((image) => (
        <div key={image.id} className="relative aspect-square overflow-hidden rounded-xl bg-surfaceMuted">
          <Image src={image.image_url} alt="" fill className="object-cover" />
        </div>
      ))}
    </div>
  );
}
