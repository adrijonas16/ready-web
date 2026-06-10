'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050/api';

interface NewsItem { id: string; title: string; content?: string; image_url?: string; campaign_slug?: string; campaign_name?: string }

export default function NewsCarousel() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    fetch(`${API}/news?activeOnly=true`).then(r => r.json()).then(d => {
      if (d.success && d.data?.length) setNews(d.data);
    }).catch(() => {});
  }, []);

  if (news.length === 0) return null;

  const next = () => setCurrent(c => (c + 1) % news.length);
  const prev = () => setCurrent(c => (c - 1 + news.length) % news.length);

  const item = news[current];

  return (
    <div className="relative overflow-hidden rounded-[20px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.08)]">
      <div className="relative h-48 md:h-56 bg-slate-900">
        {item.image_url && (
          <img src={item.image_url} alt={item.title} className="absolute inset-0 w-full h-full object-cover opacity-60" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-5">
          {item.campaign_slug && (
            <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full font-bold uppercase mb-2 inline-block">
              {item.campaign_name || 'Oferta'}
            </span>
          )}
          <h3 className="text-white text-lg font-bold mb-1">{item.title}</h3>
          {item.content && <p className="text-white/70 text-xs line-clamp-2">{item.content}</p>}
          {item.campaign_slug && (
            <Link href={`/catalog?campaign=${item.campaign_slug}`}
              className="mt-2 inline-block bg-white text-slate-900 px-4 py-1.5 rounded-lg text-xs font-bold hover:shadow-lg transition-shadow">
              Ver ofertas
            </Link>
          )}
        </div>
      </div>

      {news.length > 1 && (
        <>
          <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white hover:bg-white/40 transition-colors">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white hover:bg-white/40 transition-colors">
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="absolute bottom-2 right-4 flex gap-1">
            {news.map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${i === current ? 'bg-white w-4' : 'bg-white/40'}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
