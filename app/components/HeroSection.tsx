'use client';

const HeroSection = () => {
  return (
    <section className="min-h-screen flex flex-col items-center justify-center text-center px-6 text-white z-20">
      <div className="max-w-3xl animate-fade-in space-y-6">
        <h1 className="text-4xl md:text-6xl font-bold drop-shadow-lg">
          Happy 12th Year Wedding Anniversary!
        </h1>
        <p className="text-lg md:text-xl text-white/90">
          A celebration of our love, journey, and the memories we’ve built together.
        </p>
        <a href="#story">
          <button className="px-6 py-3 bg-white/90 text-rose-600 font-semibold rounded-full shadow-lg hover:bg-white transition duration-300">
            View Our Story
          </button>
        </a>
      </div>
    </section>
  );
};

export default HeroSection;
