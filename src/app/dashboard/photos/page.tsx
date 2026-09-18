import { getOwnBarberProfile } from "@/actions/barbers";
import PhotosEditor from "@/components/onboarding/PhotosEditor";

export default async function DashboardPhotosPage() {
  const barber = await getOwnBarberProfile();
  if (!barber) return null;

  return <PhotosEditor barberId={barber.id} initialUrls={barber.images.map((img) => img.image_url)} />;
}
