// Kerangka pemuatan halaman artikel.
export default function ArticleLoading() {
  return (
    <div className="wrap sk-page" role="status" aria-label="Memuat artikel">
      <div className="sk sk-line" style={{ width: 90 }} />
      <div className="sk sk-headline" />
      <div className="sk sk-headline" style={{ width: "58%" }} />
      <div className="sk sk-line" style={{ width: "46%" }} />
      <div className="sk sk-media sk-media--wide" />
      <div className="sk-text">
        {Array.from({ length: 6 }, (_, index) => (
          <div className="sk sk-line" key={index} style={{ width: index % 3 === 2 ? "64%" : "100%" }} />
        ))}
      </div>
    </div>
  );
}
