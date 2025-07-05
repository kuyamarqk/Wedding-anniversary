'use client';

const StorySection = () => {
  return (
    <section
      id="story"
      className="min-h-screen flex flex-col items-center justify-center text-center px-6 py-20 text-gray-900 bg-white/30 backdrop-blur-md rounded-xl mx-4 my-8 shadow-lg"
    >
      <div className="max-w-3xl space-y-6">
        <h2 className="text-4xl md:text-5xl font-bold text-rose-600 drop-shadow-md">
          Our Story
        </h2>
        <p className="text-lg leading-relaxed drop-shadow-sm">
          It all began last 2009 – a journey filled with ups and down, laughter and tears, success and suffering. Form the first moment we met to every little milestone that we have created. Our story is a testament to enduring love and shared dreams. 
        </p>
        <p className="text-lg leading-relaxed drop-shadow-sm">
          From calling each other Ate and Kuya, to lovingly saying Asxawa ko, and now being known simply as Mama and Papa — our journey has been nothing short of magical. What began as a friendship slowly blossomed into a deep and lasting love, one that has weathered countless seasons and grown stronger through every joy and challenge.
        </p>
        <p className="text-lg leading-relaxed drop-shadow-sm">
          From just the two of us building dreams, we've become a little family — one that now feels big with all the love, laughter, and memories we've created together. And as we eagerly wait for the newest blessing to arrive, we pray for a healthy and happy addition to this life we've built.
        </p>
        <p className="text-lg leading-relaxed drop-shadow-sm">
          Through all the changes, one thing has always remained the same: our love has been the anchor and light of this home. Here's to the past that shaped us, the present that fills us, and the future that continues to unfold — with hands held tight, hearts full, and faith always leading the way.
        </p>
      </div>
    </section>
  );
};

export default StorySection;
