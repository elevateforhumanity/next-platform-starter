// TODO: reconnect when marketing DB is ready
export default function HeroVideo({ src, poster }: { src?: string; poster?: string }) {
  return poster ? <img src={poster} alt="Hero" className="w-full object-cover" /> : null;
}
