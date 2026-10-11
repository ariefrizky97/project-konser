import Link from "next/link";
import { AdSlot } from "@/components/site/AdSlot";
import { CategoryBlock } from "@/components/site/CategoryBlock";
import { ColsBalance } from "@/components/site/ColsBalance";
import { Countdown } from "@/components/site/Countdown";
import { EventRow } from "@/components/site/EventCard";
import { EventCalendar, type CalendarEvent } from "@/components/site/EventCalendar";
import { HeroSlider, type HeroSlide } from "@/components/site/HeroSlider";
import { IconSearch } from "@/components/site/Icons";
import { PostCard } from "@/components/site/PostCard";
import { SectionHead } from "@/components/site/SectionHead";
import { Social } from "@/components/site/Social";
import { Tile } from "@/components/site/Tile";
import { WeatherWidget } from "@/components/site/Weather";
import { dayKey, monthBounds, monthKey, safeUrl } from "@/lib/format";
import { sized } from "@/lib/media";
import {
  listActiveSlides,
  listCategories,
  listEventTypes,
  listEvents,
  listPopularPosts,
  listPopularTags,
  listPosts,
} from "@/lib/queries";
import { getSettings } from "@/lib/settings";
import { skeletonDelay } from "@/lib/skeleton";
import { youtubeId } from "@/lib/youtube";
import { categoryYoutube } from "@/lib/ytlist";

const SIX_MONTHS = 183 * 24 * 60 * 60 * 1000;

