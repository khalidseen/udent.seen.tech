import { SplashCursor } from "@/components/ui/splash-cursor";

export default function NoiseDemo() {
  return (
    <div className="w-screen h-screen bg-black flex items-center justify-center">
      <div className="text-white text-center p-8 rounded-lg bg-black/50 backdrop-blur-md">
        <h1 className="text-4xl font-bold mb-4">Splash Cursor Demo</h1>
        <p className="mb-6">Move your cursor around to see the effect</p>
        <p className="text-sm opacity-70">WebGL Fluid Simulation</p>
      </div>
      <SplashCursor />
    </div>
  );
}
