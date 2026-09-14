const images = [
  "/images/gym-1.png",
  "/images/gym-2.png",
  "/images/gym-3.png",
  "/images/gym-4.png",
  "/images/gym-5.png",
  "/images/gym-6.png",
  "/images/gym-7.png",
  "/images/gym-8.png",
  "/images/gym-9.png",
  "/images/gym-10.png",
];


export default function Gallery() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="text-center text-3xl font-bold text-ink">
        Gallery
      </h1>

      <p className="mt-2 text-center text-muted">
        A look inside BODY FLEX.
      </p>

      <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {images.map((image, index) => (
          <div
            key={image}
            className="aspect-square overflow-hidden rounded-xl border border-line bg-gray-100"
          >
            <img
              src={image}
              alt={`BODY FLEX Gym ${index + 1}`}
              className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
            />
          </div>
        ))}
      </div>
    </div>
  );
}