export default async function HomePage() {
  const now = new Date();
  // Kalender memuat event dari awal bulan ini sampai enam bulan ke depan.
  const monthStart = monthBounds(monthKey(now))?.start ?? now;

  const [settings, latest, events, calendarEvents, popular, categories, eventTypes, tags, slides] =
    await Promise.all([
      getSettings(),
      listPosts({ limit: 14 }),
      listEvents({ limit: 6 }),
      listEvents({ range: { start: monthStart, end: new Date(now.getTime() + SIX_MONTHS) }, limit: 200 }),
      listPopularPosts(5),
      listCategories(),
      listEventTypes(),
      listPopularTags(12),
      listActiveSlides(),
      skeletonDelay(),
    ]);

  // Mozaik pembuka: kotak besar di kiri berisi slide dari admin (atau artikel terbaru
  // bila belum ada slide), empat kotak kecil di kanan berisi artikel terbaru.
  const heroSlides: HeroSlide[] = slides.map((slide) => ({
    id: slide.id,
    kind: slide.kind,
    title: slide.title,
    caption: slide.caption,
    image: slide.image_url ? sized(slide.image_url, 1600) : null,
    videoId: slide.kind === "video" ? youtubeId(slide.video_url) : null,
    href: safeUrl(slide.link_url),
  }));
  const hasSlider = heroSlides.length > 0;
  const lead = hasSlider ? null : latest[0];
  const side = latest.slice(hasSlider ? 0 : 1, hasSlider ? 4 : 5);
  const shown = new Set([lead?.id, ...side.map((post) => post.id)]);
  const grid = latest.filter((post) => !shown.has(post.id)).slice(0, 6);

  const nextEvent = events.find((event) => event.starts_at > now);
  const calendar: CalendarEvent[] = calendarEvents.map((event) => ({
    id: event.id,
    title: event.title,
    slug: event.slug,
    start: dayKey(event.starts_at),
    end: dayKey(event.ends_at ?? event.starts_at),
    place: [event.venue_name, event.city].filter(Boolean).join(", "),
  }));

  // Tiap kategori mendapat blok sendiri: sampai tiga halaman berisi tujuh artikel,
  // ditambah daftar video YouTube bila diisi di Admin > Kategori & label.
  const blocks = (
    await Promise.all(
      categories.map(async (category) => {
        const [posts, youtube] = await Promise.all([
          listPosts({ categorySlug: category.slug, limit: 21 }),
          categoryYoutube(category),
        ]);
        return { category, posts, videos: youtube.list };
      }),
    )
  ).filter((block) => block.posts.length > 0 || block.videos);

  if (!latest.length && !events.length && !hasSlider) {
    return (
      <div className="wrap blank">
        <h1 className="blank-title">Belum ada konten</h1>
        <p>Tulis artikel atau tambahkan event pertama dari halaman admin.</p>
        <div className="blank-actions">
          <Link href="/admin" className="btn">
            Buka admin
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <h1 className="sr">
        {settings.site_name}: {settings.tagline}
      </h1>

      {(hasSlider || lead) && (
        <section className="wrap mosaic" aria-label="Sorotan">
          <div className="mosaic-main">
            {hasSlider ? <HeroSlider slides={heroSlides} /> : lead && <Tile post={lead} large />}
          </div>
          {side.map((post, index) => (
            <Tile key={post.id} post={post} index={index + 1} />
          ))}
        </section>
      )}

      <section className="wrap finder" aria-labelledby="cari-event">
        <h2 className="label-title" id="cari-event">
          Cari event
        </h2>
        <form className="finder-form" action="/cari" role="search">
          <label className="sr" htmlFor="finder-q">
            Nama event, kota, atau tempat
          </label>
          <input id="finder-q" name="q" type="search" placeholder="Cari nama event, kota, atau tempat" minLength={2} required />
          <button type="submit" className="icon-btn" aria-label="Cari event">
            <IconSearch />
          </button>
        </form>
        {eventTypes.length > 0 && (
          <div className="finder-types">
            {eventTypes.slice(0, 6).map((type) => (
              <Link key={type.id} href={`/event?tipe=${type.slug}`} className="finder-type">
                <span className="finder-dot" style={{ background: type.color || undefined }} />
                {type.name}
              </Link>
            ))}
          </div>
        )}
      </section>

      <div className="wrap cols">
        <div className="cols-main">
          {grid.length > 0 && (
            <section className="sec">
              <SectionHead title="Berita terbaru" href="/berita" linkLabel="Semua berita" />
              <div className="grid2">
                {grid.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            </section>
          )}

          <AdSlot slot="inline" />

          {events.length > 0 && (
            <section className="sec">
              <SectionHead title="Agenda terdekat" href="/event" linkLabel="Semua agenda" />
              <div className="erows">
                {events.map((event) => (
                  <EventRow key={event.id} event={event} />
                ))}
              </div>
            </section>
          )}

          <ColsBalance />
        </div>

        <aside className="cols-side" aria-label="Widget">
          {nextEvent && (
            <section className="widget widget--deep" aria-labelledby="w-menuju">
              <h2 className="widget-title" id="w-menuju">
                Event terdekat
              </h2>
              <p className="widget-lead">
                <Link href={`/event/${nextEvent.slug}`}>{nextEvent.title}</Link>
              </p>
              <Countdown target={nextEvent.starts_at.toISOString()} now={now.toISOString()} />
            </section>
          )}

          <EventCalendar events={calendar} today={dayKey(now)} />

          <WeatherWidget />

          {(settings.instagram || settings.tiktok || settings.threads || settings.youtube || settings.facebook) && (
            <section className="widget" aria-labelledby="w-ikuti" data-movable>
              <h2 className="widget-title" id="w-ikuti">
                Ikuti kami
              </h2>
              <Social settings={settings} className="social--wide" />
            </section>
          )}

          {popular.length > 0 && (
            <section className="widget" aria-labelledby="w-populer" data-movable>
              <h2 className="widget-title" id="w-populer">
                Paling banyak dibaca
              </h2>
              <ol className="rank">
                {popular.map((post) => (
                  <li key={post.id}>
                    <Link href={`/berita/${post.slug}`}>
                      <span className="rank-title">{post.title}</span>
                      {post.category_name && <span className="rank-cat">{post.category_name}</span>}
                    </Link>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {tags.length > 0 && (
            <section className="widget" aria-labelledby="w-tagar" data-movable>
              <h2 className="widget-title" id="w-tagar">
                Tagar populer
              </h2>
              <div className="tagrow">
                {tags.map((tag) => (
                  <Link key={tag.id} href={`/tagar/${encodeURIComponent(tag.slug)}`} className="hashtag">
                    #{tag.name}
                  </Link>
                ))}
              </div>
            </section>
          )}

        </aside>
      </div>

      {blocks.length > 0 && (
        <div className="wrap catblocks">
          {blocks.map(({ category, posts, videos }) => (
            <CategoryBlock key={category.id} category={category} posts={posts} videos={videos} />
          ))}
        </div>
      )}
    </>
  );
}
