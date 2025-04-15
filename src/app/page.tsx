import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect ke home-screen di dalam grup (dashboard)
  // Folder dengan tanda kurung tidak menjadi bagian dari URL
  redirect('/home-screen');
  return null;
}
