import HeroSection from './components/HeroSection';
import StorySection from './components/StorySection';
import MemoriesSection from './components/MemoriesSection';
import MessageWall from './components/MessageWall';
import MessageForm from './components/MessageForm';

export default function Home() {
  return (
    <>
      <section id="hero"><HeroSection/></section>
      <section id="story">
        <StorySection />
        <MemoriesSection />
      </section>
      <section id="messages" className="py-20 px-6 bg-black/40">
      <MessageWall />
      <MessageForm />
    </section>
    </>
  );
}
