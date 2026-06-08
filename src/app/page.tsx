import { CameraRecorder } from "@/components/CameraRecorder";
import { AccountBar } from "@/components/AccountBar";
import { ClipGallery } from "@/components/ClipGallery";

export default function Home() {
  return (
    <main className="min-h-dvh bg-black text-white">
      <CameraRecorder />
      <AccountBar />
      <ClipGallery />
    </main>
  );
}
